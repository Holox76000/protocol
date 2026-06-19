import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { createCartRecoveryToken } from "../../../../lib/auth";
import { sendAbandonedCartEmail } from "../../../../lib/email";

export const runtime = "nodejs";
export const maxDuration = 60;

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://protocol-club.com";
const EMAIL_1_DELAY_MIN = 10;
const EMAIL_2_DELAY_HOURS = 4;
const BATCH_LIMIT = Number(process.env.CART_EMAIL_BATCH ?? 50);

type FunnelAnswers = Record<string, unknown>;

async function fetchAnswersByFunnelSid(funnelSid: string | null): Promise<FunnelAnswers | null> {
  if (!funnelSid) return null;
  const { data } = await supabaseAdmin
    .from("funnel_sessions")
    .select("answers")
    .eq("session_id", funnelSid)
    .maybeSingle();
  return (data?.answers ?? null) as FunnelAnswers | null;
}

async function isSuppressed(email: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("email_suppressions")
    .select("email")
    .eq("email", email.toLowerCase())
    .maybeSingle();
  return Boolean(data);
}

// Fetch the set of funnel_sids that have a `view_offer` event since `sinceIso`.
// We only send cart-abandon emails to users whose funnel_sid is in this set —
// guarantees recipients actually reached /f1/offer, not just /register via /login.
async function fetchOfferViewers(sinceIso: string): Promise<Set<string>> {
  const sids = new Set<string>();
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await supabaseAdmin
      .from("event_sessions")
      .select("session_id")
      .eq("event", "view_offer")
      .gte("created_at", sinceIso)
      .range(from, from + PAGE - 1);
    if (error || !data || data.length === 0) break;
    for (const row of data) {
      const sid = (row as { session_id: string }).session_id;
      if (sid) sids.add(sid);
    }
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return sids;
}

type UserRow = {
  id: string;
  email: string;
  first_name: string | null;
  funnel_sid: string | null;
};

async function sendOne(user: UserRow, emailNumber: 1 | 2): Promise<{ ok: boolean }> {
  if (await isSuppressed(user.email)) return { ok: false };

  const answers = await fetchAnswersByFunnelSid(user.funnel_sid);
  const morphology    = (answers?.morphology    as string | undefined) ?? undefined;
  const pastSolutions = (answers?.past_solutions as string | string[] | undefined) ?? undefined;

  const recoveryToken = await createCartRecoveryToken(user.id);
  const checkoutUrl = `${SITE_URL}/api/auth/cart-recovery/verify?token=${recoveryToken}`;

  try {
    await sendAbandonedCartEmail({
      email: user.email,
      firstName: user.first_name ?? undefined,
      checkoutUrl,
      emailNumber,
      morphology,
      pastSolutions,
    });
    return { ok: true };
  } catch (err) {
    console.error("[cron/abandoned-cart] send failed", { email: user.email, emailNumber, error: String(err) });
    return { ok: false };
  }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const results = {
    email1: { sent: 0, failed: 0, skipped_no_offer_view: 0 },
    email2: { sent: 0, failed: 0, skipped_no_offer_view: 0 },
  };

  // Pre-fetch the set of funnel_sids that have viewed the offer page.
  // 30-day window is wider than any cart-abandon eligibility window (4h max),
  // so any candidate user's view_offer event will be captured.
  const offerViewSince = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const offerViewers = await fetchOfferViewers(offerViewSince);
  console.log("[cron/abandoned-cart] offer viewers count", offerViewers.size);

  // ── Email 1: 10 min after registration ──
  const cutoff1 = new Date(now.getTime() - EMAIL_1_DELAY_MIN * 60 * 1000).toISOString();
  const { data: users1 } = await supabaseAdmin
    .from("users")
    .select("id, email, first_name, funnel_sid")
    .eq("has_paid", false)
    .is("cart_email_1_sent_at", null)
    .lte("created_at", cutoff1)
    .limit(BATCH_LIMIT);

  for (const user of (users1 ?? []) as UserRow[]) {
    // Mark sent before processing so a missing view_offer isn't retried forever.
    await supabaseAdmin.from("users").update({ cart_email_1_sent_at: now.toISOString() }).eq("id", user.id);

    if (!user.funnel_sid || !offerViewers.has(user.funnel_sid)) {
      results.email1.skipped_no_offer_view++;
      continue;
    }

    const res = await sendOne(user, 1);
    if (res.ok) results.email1.sent++; else results.email1.failed++;
  }

  // ── Email 2: 4h after registration ──
  const cutoff2 = new Date(now.getTime() - EMAIL_2_DELAY_HOURS * 60 * 60 * 1000).toISOString();
  const { data: users2 } = await supabaseAdmin
    .from("users")
    .select("id, email, first_name, funnel_sid")
    .eq("has_paid", false)
    .is("cart_email_2_sent_at", null)
    .not("cart_email_1_sent_at", "is", null)
    .lte("created_at", cutoff2)
    .limit(BATCH_LIMIT);

  for (const user of (users2 ?? []) as UserRow[]) {
    await supabaseAdmin.from("users").update({ cart_email_2_sent_at: now.toISOString() }).eq("id", user.id);

    if (!user.funnel_sid || !offerViewers.has(user.funnel_sid)) {
      results.email2.skipped_no_offer_view++;
      continue;
    }

    const res = await sendOne(user, 2);
    if (res.ok) results.email2.sent++; else results.email2.failed++;
  }

  console.log("[cron/abandoned-cart] done", results);
  return NextResponse.json({ ok: true, ...results });
}
