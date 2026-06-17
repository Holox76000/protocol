/**
 * Force re-send d'un événement Purchase Meta CAPI pour un ou plusieurs PaymentIntents.
 * Idempotent : utilise pi.id comme event_id (même clé que le webhook) → Meta dédup.
 *
 * Usage: npx tsx scripts/force-meta-purchase.ts pi_xxx pi_yyy
 */

import { createHash } from "crypto";
import Stripe from "stripe";
import { readFileSync } from "fs";
import { resolve } from "path";

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
  // ignore
}

function sha256(value: string) {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

async function sendPurchase(pi: Stripe.PaymentIntent) {
  const accessToken = process.env.META_ACCESS_TOKEN;
  const pixelId = process.env.META_PIXEL_ID;
  if (!accessToken || !pixelId) throw new Error("META_ACCESS_TOKEN or META_PIXEL_ID not set");

  const meta = (pi.metadata ?? {}) as Record<string, string>;
  const email = meta.customer_email || null;
  const eventTime = pi.created ?? Math.floor(Date.now() / 1000);
  const amount = pi.amount / 100;
  const currency = (pi.currency ?? "usd").toUpperCase();

  const userData: Record<string, string> = {};
  if (email) userData.em = sha256(email);
  if (meta.fbclid) userData.fbc = `fb.1.${eventTime * 1000}.${meta.fbclid}`;

  const body = {
    data: [
      {
        event_name: "Purchase",
        event_time: eventTime,
        event_id: pi.id,
        action_source: "website",
        event_source_url: "https://protocol-club.com/dashboard",
        user_data: userData,
        custom_data: {
          value: amount,
          currency,
          content_name: "Attractiveness Protocol",
          content_ids: ["f1-attractiveness-protocol"],
          content_type: "product",
          funnel: meta.funnel ?? null,
          ...(meta.utm_source && { utm_source: meta.utm_source }),
          ...(meta.utm_medium && { utm_medium: meta.utm_medium }),
          ...(meta.utm_campaign && { utm_campaign: meta.utm_campaign }),
          ...(meta.utm_content && { utm_content: meta.utm_content }),
          ...(meta.utm_term && { utm_term: meta.utm_term }),
        },
      },
    ],
    access_token: accessToken,
  };

  const res = await fetch(`https://graph.facebook.com/v22.0/${pixelId}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, body: text, email, amount, currency, fbclid: !!meta.fbclid };
}

async function main() {
  const ids = process.argv.slice(2);
  if (ids.length === 0) {
    console.error("Usage: npx tsx scripts/force-meta-purchase.ts pi_xxx pi_yyy");
    process.exit(1);
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");
  const stripe = new Stripe(stripeKey, { apiVersion: "2025-02-24.acacia" });

  for (const id of ids) {
    console.log(`\n──── ${id} ────`);
    const pi = await stripe.paymentIntents.retrieve(id);
    console.log(`  status=${pi.status}  amount=$${pi.amount / 100}  email=${pi.metadata?.customer_email ?? "—"}`);
    if (pi.status !== "succeeded") {
      console.log("  ⚠️  Skipped (status != succeeded)");
      continue;
    }
    const result = await sendPurchase(pi);
    console.log(`  → ${result.ok ? "OK" : "FAILED"} (${result.status}) fbclid=${result.fbclid}`);
    console.log(`  ${result.body}`);
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
