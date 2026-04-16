/**
 * Script manuel pour envoyer Lead + InitiateCheckout + Purchase à Meta CAPI
 * Usage: npx tsx scripts/send-meta-events-manual.ts
 */

import { createHash } from "crypto";
import Stripe from "stripe";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local manually
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

const PAYMENT_INTENT_ID = "pi_3TMqfUGXDvh9UNcV21C6KjMf";
const OVERRIDE_EMAIL = "plourde.matt@gmail.com";

function sha256(value: string) {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

async function sendMetaEvent(event: {
  eventName: string;
  eventTime: number;
  eventId: string;
  actionSource: string;
  eventSourceUrl?: string;
  email?: string | null;
  customData?: Record<string, unknown>;
}) {
  const accessToken = process.env.META_ACCESS_TOKEN;
  const pixelId = process.env.META_PIXEL_ID;

  if (!accessToken || !pixelId) {
    throw new Error("META_ACCESS_TOKEN or META_PIXEL_ID not set");
  }

  const userData: Record<string, string> = {};
  if (event.email) {
    userData.em = sha256(event.email);
  }

  const body = {
    data: [
      {
        event_name: event.eventName,
        event_time: event.eventTime,
        event_id: event.eventId,
        action_source: event.actionSource,
        event_source_url: event.eventSourceUrl,
        user_data: userData,
        custom_data: event.customData,
      },
    ],
    access_token: accessToken,
  };

  const response = await fetch(
    `https://graph.facebook.com/v18.0/${pixelId}/events`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  const text = await response.text();
  return { ok: response.ok, status: response.status, body: text };
}

async function main() {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-02-24.acacia" });

  console.log(`\nFetching PaymentIntent ${PAYMENT_INTENT_ID}...`);
  const pi = await stripe.paymentIntents.retrieve(PAYMENT_INTENT_ID);

  const email = OVERRIDE_EMAIL;
  const eventTime = pi.created ?? Math.floor(Date.now() / 1000);
  const amount = pi.amount / 100;
  const currency = (pi.currency ?? "usd").toUpperCase();
  const meta = (pi.metadata ?? {}) as Record<string, string>;

  console.log(`\nPaymentIntent details:`);
  console.log(`  Email: ${email}`);
  console.log(`  Amount: $${amount} ${currency}`);
  console.log(`  Created: ${new Date(eventTime * 1000).toISOString()}`);
  console.log(`  Status: ${pi.status}`);
  console.log(`  Metadata:`, meta);

  const customDataBase = {
    content_name: "Attractiveness Protocol",
    content_ids: ["f1-attractiveness-protocol"],
    content_type: "product",
    funnel: meta.funnel ?? null,
    ...(meta.utm_source && { utm_source: meta.utm_source }),
    ...(meta.utm_medium && { utm_medium: meta.utm_medium }),
    ...(meta.utm_campaign && { utm_campaign: meta.utm_campaign }),
    ...(meta.utm_content && { utm_content: meta.utm_content }),
    ...(meta.utm_term && { utm_term: meta.utm_term }),
    ...(meta.fbclid && { fbclid: meta.fbclid }),
  };

  // 1. Lead
  console.log(`\n[1/3] Sending Lead event...`);
  const leadResult = await sendMetaEvent({
    eventName: "Lead",
    eventTime,
    eventId: `${PAYMENT_INTENT_ID}_lead`,
    actionSource: "website",
    eventSourceUrl: "https://protocol-club.com/f1",
    email,
    customData: { ...customDataBase, value: amount, currency },
  });
  console.log(`  → ${leadResult.ok ? "OK" : "FAILED"} (${leadResult.status}): ${leadResult.body}`);

  // 2. InitiateCheckout
  console.log(`\n[2/3] Sending InitiateCheckout event...`);
  const checkoutResult = await sendMetaEvent({
    eventName: "InitiateCheckout",
    eventTime,
    eventId: `${PAYMENT_INTENT_ID}_initiate`,
    actionSource: "website",
    eventSourceUrl: "https://protocol-club.com/f1",
    email,
    customData: {
      content_name: "Attractiveness Protocol",
      content_ids: ["f1-attractiveness-protocol"],
      value: amount,
      currency,
      num_items: 1,
    },
  });
  console.log(`  → ${checkoutResult.ok ? "OK" : "FAILED"} (${checkoutResult.status}): ${checkoutResult.body}`);

  // 3. Purchase
  console.log(`\n[3/3] Sending Purchase event...`);
  const purchaseResult = await sendMetaEvent({
    eventName: "Purchase",
    eventTime,
    eventId: PAYMENT_INTENT_ID,
    actionSource: "website",
    eventSourceUrl: "https://protocol-club.com/dashboard",
    email,
    customData: { ...customDataBase, value: amount, currency },
  });
  console.log(`  → ${purchaseResult.ok ? "OK" : "FAILED"} (${purchaseResult.status}): ${purchaseResult.body}`);

  console.log(`\nDone.`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
