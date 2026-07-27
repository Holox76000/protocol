import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../lib/supabase";
import { postToSlack } from "../../../../../lib/slack";

export const runtime = "nodejs";

type Body = {
  token?: string;
  score?: number;
  reason?: string;
  favorite?: string;
  intent?: string;
};

const INTENT_LABELS: Record<string, string> = {
  using_now:   "Using today",
  after_tweak: "After tweaks",
  not_for_me:  "Doesn't fit",
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Body;
  const { token, score, reason, favorite, intent } = body;

  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "missing token" }, { status: 400 });
  }
  if (typeof score !== "number" || score < 1 || score > 10) {
    return NextResponse.json({ error: "invalid score" }, { status: 400 });
  }
  if (!reason || typeof reason !== "string" || !reason.trim()) {
    return NextResponse.json({ error: "reason required" }, { status: 400 });
  }
  if (!intent || !INTENT_LABELS[intent]) {
    return NextResponse.json({ error: "invalid intent" }, { status: 400 });
  }

  const { data: order, error: fetchErr } = await supabaseAdmin
    .from("dating_orders")
    .select("id, email, first_name, nps_submitted_at, amount_cents")
    .eq("nps_token", token)
    .maybeSingle<{ id: string; email: string; first_name: string | null; nps_submitted_at: string | null; amount_cents: number | null }>();

  if (fetchErr || !order) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (order.nps_submitted_at) {
    // Idempotent — treat as success without re-notifying Slack.
    return NextResponse.json({ ok: true });
  }

  const { error: updateErr } = await supabaseAdmin
    .from("dating_orders")
    .update({
      nps_submitted_at: new Date().toISOString(),
      nps_score: score,
      nps_reason: reason.trim().slice(0, 500),
      nps_favorite_template: favorite ?? null,
      nps_intent: intent,
    })
    .eq("id", order.id);

  if (updateErr) {
    console.error("[nps/dating/submit] update failed", { orderId: order.id, error: updateErr.message });
    return NextResponse.json({ error: "save failed" }, { status: 500 });
  }

  const category = score >= 9 ? "promoter" : score >= 7 ? "passive" : "detractor";
  const categoryEmoji = score >= 9 ? ":green_circle:" : score >= 7 ? ":large_yellow_circle:" : ":red_circle:";

  const lines = [
    `${categoryEmoji} *Dating NPS: ${score}/10* — ${category}`,
    `*${order.first_name ?? "(no name)"}* · \`${order.email}\``,
    favorite ? `_Favorite:_ ${favorite}` : "",
    `_Intent:_ ${INTENT_LABELS[intent]}`,
    "",
    `> ${reason.trim().slice(0, 400).replace(/\n/g, "\n> ")}`,
  ].filter(Boolean).join("\n");

  await postToSlack("ops", { text: lines });

  return NextResponse.json({ ok: true });
}
