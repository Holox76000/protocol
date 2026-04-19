import { schedule } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import crypto from "node:crypto";

const SITE_URL = "https://protocol-club.com";
const NPS_DELAY_MIN = 30;
const NPS_30D_DELAY_DAYS = 30;
const FROM = "Protocol Club <hello@protocol-club.com>";

const C = {
  bg: "#f9fbfb",
  card: "#ffffff",
  brand: "#253239",
  text: "#253239",
  muted: "#515255",
  subtle: "#7f949b",
  border: "#edf0f1",
  green: "#4a7a5e",
  yellow: "#b8860b",
  red: "#8b3a3a",
};

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

function emailShell(content: string): string {
  return `<!DOCTYPE html>
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
          ${content}
        </td></tr>
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

function scoreButtonsHtml(token: string): string {
  const buttons = Array.from({ length: 10 }, (_, i) => {
    const score = i + 1;
    const bg = score <= 6 ? "#2d3a3e" : score <= 8 ? "#3d4a30" : C.green;
    return `<td style="padding:2px;">
      <a href="${SITE_URL}/nps/${token}?score=${score}"
         style="display:block;width:36px;height:36px;line-height:36px;text-align:center;background:${bg};color:#ffffff;font-size:13px;font-weight:600;border-radius:6px;text-decoration:none;">${score}</a>
    </td>`;
  }).join("");

  return `<table cellpadding="0" cellspacing="0" style="margin:0 auto;">
    <tr>${buttons}</tr>
    <tr>
      <td colspan="6" style="padding-top:6px;font-size:11px;color:${C.subtle};text-align:left;">Not at all likely</td>
      <td colspan="4" style="padding-top:6px;font-size:11px;color:${C.subtle};text-align:right;">Extremely likely</td>
    </tr>
  </table>`;
}

const handler = schedule("*/5 * * * *", async () => {
  const sb = getSupabase();
  const resend = new Resend(process.env.RESEND_API_KEY!);
  const now = new Date();

  // ── Pass 1: Initial NPS — 30 min after first protocol view ──
  const npsDelayCutoff = new Date(now.getTime() - NPS_DELAY_MIN * 60 * 1000).toISOString();

  const { data: npsUsers, error: npsErr } = await sb
    .from("users")
    .select("id, email, first_name")
    .eq("has_paid", true)
    .is("nps_sent_at", null)
    .not("protocol_viewed_at", "is", null)
    .lte("protocol_viewed_at", npsDelayCutoff)
    .limit(50);

  if (npsErr) console.error("[nps-survey] initial query failed", npsErr.message);

  for (const user of npsUsers ?? []) {
    const token = crypto.randomUUID();
    await sb.from("users").update({ nps_token: token, nps_sent_at: now.toISOString() }).eq("id", user.id);

    const name = user.first_name ?? "there";
    const content = `
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:400;color:${C.brand};line-height:1.25;letter-spacing:-0.02em;">
        A quick question, ${name}.
      </h1>
      <p style="margin:0 0 28px;font-size:15px;color:${C.muted};line-height:1.65;">
        You've had 30 minutes with your protocol. One question:
      </p>
      <p style="margin:0 0 20px;font-size:15px;font-weight:600;color:${C.brand};line-height:1.5;">
        How likely are you to recommend Protocol Club to a friend?
      </p>
      ${scoreButtonsHtml(token)}
      <p style="margin:24px 0 0;font-size:13px;color:${C.subtle};line-height:1.6;">
        Takes 30 seconds. Your feedback shapes the next version.
      </p>
    `;

    try {
      await resend.emails.send({
        from: FROM,
        to: user.email,
        subject: `A quick question, ${name}`,
        html: emailShell(content),
      });
      console.log("[nps-survey] initial sent", { email: user.email });
    } catch (err) {
      console.error("[nps-survey] initial failed", { email: user.email, error: String(err) });
      // Rollback sent_at so cron retries
      await sb.from("users").update({ nps_sent_at: null, nps_token: null }).eq("id", user.id);
    }
  }

  // ── Pass 2: 30-day re-survey — only for initial responders ──
  const nps30dCutoff = new Date(now.getTime() - NPS_30D_DELAY_DAYS * 24 * 60 * 60 * 1000).toISOString();

  // Join against protocols table to get delivered_at
  const { data: nps30dUsers, error: nps30dErr } = await sb
    .from("users")
    .select("id, email, first_name, protocols(delivered_at)")
    .eq("has_paid", true)
    .is("nps_30d_sent_at", null)
    .not("nps_score", "is", null)
    .limit(50);

  if (nps30dErr) console.error("[nps-survey] 30d query failed", nps30dErr.message);

  for (const user of nps30dUsers ?? []) {
    // Check delivered_at from protocols relation
    const protocol = Array.isArray(user.protocols) ? user.protocols[0] : user.protocols;
    const deliveredAt = (protocol as { delivered_at?: string } | null)?.delivered_at;
    if (!deliveredAt || deliveredAt > nps30dCutoff) continue;

    const token = crypto.randomUUID();
    await sb.from("users").update({ nps_30d_token: token, nps_30d_sent_at: now.toISOString() }).eq("id", user.id);

    const name = user.first_name ?? "there";
    const content = `
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:400;color:${C.brand};line-height:1.25;letter-spacing:-0.02em;">
        30 days in — how's it going, ${name}?
      </h1>
      <p style="margin:0 0 28px;font-size:15px;color:${C.muted};line-height:1.65;">
        It's been a month since you received your protocol. Have you started seeing results?
      </p>
      <p style="margin:0 0 20px;font-size:15px;font-weight:600;color:${C.brand};line-height:1.5;">
        How likely are you to recommend Protocol Club to a friend, now that you've had time to apply it?
      </p>
      ${scoreButtonsHtml(token)}
      <p style="margin:24px 0 0;font-size:13px;color:${C.subtle};line-height:1.6;">
        30 seconds. Your feedback directly improves what we build next.
      </p>
    `;

    try {
      await resend.emails.send({
        from: FROM,
        to: user.email,
        subject: "30 days in — how's it going?",
        html: emailShell(content),
      });
      console.log("[nps-survey] 30d sent", { email: user.email });
    } catch (err) {
      console.error("[nps-survey] 30d failed", { email: user.email, error: String(err) });
      await sb.from("users").update({ nps_30d_sent_at: null, nps_30d_token: null }).eq("id", user.id);
    }
  }

  return { statusCode: 200 };
});

export { handler };
