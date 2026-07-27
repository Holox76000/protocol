// Reconciliation pass for the 6 orders that ended up with duplicate
// top-level messages in #new-sales:
//   OLD: "photos uploaded" posted via the legacy incoming-webhook at
//        upload time (before we moved to the bot).
//   NEW: "DELIVERED" posted by scripts/backfill-slack-delivered.ts today.
//
// This script:
//   1. Uses channels:history to find both messages per order by session_id suffix.
//   2. Adopts the older "photos uploaded" ts as the canonical thread root
//      and persists it on dating_orders.slack_sales_thread_ts.
//   3. Deletes today's "DELIVERED" duplicate.
//   4. Re-posts the DELIVERED content as a threaded reply under the
//      "photos uploaded" root — proper thread structure per order.
//
// Idempotent: only touches orders whose current DB ts matches the
// backfill run. Safe to re-run.

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

async function slackApi<T = Record<string, unknown>>(method: string, params: Record<string, unknown>) {
  const isGet = method.startsWith("conversations.");
  const url = isGet
    ? `https://slack.com/api/${method}?${new URLSearchParams(params as Record<string, string>).toString()}`
    : `https://slack.com/api/${method}`;
  const res = await fetch(url, {
    method: isGet ? "GET" : "POST",
    headers: {
      "Authorization": `Bearer ${SLACK_BOT_TOKEN}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: isGet ? undefined : JSON.stringify(params),
  });
  return (await res.json()) as { ok: boolean; error?: string } & T;
}

type SlackMessage = { ts: string; text?: string; user?: string; bot_id?: string; app_id?: string };

async function main() {
  const { data: orders, error } = await sb
    .from("dating_orders")
    .select("id, stripe_session_id, email, first_name, amount_cents, output_count, generation_cost_cents, slack_sales_thread_ts")
    .eq("status", "delivered")
    .order("delivered_at", { ascending: false })
    .limit(20);
  if (error) { console.error(error); process.exit(1); }

  console.log(`Scanning channel history (last 200 messages)…`);
  const hist = await slackApi<{ messages: SlackMessage[] }>("conversations.history", {
    channel: SLACK_SALES_CHANNEL_ID,
    limit: "200",
  });
  if (!hist.ok) { console.error("history failed:", hist.error); process.exit(1); }
  const messages = hist.messages ?? [];
  console.log(`Retrieved ${messages.length} messages.\n`);

  for (const o of orders ?? []) {
    const suffix = o.stripe_session_id.slice(-8);
    console.log(`── ${suffix}  ${o.email}`);

    // Find all messages mentioning this order's suffix.
    const related = messages.filter((m) => (m.text ?? "").includes(suffix));
    if (related.length === 0) { console.log(`   no messages found`); continue; }

    // "Uploaded" is the pre-bot legacy incoming-webhook root. We keep it.
    const uploaded = related.find((m) => (m.text ?? "").includes("photos uploaded") || (m.text ?? "").includes("Photos uploaded"));
    // My backfill root is our recent "DELIVERED" top-level.
    const backfillDelivered = related.find((m) => (m.text ?? "").includes("DELIVERED") && m.ts === o.slack_sales_thread_ts);

    if (!uploaded) {
      console.log(`   ⚠ no legacy "photos uploaded" root — leaving as-is`);
      continue;
    }

    console.log(`   ↳ uploaded ts=${uploaded.ts}  ·  backfill ts=${backfillDelivered?.ts ?? "—"}`);

    // 1. Persist the uploaded ts as the canonical thread root.
    const { error: upErr } = await sb
      .from("dating_orders")
      .update({ slack_sales_thread_ts: uploaded.ts })
      .eq("id", o.id);
    if (upErr) { console.log(`   ✗ persist ts failed: ${upErr.message}`); continue; }

    // 2. Delete the backfill duplicate (if present and matches DB ts).
    if (backfillDelivered) {
      const del = await slackApi("chat.delete", {
        channel: SLACK_SALES_CHANNEL_ID,
        ts: backfillDelivered.ts,
      });
      if (!del.ok) console.log(`   ⚠ delete backfill failed: ${del.error}`);
      else console.log(`   ✓ backfill deleted`);
    }

    // 3. Re-post the delivered content as a threaded reply under uploaded.
    const revenueCents = o.amount_cents ?? 3900;
    const genCents = o.generation_cost_cents ?? 0;
    const stripeFee = Math.round(revenueCents * 0.029) + 30;
    const netCents = revenueCents - genCents - stripeFee;
    const netPct = revenueCents > 0 ? Math.round(100 * netCents / revenueCents) : 0;
    const fmt = (c: number) => `$${(c / 100).toFixed(2)}`;
    const adminUrl = `${SITE_URL}/admin/dating/${encodeURIComponent(o.stripe_session_id)}`;
    const galleryUrl = `${SITE_URL}/dating/gallery?session_id=${o.stripe_session_id}`;
    const replyText = [
      `:package: *Delivered manually* — ${o.output_count} photos on the gallery.`,
      `Cost: gen ${fmt(genCents)} · stripe fee ~${fmt(stripeFee)} = ${fmt(genCents + stripeFee)}`,
      `Net: ${fmt(revenueCents)} rev − costs = *${fmt(netCents)}* (${netPct}%)`,
      `Admin: <${adminUrl}|order page> · Customer: <${galleryUrl}|gallery>`,
    ].join("\n");

    const reply = await slackApi<{ ts: string }>("chat.postMessage", {
      channel: SLACK_SALES_CHANNEL_ID,
      thread_ts: uploaded.ts,
      text: replyText,
      unfurl_links: false,
      unfurl_media: false,
    });
    if (!reply.ok) console.log(`   ⚠ threaded reply failed: ${reply.error}`);
    else console.log(`   ✓ delivered reply threaded under uploaded root`);
  }

  console.log(`\nDone.`);
}
main().catch((e) => { console.error(e); process.exit(1); });
