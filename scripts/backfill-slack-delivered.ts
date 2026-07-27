// One-off: post a Slack root + delivered thread reply for every dating
// order that's been delivered but has NULL slack_sales_thread_ts. Fixes
// the 6 recent manual deliveries that missed the Slack notification
// because of the void-called serverless bug (now patched in code).
//
// Idempotent: only touches rows where slack_sales_thread_ts IS NULL.
// Persists the new ts back so future updates can edit-in-place.

import { readFileSync } from "fs";
import { resolve } from "path";
const env = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
for (const line of env.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)/);
  if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
}

import { createClient } from "@supabase/supabase-js";

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN!;
const SLACK_SALES_CHANNEL_ID = process.env.SLACK_SALES_CHANNEL_ID!;
const SITE_URL = process.env.SITE_URL ?? "https://protocol-club.com";

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

async function slackPost(text: string, thread_ts?: string): Promise<string | null> {
  const body: Record<string, unknown> = {
    channel: SLACK_SALES_CHANNEL_ID,
    text,
    unfurl_links: false,
    unfurl_media: false,
  };
  if (thread_ts) body.thread_ts = thread_ts;
  const res = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${SLACK_BOT_TOKEN}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  });
  const j = (await res.json()) as { ok: boolean; ts?: string; error?: string };
  if (!j.ok) {
    console.error("  slack post failed:", j.error);
    return null;
  }
  return j.ts ?? null;
}

async function main() {
  const { data: orders, error } = await sb
    .from("dating_orders")
    .select("id, stripe_session_id, email, first_name, amount_cents, output_count, generation_cost_cents, utm_source, utm_campaign, utm_content, delivered_at")
    .is("slack_sales_thread_ts", null)
    .eq("status", "delivered")
    .order("delivered_at", { ascending: true });
  if (error) { console.error(error); process.exit(1); }

  console.log(`Backfilling ${orders?.length ?? 0} delivered orders with missing Slack thread…\n`);

  for (const o of orders ?? []) {
    const person = `${o.first_name ? `${o.first_name} · ` : ""}${o.email}`;
    const utm = [o.utm_source, o.utm_campaign, o.utm_content].filter(Boolean).join(" · ") || null;
    const revenueCents = o.amount_cents ?? 3900;
    const genCents = o.generation_cost_cents ?? 0;
    const stripeFee = Math.round(revenueCents * 0.029) + 30;
    const netCents = revenueCents - genCents - stripeFee;
    const netPct = revenueCents > 0 ? Math.round(100 * netCents / revenueCents) : 0;
    const fmt = (c: number) => `$${(c / 100).toFixed(2)}`;

    const header = `:white_check_mark: *DELIVERED — ${fmt(revenueCents)}* — ${person}${utm ? ` · ${utm}` : ""}`;
    const meta = `Order \`…${o.stripe_session_id.slice(-8)}\``;
    const rootText = [header, meta].join("\n");

    console.log(`  ${o.stripe_session_id.slice(-8)}  ${o.email}`);

    const ts = await slackPost(rootText);
    if (!ts) { console.log("    ✗ root post failed, skipping"); continue; }

    const adminUrl = `${SITE_URL}/admin/dating/${encodeURIComponent(o.stripe_session_id)}`;
    const galleryUrl = `${SITE_URL}/dating/gallery?session_id=${o.stripe_session_id}`;
    const replyText = [
      `:package: *Delivered manually* — ${o.output_count} photos on the gallery.`,
      `Cost: gen ${fmt(genCents)} · stripe fee ~${fmt(stripeFee)} = ${fmt(genCents + stripeFee)}`,
      `Net: ${fmt(revenueCents)} rev − costs = *${fmt(netCents)}* (${netPct}%)`,
      `Admin: <${adminUrl}|order page> · Customer: <${galleryUrl}|gallery>`,
      `_Backfill: this thread was missing due to the void-Slack bug (now patched)._`,
    ].join("\n");

    const replyTs = await slackPost(replyText, ts);
    if (!replyTs) console.log("    ⚠ thread reply failed (root created though)");

    // Persist ts so any future action on this order edits the root.
    const { error: upErr } = await sb
      .from("dating_orders")
      .update({ slack_sales_thread_ts: ts })
      .eq("id", o.id);
    if (upErr) console.log("    ⚠ persist ts failed:", upErr.message);
    else console.log(`    ✓ posted, ts=${ts}`);
  }
}
main().catch(e => { console.error(e); process.exit(1); });
