// Slack "sales feed" for dating orders. Every dating order gets a root
// message in #new-sales that is:
//   - posted once at checkout completion,
//   - edited (chat.update) at each status transition so the header always
//     reflects the current state (🆕 → 📸 → ⏳ → ✅),
//   - replied to (thread_ts) with granular details at each transition.
//
// The root message ts is persisted in dating_orders.slack_sales_thread_ts so
// every step can find it back. Missing ts = the bot wasn't configured yet
// when the order landed; the helpers below no-op gracefully.

import { supabaseAdmin } from "./supabase";
import {
  salesChannelId,
  slackPostMessage,
  slackUpdateMessage,
} from "./slack";

// Order revenue is fixed at $39 today. If we ever add tiers/upsells, read
// from dating_orders.amount_cents instead of this constant.
const REVENUE_CENTS_DEFAULT = 3900;

// Rough Stripe fee: 2.9% + $0.30. Used only for the "net" line in Slack —
// not billing-critical, so a light estimate is fine.
function estimateStripeFeeCents(revenueCents: number): number {
  return Math.round(revenueCents * 0.029) + 30;
}

// A single source of truth for the header rendered on the root message.
// Every status the order can be in has a distinct emoji so ops can scan
// #new-sales at a glance without expanding threads.
export type OrderStatus = "paid" | "photos_uploaded" | "generating" | "generated" | "delivered" | "failed";

function renderRootHeader(args: {
  status: OrderStatus;
  email: string;
  firstName: string | null;
  revenueCents: number;
  utm: string | null;
  holdHoursRemaining?: number | null;
}): string {
  const price = `$${(args.revenueCents / 100).toFixed(0)}`;
  const person = `${args.firstName ? `${args.firstName} · ` : ""}${args.email}`;
  const attr = args.utm ? ` · ${args.utm}` : "";

  let label: string;
  switch (args.status) {
    case "paid":
      label = ":new: *NEW SALE";
      break;
    case "photos_uploaded":
      label = ":camera_with_flash: *PHOTOS UPLOADED";
      break;
    case "generating":
      label = ":gear: *GENERATING";
      break;
    case "generated": {
      const hrs = args.holdHoursRemaining ?? 0;
      const holdStr = hrs > 0 ? ` · held ${hrs.toFixed(1)}h` : "";
      label = `:hourglass_flowing_sand: *GENERATED${holdStr}`;
      break;
    }
    case "delivered":
      label = ":white_check_mark: *DELIVERED";
      break;
    case "failed":
      label = ":rotating_light: *FAILED";
      break;
  }

  return `${label} — ${price}* — ${person}${attr}`;
}

// Post the root message for a newly-created dating order. Returns the ts
// (also persisted to dating_orders here so callers don't have to). Silent
// no-op if the bot isn't configured or Slack rejects.
export async function postDatingOrderRoot(args: {
  orderId: string;
  stripeSessionId: string;
  email: string;
  firstName: string | null;
  amountCents: number;
  utmSource: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  piId: string | null;
}): Promise<string | null> {
  const channelId = salesChannelId();
  if (!channelId) return null;

  const utm = [args.utmSource, args.utmCampaign, args.utmContent].filter(Boolean).join(" · ") || null;
  const header = renderRootHeader({
    status: "paid",
    email: args.email,
    firstName: args.firstName,
    revenueCents: args.amountCents || REVENUE_CENTS_DEFAULT,
    utm,
  });

  // Second line: durable order metadata that stays useful across the feed.
  const meta = [
    `Order \`…${args.stripeSessionId.slice(-8)}\``,
    args.piId ? `PI \`${args.piId}\`` : null,
  ].filter(Boolean).join(" · ");
  const text = [header, meta].filter(Boolean).join("\n");

  const res = await slackPostMessage({ channelId, text });
  if (!res.ok || !res.ts) {
    console.error("[dating/slack] root post failed", { error: res.error, orderId: args.orderId });
    return null;
  }

  // Persist the ts on the order so downstream transitions can find it.
  const { error: upErr } = await supabaseAdmin
    .from("dating_orders")
    .update({ slack_sales_thread_ts: res.ts })
    .eq("id", args.orderId);
  if (upErr) {
    console.error("[dating/slack] persist ts failed", { error: upErr.message, orderId: args.orderId });
  }
  return res.ts;
}

// Refresh the root header. Called at every status transition. If ts is
// missing (root was never posted), we fall back to posting a fresh
// message and persist the new ts back on the order. Returns the ts
// that's now live on the message — callers should use this for any
// subsequent thread reply so old-order rows with initially-NULL ts
// still get their thread messages properly attached.
export async function refreshDatingOrderRoot(args: {
  orderId: string;
  ts: string | null;
  status: OrderStatus;
  email: string;
  firstName: string | null;
  stripeSessionId: string;
  amountCents: number | null;
  utmSource: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  holdHoursRemaining?: number | null;
}): Promise<{ ts: string | null }> {
  const channelId = salesChannelId();
  if (!channelId) return { ts: args.ts };

  const utm = [args.utmSource, args.utmCampaign, args.utmContent].filter(Boolean).join(" · ") || null;
  const revenueCents = args.amountCents ?? REVENUE_CENTS_DEFAULT;
  const header = renderRootHeader({
    status: args.status,
    email: args.email,
    firstName: args.firstName,
    revenueCents,
    utm,
    holdHoursRemaining: args.holdHoursRemaining,
  });
  const meta = `Order \`…${args.stripeSessionId.slice(-8)}\``;
  const text = [header, meta].join("\n");

  if (args.ts) {
    const res = await slackUpdateMessage({ channelId, ts: args.ts, text });
    if (res.ok) return { ts: args.ts };
    console.error("[dating/slack] root update failed — falling back to a new post", {
      error: res.error, orderId: args.orderId,
    });
  }

  // Fallback: post fresh and re-persist so the next transition can edit it.
  const post = await slackPostMessage({ channelId, text });
  if (!post.ok || !post.ts) {
    console.error("[dating/slack] root fallback post also failed", { error: post.error, orderId: args.orderId });
    return { ts: null };
  }
  const { error: dbErr } = await supabaseAdmin
    .from("dating_orders")
    .update({ slack_sales_thread_ts: post.ts })
    .eq("id", args.orderId);
  if (dbErr) console.error("[dating/slack] persist new ts failed", { error: dbErr.message, orderId: args.orderId });
  return { ts: post.ts };
}

// Post a threaded reply below the root. Silent no-op if ts missing (nothing
// to reply to) or bot not configured.
export async function replyDatingOrderThread(args: {
  ts: string | null;
  text: string;
}): Promise<void> {
  if (!args.ts) return;
  const channelId = salesChannelId();
  if (!channelId) return;
  await slackPostMessage({
    channelId,
    threadTs: args.ts,
    text: args.text,
  });
}

// Cost + margin snapshot used in the "generated" thread reply.
export function costMarginLines(args: {
  revenueCents: number;
  generationCostCents: number;
}): { costLine: string; marginLine: string } {
  const stripeFee = estimateStripeFeeCents(args.revenueCents);
  const netCents = args.revenueCents - args.generationCostCents - stripeFee;
  const netPct = args.revenueCents > 0 ? (100 * netCents) / args.revenueCents : 0;
  const fmt = (c: number) => `$${(c / 100).toFixed(2)}`;
  return {
    costLine: `Cost: gen ${fmt(args.generationCostCents)} · stripe fee ~${fmt(stripeFee)} = ${fmt(args.generationCostCents + stripeFee)}`,
    marginLine: `Net: ${fmt(args.revenueCents)} rev − costs = *${fmt(netCents)}* (${netPct.toFixed(0)}%)`,
  };
}
