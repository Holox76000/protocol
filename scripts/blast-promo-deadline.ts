/**
 * One-shot blast — -40% offer ending tonight at midnight
 *
 * Targets:
 *   - users with has_paid = false
 *   - leads whose email is not already in users
 *
 * Run:
 *   npx tsx scripts/blast-promo-deadline.ts
 *
 * Dry-run (logs recipients, sends nothing):
 *   DRY_RUN=1 npx tsx scripts/blast-promo-deadline.ts
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// ── Load .env.local ────────────────────────────────────────────────────────────
const envFile = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
for (const line of envFile.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

const DRY_RUN = process.env.DRY_RUN === "1";
const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://protocol-club.com";
const CHECKOUT_URL = `${SITE_URL}/checkout`;

// ── Clients ────────────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const resend = new Resend(process.env.RESEND_API_KEY!);

// ── Email template ─────────────────────────────────────────────────────────────
const C = {
  bg: "#f9fbfb",
  card: "#ffffff",
  brand: "#253239",
  text: "#253239",
  muted: "#515255",
  subtle: "#7f949b",
  border: "#edf0f1",
};

function emailHtml(firstName?: string): string {
  const name = firstName ?? "there";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:${C.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};padding:48px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:540px;">

        <!-- Header -->
        <tr><td style="padding:0 0 24px;">
          <p style="margin:0;font-size:12px;font-weight:600;color:${C.subtle};letter-spacing:0.1em;text-transform:uppercase;">Protocol Club</p>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:${C.card};border-radius:16px;border:1px solid ${C.border};box-shadow:0 4px 24px rgba(37,50,57,0.06);padding:40px;">

          <!-- Urgency badge -->
          <p style="margin:0 0 20px;display:inline-block;background:#fff3cd;color:#856404;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:5px 12px;border-radius:20px;border:1px solid #f5d26a;">
            Offer ends tomorrow at midnight
          </p>

          <h1 style="margin:0 0 20px;font-size:26px;font-weight:400;color:${C.brand};line-height:1.25;letter-spacing:-0.02em;">
            Last chance — 40% off your Attractiveness Protocol, ${name}.
          </h1>

          <p style="margin:0 0 16px;font-size:15px;color:${C.muted};line-height:1.65;">
            Our limited-time offer expires tomorrow at midnight. After that, the price goes back to full.
          </p>

          <p style="margin:0 0 32px;font-size:15px;color:${C.muted};line-height:1.65;">
            Your personalized protocol covers 15+ body proportions, your attractiveness score, and a science-backed improvement roadmap — built specifically around your measurements and goals.
          </p>

          <!-- CTA button -->
          <a href="${CHECKOUT_URL}" style="display:inline-block;background:${C.brand};color:#ffffff;font-size:14px;font-weight:600;padding:14px 28px;border-radius:8px;text-decoration:none;letter-spacing:0.01em;">
            Get my protocol — 40% off →
          </a>

          <p style="margin:32px 0 0;font-size:13px;color:${C.subtle};line-height:1.6;">
            90-day money-back guarantee. No conditions.<br>
            Offer valid until tomorrow at midnight.
          </p>

        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px 0 0;">
          <p style="margin:0;font-size:12px;color:${C.subtle};line-height:1.6;">
            Protocol Club · Questions? Reply to this email.<br>
            <a href="${SITE_URL}" style="color:${C.subtle};text-decoration:underline;">protocol-club.com</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Fetch recipients ───────────────────────────────────────────────────────────
async function getRecipients(): Promise<{ email: string; firstName?: string }[]> {
  // 1. Unpaid registered users
  const { data: unpaidUsers, error: usersErr } = await supabase
    .from("users")
    .select("email, first_name")
    .eq("has_paid", false);

  if (usersErr) throw new Error(`users query failed: ${usersErr.message}`);

  const unpaidEmails = new Set((unpaidUsers ?? []).map((u) => u.email.toLowerCase()));

  // 2. Leads not already in users
  const { data: leads, error: leadsErr } = await supabase
    .from("leads")
    .select("email, payload");

  if (leadsErr) throw new Error(`leads query failed: ${leadsErr.message}`);

  const leadsOnly = (leads ?? [])
    .filter((l) => !unpaidEmails.has(l.email.toLowerCase()))
    .map((l) => ({
      email: l.email as string,
      firstName: (l.payload as { answers?: { first_name?: string } } | null)?.answers?.first_name,
    }));

  const usersRecipients = (unpaidUsers ?? []).map((u) => ({
    email: u.email as string,
    firstName: u.first_name as string | undefined,
  }));

  return [...usersRecipients, ...leadsOnly];
}

// ── Send one email ─────────────────────────────────────────────────────────────
async function sendOne(email: string, firstName?: string): Promise<void> {
  const { error } = await resend.emails.send({
    from: "Protocol Club <hello@protocol-club.com>",
    to: email,
    subject: "Last chance — 40% off ends tomorrow at midnight",
    html: emailHtml(firstName),
  });

  if (error) throw new Error(error.message);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`[blast] DRY_RUN=${DRY_RUN}`);

  const recipients = await getRecipients();
  console.log(`[blast] ${recipients.length} recipients`);

  if (DRY_RUN) {
    for (const r of recipients) {
      console.log(`  → ${r.email} (${r.firstName ?? "—"})`);
    }
    console.log("[blast] dry run done — nothing sent");
    return;
  }

  let sent = 0;
  let failed = 0;

  for (const r of recipients) {
    try {
      await sendOne(r.email, r.firstName);
      console.log(`[blast] ✓ ${r.email}`);
      sent++;
      // Respect Resend rate limit (~2 req/s on free, ~10/s on paid)
      await new Promise((res) => setTimeout(res, 120));
    } catch (err) {
      console.error(`[blast] ✗ ${r.email}`, String(err));
      failed++;
    }
  }

  console.log(`[blast] done — sent: ${sent}, failed: ${failed}`);
}

main().catch((err) => {
  console.error("[blast] fatal", err);
  process.exit(1);
});
