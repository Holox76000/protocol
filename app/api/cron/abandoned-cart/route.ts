import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { createCartRecoveryToken } from "../../../../lib/auth";
import { sendAbandonedCartEmail } from "../../../../lib/email";

export const runtime = "nodejs";

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://protocol-club.com";
const EMAIL_1_DELAY_MIN = 10;
const EMAIL_2_DELAY_HOURS = 4;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // ── Email 1 : 10 min après inscription ──
  const cutoff1 = new Date(now.getTime() - EMAIL_1_DELAY_MIN * 60 * 1000).toISOString();

  const { data: users1, error: err1 } = await supabaseAdmin
    .from("users")
    .select("id, email, first_name")
    .eq("has_paid", false)
    .is("cart_email_1_sent_at", null)
    .lte("created_at", cutoff1)
    .limit(50);

  if (err1) console.error("[cron/abandoned-cart] email1 query failed", err1.message);

  // ── Email 2 : 4h après inscription ──
  const cutoff2 = new Date(now.getTime() - EMAIL_2_DELAY_HOURS * 60 * 60 * 1000).toISOString();

  const { data: users2, error: err2 } = await supabaseAdmin
    .from("users")
    .select("id, email, first_name")
    .eq("has_paid", false)
    .is("cart_email_2_sent_at", null)
    .not("cart_email_1_sent_at", "is", null)
    .lte("created_at", cutoff2)
    .limit(50);

  if (err2) console.error("[cron/abandoned-cart] email2 query failed", err2.message);

  const results = { email1: { sent: 0, failed: 0 }, email2: { sent: 0, failed: 0 } };

  for (const user of users1 ?? []) {
    await supabaseAdmin.from("users").update({ cart_email_1_sent_at: now.toISOString() }).eq("id", user.id);

    try {
      const recoveryToken = await createCartRecoveryToken(user.id);
      const checkoutUrl = `${SITE_URL}/api/auth/cart-recovery/verify?token=${recoveryToken}`;

      await sendAbandonedCartEmail({
        email: user.email,
        firstName: user.first_name ?? undefined,
        checkoutUrl,
        emailNumber: 1,
      });
      results.email1.sent++;
    } catch (err) {
      results.email1.failed++;
      console.error("[cron/abandoned-cart] email1 failed", { email: user.email, error: String(err) });
    }
  }

  for (const user of users2 ?? []) {
    await supabaseAdmin.from("users").update({ cart_email_2_sent_at: now.toISOString() }).eq("id", user.id);

    try {
      const recoveryToken = await createCartRecoveryToken(user.id);
      const checkoutUrl = `${SITE_URL}/api/auth/cart-recovery/verify?token=${recoveryToken}`;

      await sendAbandonedCartEmail({
        email: user.email,
        firstName: user.first_name ?? undefined,
        checkoutUrl,
        emailNumber: 2,
      });
      results.email2.sent++;
    } catch (err) {
      results.email2.failed++;
      console.error("[cron/abandoned-cart] email2 failed", { email: user.email, error: String(err) });
    }
  }

  console.log("[cron/abandoned-cart] done", results);
  return NextResponse.json({ ok: true, ...results });
}
