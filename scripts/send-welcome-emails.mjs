/**
 * One-shot script: create registration tokens + send welcome emails via Resend.
 * Usage: node scripts/send-welcome-emails.mjs
 */

import { createHash, randomBytes } from "crypto";
import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

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

const SUPABASE_URL     = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY     = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY   = process.env.RESEND_API_KEY;
const SITE_URL         = process.env.SITE_URL ?? "https://protocol-club.com";

if (!SUPABASE_URL)   { console.error("Missing NEXT_PUBLIC_SUPABASE_URL"); process.exit(1); }
if (!SUPABASE_KEY)   { console.error("Missing SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }
if (!RESEND_API_KEY) { console.error("Missing RESEND_API_KEY"); process.exit(1); }

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Clients à contacter ───────────────────────────────────────────────────────

const CLIENTS = [
  { email: "bkheshti@gmail.com",   firstName: undefined },
  { email: "benj.brees@gmail.com", firstName: undefined },
];

// ── Token helpers ─────────────────────────────────────────────────────────────

function generateToken() {
  return randomBytes(32).toString("hex");
}

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

async function createRegistrationToken(email, firstName) {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  // Invalide les tokens précédents
  await supabase
    .from("registration_tokens")
    .update({ used: true })
    .eq("email", email.toLowerCase())
    .eq("used", false);

  const { error } = await supabase.from("registration_tokens").insert({
    token_hash: tokenHash,
    email: email.toLowerCase(),
    first_name: firstName ?? null,
    expires_at: expiresAt,
  });

  if (error) throw new Error(`Token creation failed: ${error.message}`);
  return token;
}

// ── Email ─────────────────────────────────────────────────────────────────────

async function sendWelcomeEmail(email, firstName, registrationUrl) {
  const name = firstName ?? "there";
  const C = {
    bg: "#f9fbfb", card: "#ffffff", brand: "#253239",
    muted: "#515255", subtle: "#7f949b", border: "#edf0f1",
  };

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${C.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};padding:48px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:540px;">
        <tr><td style="padding:0 0 24px;">
          <p style="margin:0;font-size:12px;font-weight:600;color:${C.subtle};letter-spacing:0.1em;text-transform:uppercase;">Protocol Club</p>
        </td></tr>
        <tr><td style="background:${C.card};border-radius:16px;border:1px solid ${C.border};box-shadow:0 4px 24px rgba(37,50,57,0.06);padding:40px;">
          <h1 style="margin:0 0 8px;font-size:26px;font-weight:400;color:${C.brand};line-height:1.25;letter-spacing:-0.02em;">
            Payment confirmed.<br>Your protocol is next.
          </h1>
          <p style="margin:16px 0 0;font-size:14px;font-weight:600;color:${C.subtle};letter-spacing:0.06em;text-transform:uppercase;">Step 1 of 2</p>
          <p style="margin:24px 0;font-size:15px;color:${C.muted};line-height:1.65;">
            Hey ${name} — your order is in. We're now building your personalized Attractiveness Protocol based on your body analysis.
          </p>
          <p style="margin:0 0 32px;font-size:15px;color:${C.muted};line-height:1.65;">
            First, create your account to access your dashboard when it's ready.
          </p>
          <a href="${registrationUrl}" style="display:inline-block;background:${C.brand};color:#ffffff;font-size:14px;font-weight:600;padding:14px 28px;border-radius:8px;text-decoration:none;letter-spacing:0.01em;">Create my account →</a>
          <p style="margin:32px 0 0;font-size:13px;color:${C.subtle};line-height:1.6;">
            This link expires in 7 days. You'll receive a second email when your protocol is ready to view.
          </p>
        </td></tr>
        <tr><td style="padding:24px 0 0;">
          <p style="margin:0;font-size:12px;color:${C.subtle};line-height:1.6;">
            Protocol Club · Questions? Reply to this email.<br>
            <a href="https://protocol-club.com" style="color:${C.subtle};text-decoration:underline;">protocol-club.com</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Protocol Club <hello@protocol-club.com>",
      to: email,
      subject: "Your order is confirmed — create your account",
      html,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`Resend error ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

// ── Main ──────────────────────────────────────────────────────────────────────

console.log("\nSending welcome emails...\n");

for (const client of CLIENTS) {
  try {
    const token = await createRegistrationToken(client.email, client.firstName);
    const registrationUrl = `${SITE_URL}/register?token=${token}`;
    const result = await sendWelcomeEmail(client.email, client.firstName, registrationUrl);
    console.log(`✓ ${client.email} — email sent (id: ${result.id})`);
    console.log(`  Registration URL: ${registrationUrl}`);
  } catch (err) {
    console.error(`✗ ${client.email} — ${err.message}`);
  }
}

console.log("\nDone.\n");
