/**
 * One-shot script: push the N latest succeeded Stripe payments to Meta CAPI.
 * Usage: node scripts/push-meta-purchases.mjs [--limit 2]
 *
 * Reads env vars from .env.local
 */

import { createHash } from "crypto";
import { readFileSync } from "fs";
import { resolve } from "path";

// ── Load .env.local ───────────────────────────────────────────────────────────

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  const lines = readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnv();

const STRIPE_SECRET_KEY  = process.env.STRIPE_SECRET_KEY;
const META_ACCESS_TOKEN  = process.env.META_ACCESS_TOKEN;
const META_PIXEL_ID      = process.env.META_PIXEL_ID;
const META_TEST_CODE     = process.env.META_TEST_EVENT_CODE;

if (!STRIPE_SECRET_KEY)  { console.error("Missing STRIPE_SECRET_KEY");  process.exit(1); }
if (!META_ACCESS_TOKEN)  { console.error("Missing META_ACCESS_TOKEN");   process.exit(1); }
if (!META_PIXEL_ID)      { console.error("Missing META_PIXEL_ID");       process.exit(1); }

const LIMIT = parseInt(process.argv.find(a => a.match(/^\d+$/)) ?? "2", 10);

// ── Helpers ───────────────────────────────────────────────────────────────────

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function stripeGet(path) {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Stripe ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

async function sendMetaPurchase({ piId, email, firstName, amount, currency, eventTime, meta }) {
  const userData = {};
  if (email)     userData.em = sha256(email.trim().toLowerCase());
  if (firstName) userData.fn = sha256(firstName.trim().toLowerCase());

  const body = {
    data: [{
      event_name:       "Purchase",
      event_time:       eventTime,
      event_id:         piId,
      action_source:    "website",
      event_source_url: "https://protocol-club.com/dashboard",
      user_data:        userData,
      custom_data: {
        value:        amount,
        currency:     currency.toUpperCase(),
        content_name: "Attractiveness Protocol",
        content_ids:  ["f1-attractiveness-protocol"],
        content_type: "product",
        ...(meta?.funnel        && { funnel:        meta.funnel }),
        ...(meta?.utm_source    && { utm_source:    meta.utm_source }),
        ...(meta?.utm_medium    && { utm_medium:    meta.utm_medium }),
        ...(meta?.utm_campaign  && { utm_campaign:  meta.utm_campaign }),
        ...(meta?.utm_content   && { utm_content:   meta.utm_content }),
        ...(meta?.fbclid        && { fbclid:        meta.fbclid }),
      },
    }],
    access_token: META_ACCESS_TOKEN,
    ...(META_TEST_CODE && { test_event_code: META_TEST_CODE }),
  };

  const res = await fetch(`https://graph.facebook.com/v18.0/${META_PIXEL_ID}/events`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });

  const text = await res.text();
  return { ok: res.ok, status: res.status, body: text };
}

// ── Main ──────────────────────────────────────────────────────────────────────

const startOfDay = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);

console.log(`\nFetching last ${LIMIT} succeeded PaymentIntents from today…\n`);

const { data: paymentIntents } = await stripeGet(
  `/payment_intents?limit=20&expand[]=data.customer`
);

const todayPIs = paymentIntents
  .filter(pi => pi.status === "succeeded" && pi.created >= startOfDay)
  .slice(0, LIMIT);

if (todayPIs.length === 0) {
  console.log("No succeeded PaymentIntents found today.");
  process.exit(0);
}

console.log(`Found ${todayPIs.length} payment(s) to push:\n`);

for (const pi of todayPIs) {
  const m = pi.metadata ?? {};
  let email = m.customer_email ?? null;

  // Fallback to customer email + first name from Stripe Customer object
  let firstName = null;
  if (pi.customer && typeof pi.customer === "object") {
    if (!email) email = pi.customer.email ?? null;
    if (pi.customer.name) firstName = pi.customer.name.trim().split(" ")[0];
  }
  // Fallback: first name from metadata
  if (!firstName && m.customer_name) firstName = m.customer_name.trim().split(" ")[0];

  const amount   = pi.amount / 100;
  const currency = (pi.currency ?? "usd").toUpperCase();
  const date     = new Date(pi.created * 1000).toLocaleString("fr-FR");

  console.log(`→ ${pi.id}  ${amount} ${currency}  ${email ?? "(no email)"}  ${firstName ?? "(no name)"}  ${date}`);

  if (m.capi_purchase_source === "checkout_session") {
    console.log(`  ⚠ Skipping — owned by checkout session (CAPI fired there)`);
    continue;
  }

  const result = await sendMetaPurchase({
    piId:      pi.id,
    email,
    firstName,
    amount,
    currency:  pi.currency ?? "usd",
    eventTime: pi.created,
    meta:      m,
  });

  if (result.ok) {
    console.log(`  ✓ Meta CAPI OK — ${result.body}`);
  } else {
    console.error(`  ✗ Meta CAPI FAILED ${result.status} — ${result.body}`);
  }
}

console.log("\nDone.\n");
