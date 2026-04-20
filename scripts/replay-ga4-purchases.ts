/**
 * Replay GA4 purchase events for clients who were not tracked.
 * Fetches the last N successful sessions from Stripe (yesterday by default)
 * and fires a GA4 Measurement Protocol "purchase" event for each.
 *
 * Usage:
 *   npx tsx scripts/replay-ga4-purchases.ts
 *
 * Options (env overrides):
 *   REPLAY_LIMIT=2          — number of sessions to replay (default: 2)
 *   REPLAY_DATE=2026-04-19  — target date in YYYY-MM-DD UTC (default: yesterday)
 */

import Stripe from "stripe";
import { createHash } from "crypto";
import { readFileSync } from "fs";
import { resolve } from "path";

// ── Load .env.local ────────────────────────────────────────────────────────────
try {
  const envFile = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
  for (const line of envFile.split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  }
} catch {
  // ignore — env vars may be set directly in the shell
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Extract the GA4 client_id from a raw _ga cookie value. */
function extractGa4ClientId(gaCookie: string | null | undefined): string | null {
  if (!gaCookie) return null;
  // Format: GA1.1.<part1>.<part2>
  const parts = gaCookie.split(".");
  if (parts.length >= 4) return parts.slice(2).join(".");
  return null;
}

/** Compute start/end epoch seconds for a given YYYY-MM-DD UTC date. */
function dayBoundsUTC(dateStr: string): { start: number; end: number } {
  const start = Math.floor(new Date(`${dateStr}T00:00:00Z`).getTime() / 1000);
  const end = Math.floor(new Date(`${dateStr}T23:59:59Z`).getTime() / 1000);
  return { start, end };
}

/** Yesterday's date as YYYY-MM-DD. */
function yesterdayUTC(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

// ── GA4 Measurement Protocol ───────────────────────────────────────────────────

async function sendGA4Purchase(opts: {
  transactionId: string;
  value: number;
  currency: string;
  eventTime: number;
  clientId: string;
  userId?: string;
  sessionId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  country?: string;
}): Promise<{ ok: boolean; status: number; body: string }> {
  const measurementId = process.env.GA4_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_API_SECRET;

  if (!measurementId || !apiSecret) {
    throw new Error("GA4_MEASUREMENT_ID or GA4_API_SECRET not set");
  }

  const payload = {
    client_id: opts.clientId,
    timestamp_micros: String(opts.eventTime * 1_000_000),
    non_personalized_ads: false,
    ...(opts.userId && { user_id: opts.userId }),
    ...(opts.country && { geo: { country: opts.country } }),
    events: [
      {
        name: "purchase",
        params: {
          engagement_time_msec: 1,
          transaction_id: opts.transactionId,
          value: opts.value,
          currency: opts.currency.toUpperCase(),
          items: [
            {
              item_id: "f1-attractiveness-protocol",
              item_name: "Attractiveness Protocol",
              price: opts.value,
              quantity: 1,
            },
          ],
          ...(opts.sessionId && { session_id: opts.sessionId }),
          // Include UTM as custom params for attribution context
          ...(opts.utmSource && { utm_source: opts.utmSource }),
          ...(opts.utmMedium && { utm_medium: opts.utmMedium }),
          ...(opts.utmCampaign && { utm_campaign: opts.utmCampaign }),
          ...(opts.utmContent && { utm_content: opts.utmContent }),
          ...(opts.utmTerm && { utm_term: opts.utmTerm }),
        },
      },
    ],
  };

  const url = `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = await res.text().catch(() => "");
  return { ok: res.ok || res.status === 204, status: res.status, body };
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-02-24.acacia" });

  const limit = parseInt(process.env.REPLAY_LIMIT ?? "2", 10);
  // Expand window by 1 day on each side to account for timezone offsets
  const dateStr = process.env.REPLAY_DATE ?? yesterdayUTC();
  const { end } = dayBoundsUTC(dateStr);
  // Start from 2 days ago to cover late-night purchases in local timezones
  const prevDay = new Date(`${dateStr}T00:00:00Z`);
  prevDay.setUTCDate(prevDay.getUTCDate() - 1);
  const start = Math.floor(prevDay.getTime() / 1000);

  console.log(`\n── GA4 Purchase Replay ──`);
  console.log(`Target date : ${dateStr} (user-local yesterday)`);
  console.log(`Window      : ${new Date(start * 1000).toISOString()} → ${new Date(end * 1000).toISOString()}`);
  console.log(`Limit       : ${limit} payment intents\n`);

  // Fetch succeeded PaymentIntents in the window, most recent first
  const pis = await stripe.paymentIntents.list({
    created: { gte: start, lte: end },
    limit: 100,
  });

  const paid = pis.data
    .filter((p) => p.status === "succeeded")
    .sort((a, b) => b.created - a.created)
    .slice(0, limit);

  if (paid.length === 0) {
    console.log("No succeeded PaymentIntents found for this window.");
    return;
  }

  console.log(`Found ${paid.length} payment intent(s) to replay:\n`);

  for (let i = 0; i < paid.length; i++) {
    const pi = paid[i];
    const meta = (pi.metadata ?? {}) as Record<string, string>;
    const eventTime = pi.created;
    const value = pi.amount / 100;
    const currency = pi.currency ?? "usd";

    // Resolve customer email
    let email: string | null = meta.customer_email ?? null;
    const stripeCustomerId = typeof pi.customer === "string" ? pi.customer : null;
    if (!email && stripeCustomerId) {
      try {
        const customer = await stripe.customers.retrieve(stripeCustomerId);
        if (customer && !("deleted" in customer)) email = customer.email ?? null;
      } catch {}
    }

    // Resolve country from billing details or customer address
    let country: string | null = pi.shipping?.address?.country ?? null;
    if (!country && stripeCustomerId) {
      try {
        const customer = await stripe.customers.retrieve(stripeCustomerId);
        if (customer && !("deleted" in customer)) {
          country = (customer as Stripe.Customer).address?.country ?? null;
        }
      } catch {}
    }

    const rawGaClientId = meta.ga_client_id ?? null;
    const clientId = extractGa4ClientId(rawGaClientId) ?? `fallback-${pi.id}`;

    console.log(`[${i + 1}/${paid.length}] PaymentIntent: ${pi.id}`);
    console.log(`  Email      : ${email ?? "(none)"}`);
    console.log(`  Amount     : ${value} ${currency.toUpperCase()}`);
    console.log(`  Created    : ${new Date(eventTime * 1000).toISOString()}`);
    console.log(`  Country    : ${country ?? "(none)"}`);
    console.log(`  Funnel     : ${meta.funnel ?? "(none)"}`);
    console.log(`  GA clientId: ${clientId} (raw: ${rawGaClientId ?? "(none)"})`);
    console.log(`  UTM source : ${meta.utm_source ?? "(none)"}`);
    console.log(`  UTM medium : ${meta.utm_medium ?? "(none)"}`);
    console.log(`  UTM campaign: ${meta.utm_campaign ?? "(none)"}`);
    console.log(`  UTM content: ${meta.utm_content ?? "(none)"}`);

    const result = await sendGA4Purchase({
      transactionId: pi.id,
      value,
      currency,
      eventTime,
      clientId,
      utmSource: meta.utm_source,
      utmMedium: meta.utm_medium,
      utmCampaign: meta.utm_campaign,
      utmContent: meta.utm_content,
      utmTerm: meta.utm_term,
      country: country ?? undefined,
    });

    if (result.ok) {
      console.log(`  ✓ GA4 event sent (HTTP ${result.status})\n`);
    } else {
      console.error(`  ✗ GA4 event FAILED (HTTP ${result.status}): ${result.body}\n`);
    }
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
