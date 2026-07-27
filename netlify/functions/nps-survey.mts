import { schedule } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import crypto from "node:crypto";

const SITE_URL = "https://protocol-club.com";
const NPS_DELAY_MIN = 120; // 2h after first protocol view — lets the user actually read it
const NPS_30D_DELAY_DAYS = 30;
const NPS_REMINDER_DELAY_H = 24;
const NPS_DATING_DELAY_MIN = 60; // 1h after the client first opens their dating gallery
const FROM = "Protocol Club <hello@protocol-club.com>";

// Internal/team accounts — never send NPS to them (matches the email dashboard
// filter so noise stays out of response-rate stats).
const INTERNAL_EMAIL_PATTERNS = [
  "patrypierreandre",
  "sofiane.lekfif",
  "sofiane@reddotgrowth",
  "thibault.cdn",
  "reddotgrowth",
];

function isInternalEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const lc = email.toLowerCase();
  return INTERNAL_EMAIL_PATTERNS.some((p) => lc.includes(p));
}

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

function scoreButtonsHtml(token: string, basePath = "/nps"): string {
  const buttons = Array.from({ length: 10 }, (_, i) => {
    const score = i + 1;
    const bg = score <= 6 ? "#2d3a3e" : score <= 8 ? "#3d4a30" : C.green;
    return `<td style="padding:2px;">
      <a href="${SITE_URL}${basePath}/${token}?score=${score}"
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

  // ── Pass 1: Initial NPS — 2h after first protocol view ──
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

  for (const user of (npsUsers ?? []).filter((u) => !isInternalEmail(u.email))) {
    const token = crypto.randomUUID();
    await sb.from("users").update({ nps_token: token, nps_sent_at: now.toISOString() }).eq("id", user.id);

    const name = user.first_name ?? "there";
    const content = `
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:400;color:${C.brand};line-height:1.25;letter-spacing:-0.02em;">
        Would you recommend Protocol Club, ${name}?
      </h1>
      <p style="margin:0 0 28px;font-size:15px;color:${C.muted};line-height:1.65;">
        You've had a couple of hours with your protocol. One question:
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
        subject: `${name}, would you recommend Protocol Club?`,
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

  for (const user of (nps30dUsers ?? []).filter((u) => !isInternalEmail(u.email))) {
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
        subject: `${name}, 30 days in — would you recommend Protocol Club now?`,
        html: emailShell(content),
      });
      console.log("[nps-survey] 30d sent", { email: user.email });
    } catch (err) {
      console.error("[nps-survey] 30d failed", { email: user.email, error: String(err) });
      await sb.from("users").update({ nps_30d_sent_at: null, nps_30d_token: null }).eq("id", user.id);
    }
  }

  // ── Pass 3: NPS reminders — J+1, J+2, J+3 for non-responders ──
  const reminderCutoff = new Date(now.getTime() - NPS_REMINDER_DELAY_H * 60 * 60 * 1000).toISOString();

  const REMINDERS = [
    {
      sentAtField:  "nps_reminder_1_sent_at" as const,
      prevField:    "nps_sent_at" as const,
      day:          1,
      subject:      (name: string) => `${name}, would you recommend us? (30 sec)`,
      intro:        (name: string) => `You haven't shared your thoughts on your Protocol yet, ${name}. One question — 30 seconds.`,
    },
    {
      sentAtField:  "nps_reminder_2_sent_at" as const,
      prevField:    "nps_reminder_1_sent_at" as const,
      day:          2,
      subject:      (name: string) => `Still curious about your Protocol score, ${name}`,
      intro:        (name: string) => `Two days in — how's your Protocol holding up, ${name}?`,
    },
    {
      sentAtField:  "nps_reminder_3_sent_at" as const,
      prevField:    "nps_reminder_2_sent_at" as const,
      day:          3,
      subject:      (name: string) => `Last ask, ${name} — would you recommend Protocol Club?`,
      intro:        (name: string) => `This is the last time we'll reach out about this. One question on your Protocol, ${name}.`,
    },
  ] as const;

  for (const reminder of REMINDERS) {
    const { data: reminderUsers, error: reminderErr } = await sb
      .from("users")
      .select("id, email, first_name, nps_token")
      .eq("has_paid", true)
      .not("nps_token", "is", null)
      .is("nps_submitted_at", null)
      .is(reminder.sentAtField, null)
      .not(reminder.prevField, "is", null)
      .lte(reminder.prevField, reminderCutoff)
      .limit(50);

    if (reminderErr) {
      console.error(`[nps-survey] reminder-${reminder.day} query failed`, reminderErr.message);
      continue;
    }

    for (const user of (reminderUsers ?? []).filter((u) => !isInternalEmail(u.email))) {
      await sb.from("users").update({ [reminder.sentAtField]: now.toISOString() }).eq("id", user.id);

      const name = user.first_name ?? "there";
      const content = `
        <h1 style="margin:0 0 8px;font-size:24px;font-weight:400;color:${C.brand};line-height:1.25;letter-spacing:-0.02em;">
          ${reminder.intro(name)}
        </h1>
        <p style="margin:0 0 20px;font-size:15px;font-weight:600;color:${C.brand};line-height:1.5;">
          How likely are you to recommend Protocol Club to a friend?
        </p>
        ${scoreButtonsHtml(user.nps_token)}
        <p style="margin:24px 0 0;font-size:13px;color:${C.subtle};line-height:1.6;">
          Takes 30 seconds.${reminder.day === 3 ? " This is our last reminder." : ""}
        </p>
      `;

      try {
        await resend.emails.send({
          from: FROM,
          to: user.email,
          subject: reminder.subject(name),
          html: emailShell(content),
        });
        console.log(`[nps-survey] reminder-${reminder.day} sent`, { email: user.email });
      } catch (err) {
        console.error(`[nps-survey] reminder-${reminder.day} failed`, { email: user.email, error: String(err) });
        await sb.from("users").update({ [reminder.sentAtField]: null }).eq("id", user.id);
      }
    }
  }

  // ── Pass 4: Dating NPS — 1h after the client first opens their gallery ──
  // Different questions than the protocol NPS (favorite template, dating-app
  // intent) so the survey lives on its own route: /nps/dating/[token].
  const datingCutoff = new Date(now.getTime() - NPS_DATING_DELAY_MIN * 60 * 1000).toISOString();

  const { data: datingOrders, error: datingErr } = await sb
    .from("dating_orders")
    .select("id, email, first_name")
    .eq("status", "delivered")
    .is("nps_sent_at", null)
    .not("gallery_first_viewed_at", "is", null)
    .lte("gallery_first_viewed_at", datingCutoff)
    .limit(50);

  if (datingErr) console.error("[nps-survey] dating query failed", datingErr.message);

  for (const order of (datingOrders ?? []).filter((o) => !isInternalEmail(o.email))) {
    const token = crypto.randomUUID();
    await sb.from("dating_orders").update({ nps_token: token, nps_sent_at: now.toISOString() }).eq("id", order.id);

    const name = order.first_name ?? "there";
    const content = `
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:400;color:${C.brand};line-height:1.25;letter-spacing:-0.02em;">
        How were your photos, ${name}?
      </h1>
      <p style="margin:0 0 28px;font-size:15px;color:${C.muted};line-height:1.65;">
        You've just seen your dating set. One question — takes 30 seconds:
      </p>
      <p style="margin:0 0 20px;font-size:15px;font-weight:600;color:${C.brand};line-height:1.5;">
        How likely are you to recommend Protocol Dating to a friend?
      </p>
      ${scoreButtonsHtml(token, "/nps/dating")}
      <p style="margin:24px 0 0;font-size:13px;color:${C.subtle};line-height:1.6;">
        Your feedback shapes which templates we keep and which we cut.
      </p>
    `;

    try {
      await resend.emails.send({
        from: FROM,
        to: order.email,
        subject: `${name}, how were your Protocol Dating photos?`,
        html: emailShell(content),
      });
      console.log("[nps-survey] dating sent", { email: order.email, orderId: order.id });
    } catch (err) {
      console.error("[nps-survey] dating failed", { email: order.email, error: String(err) });
      await sb.from("dating_orders").update({ nps_sent_at: null, nps_token: null }).eq("id", order.id);
    }
  }

  // ── Pass 5: Dating NPS reminder — J+1 for non-responders ──
  const datingReminderCutoff = new Date(now.getTime() - NPS_REMINDER_DELAY_H * 60 * 60 * 1000).toISOString();

  const { data: datingReminders, error: datingReminderErr } = await sb
    .from("dating_orders")
    .select("id, email, first_name, nps_token")
    .eq("status", "delivered")
    .not("nps_token", "is", null)
    .is("nps_submitted_at", null)
    .is("nps_reminder_1_sent_at", null)
    .lte("nps_sent_at", datingReminderCutoff)
    .limit(50);

  if (datingReminderErr) console.error("[nps-survey] dating reminder query failed", datingReminderErr.message);

  for (const order of (datingReminders ?? []).filter((o) => !isInternalEmail(o.email))) {
    await sb.from("dating_orders").update({ nps_reminder_1_sent_at: now.toISOString() }).eq("id", order.id);

    const name = order.first_name ?? "there";
    const content = `
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:400;color:${C.brand};line-height:1.25;letter-spacing:-0.02em;">
        Quick one on your photos, ${name}?
      </h1>
      <p style="margin:0 0 20px;font-size:15px;font-weight:600;color:${C.brand};line-height:1.5;">
        How likely are you to recommend Protocol Dating to a friend?
      </p>
      ${scoreButtonsHtml(order.nps_token as string, "/nps/dating")}
      <p style="margin:24px 0 0;font-size:13px;color:${C.subtle};line-height:1.6;">
        30 seconds. Last reminder.
      </p>
    `;

    try {
      await resend.emails.send({
        from: FROM,
        to: order.email,
        subject: `${name}, quick feedback on your dating photos?`,
        html: emailShell(content),
      });
      console.log("[nps-survey] dating reminder sent", { email: order.email, orderId: order.id });
    } catch (err) {
      console.error("[nps-survey] dating reminder failed", { email: order.email, error: String(err) });
      await sb.from("dating_orders").update({ nps_reminder_1_sent_at: null }).eq("id", order.id);
    }
  }

  return { statusCode: 200 };
});

export { handler };
