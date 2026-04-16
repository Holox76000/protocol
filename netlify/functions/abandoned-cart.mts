import { schedule } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import crypto from "node:crypto";

const SITE_URL = "https://protocol-club.com";
const EMAIL_1_DELAY_MIN = 10;
const EMAIL_2_DELAY_HOURS = 4;
const FROM = "Protocol Club <hello@protocol-club.com>";
const CART_RECOVERY_TOKEN_DAYS = 7;
const QUESTIONNAIRE_MAGIC_LINK_DAYS = 7;

// Questionnaire reminder delays (in hours)
const Q_REMINDER_1_HOURS = 24;   // J+1
const Q_REMINDER_2_HOURS = 72;   // J+3
const Q_REMINDER_3_HOURS = 144;  // J+6

const C = {
  bg: "#f9fbfb",
  card: "#ffffff",
  brand: "#253239",
  text: "#253239",
  muted: "#515255",
  subtle: "#7f949b",
  border: "#edf0f1",
};

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function getQuestionnaireMagicLinkUrl(sb: ReturnType<typeof getSupabase>, userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + QUESTIONNAIRE_MAGIC_LINK_DAYS * 24 * 60 * 60 * 1000).toISOString();

  // Invalidate any previous unused magic link tokens for this user
  await sb.from("magic_link_tokens").update({ used: true }).eq("user_id", userId).eq("used", false);
  await sb.from("magic_link_tokens").insert({ user_id: userId, token_hash: tokenHash, expires_at: expiresAt });

  return `${SITE_URL}/api/auth/magic-link/verify?token=${token}&redirect=/questionnaire`;
}

async function getCartRecoveryUrl(sb: ReturnType<typeof getSupabase>, userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + CART_RECOVERY_TOKEN_DAYS * 24 * 60 * 60 * 1000).toISOString();

  // Replace any existing token
  await sb.from("cart_recovery_tokens").delete().eq("user_id", userId);
  await sb.from("cart_recovery_tokens").insert({ user_id: userId, token_hash: tokenHash, expires_at: expiresAt });

  return `${SITE_URL}/api/auth/cart-recovery/verify?token=${token}`;
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

function btn(text: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;background:${C.brand};color:#ffffff;font-size:14px;font-weight:600;padding:14px 28px;border-radius:8px;text-decoration:none;letter-spacing:0.01em;">${text}</a>`;
}

const handler = schedule("*/5 * * * *", async () => {
  const sb = getSupabase();
  const resend = new Resend(process.env.RESEND_API_KEY!);
  const now = new Date();

  // ── Email 1: 10 min after registration ──
  const cutoff1 = new Date(now.getTime() - EMAIL_1_DELAY_MIN * 60 * 1000).toISOString();

  const { data: users1 } = await sb
    .from("users")
    .select("id, email, first_name")
    .eq("has_paid", false)
    .is("cart_email_1_sent_at", null)
    .lte("created_at", cutoff1)
    .limit(50);

  for (const user of users1 ?? []) {
    await sb.from("users").update({ cart_email_1_sent_at: now.toISOString() }).eq("id", user.id);

    const name = user.first_name ?? "there";
    const checkoutUrl = await getCartRecoveryUrl(sb, user.id);

    const content = `
      <h1 style="margin:0 0 24px;font-size:26px;font-weight:400;color:${C.brand};line-height:1.25;letter-spacing:-0.02em;">
        Your body analysis is waiting, ${name}.
      </h1>
      <p style="margin:0 0 16px;font-size:15px;color:${C.muted};line-height:1.65;">
        You started your questionnaire — which means we already have enough data to build your personalized Attractiveness Protocol.
      </p>
      <p style="margin:0 0 32px;font-size:15px;color:${C.muted};line-height:1.65;">
        Your protocol covers 15+ body proportions, your attractiveness score, and a science-backed roadmap built around your specific goals and body type.
      </p>
      ${btn("Complete my order — $89 →", checkoutUrl)}
      <p style="margin:24px 0 0;font-size:13px;color:${C.subtle};line-height:1.6;">
        90-day money-back guarantee. No conditions.
      </p>
    `;

    try {
      await resend.emails.send({
        from: FROM,
        to: user.email,
        subject: "Your body analysis is waiting",
        html: emailShell(content),
      });
      console.log("[abandoned-cart] email1 sent", { email: user.email });
    } catch (err) {
      console.error("[abandoned-cart] email1 failed", { email: user.email, error: String(err) });
    }
  }

  // ── Email 2: 4h after registration ──
  const cutoff2 = new Date(now.getTime() - EMAIL_2_DELAY_HOURS * 60 * 60 * 1000).toISOString();

  const { data: users2 } = await sb
    .from("users")
    .select("id, email, first_name")
    .eq("has_paid", false)
    .is("cart_email_2_sent_at", null)
    .not("cart_email_1_sent_at", "is", null)
    .lte("created_at", cutoff2)
    .limit(50);

  for (const user of users2 ?? []) {
    await sb.from("users").update({ cart_email_2_sent_at: now.toISOString() }).eq("id", user.id);

    const name = user.first_name ?? "there";
    const checkoutUrl = await getCartRecoveryUrl(sb, user.id);

    const content = `
      <h1 style="margin:0 0 24px;font-size:26px;font-weight:400;color:${C.brand};line-height:1.25;letter-spacing:-0.02em;">
        Still thinking about it, ${name}?
      </h1>
      <p style="margin:0 0 16px;font-size:15px;color:${C.muted};line-height:1.65;">
        A few hours ago you started your questionnaire. We've analyzed 100+ attractiveness markers for your profile — but your protocol hasn't been built yet.
      </p>
      <p style="margin:0 0 32px;font-size:15px;color:${C.muted};line-height:1.65;">
        Most guys who complete it see exactly what's holding their score back within the first read. It's not guesswork — it's your data.
      </p>
      ${btn("Get my protocol — $89 →", checkoutUrl)}
      <p style="margin:24px 0 0;font-size:13px;color:${C.subtle};line-height:1.6;">
        90-day money-back guarantee. No conditions. This is our last email.
      </p>
    `;

    try {
      await resend.emails.send({
        from: FROM,
        to: user.email,
        subject: "Still thinking about it?",
        html: emailShell(content),
      });
      console.log("[abandoned-cart] email2 sent", { email: user.email });
    } catch (err) {
      console.error("[abandoned-cart] email2 failed", { email: user.email, error: String(err) });
    }
  }

  // ── Questionnaire reminders: J+1, J+3, J+6 ──
  // Sent to paid users who haven't completed their assessment yet
  const qStatuses = ["not_started", "questionnaire_in_progress"];

  const qCutoff1 = new Date(now.getTime() - Q_REMINDER_1_HOURS * 60 * 60 * 1000).toISOString();
  const qCutoff2 = new Date(now.getTime() - Q_REMINDER_2_HOURS * 60 * 60 * 1000).toISOString();
  const qCutoff3 = new Date(now.getTime() - Q_REMINDER_3_HOURS * 60 * 60 * 1000).toISOString();

  // Reminder 1: 24h after purchase, no reminder sent yet
  const { data: qUsers1 } = await sb
    .from("users")
    .select("id, email, first_name")
    .eq("has_paid", true)
    .in("protocol_status", qStatuses)
    .is("questionnaire_reminder_1_sent_at", null)
    .lte("created_at", qCutoff1)
    .limit(50);

  // Reminder 2: 72h after purchase, reminder 1 already sent
  const { data: qUsers2 } = await sb
    .from("users")
    .select("id, email, first_name")
    .eq("has_paid", true)
    .in("protocol_status", qStatuses)
    .is("questionnaire_reminder_2_sent_at", null)
    .not("questionnaire_reminder_1_sent_at", "is", null)
    .lte("created_at", qCutoff2)
    .limit(50);

  // Reminder 3: 144h after purchase, reminder 2 already sent
  const { data: qUsers3 } = await sb
    .from("users")
    .select("id, email, first_name")
    .eq("has_paid", true)
    .in("protocol_status", qStatuses)
    .is("questionnaire_reminder_3_sent_at", null)
    .not("questionnaire_reminder_2_sent_at", "is", null)
    .lte("created_at", qCutoff3)
    .limit(50);

  const qResults = { r1: { sent: 0, failed: 0 }, r2: { sent: 0, failed: 0 }, r3: { sent: 0, failed: 0 } };

  for (const [users, reminderKey, resultKey] of [
    [qUsers1 ?? [], "questionnaire_reminder_1_sent_at", "r1"],
    [qUsers2 ?? [], "questionnaire_reminder_2_sent_at", "r2"],
    [qUsers3 ?? [], "questionnaire_reminder_3_sent_at", "r3"],
  ] as [Array<{ id: string; email: string; first_name: string | null }>, string, "r1" | "r2" | "r3"][]) {
    for (const user of users) {
      await sb.from("users").update({ [reminderKey]: now.toISOString() }).eq("id", user.id);

      const name = user.first_name ?? "there";

      try {
        const assessmentUrl = await getQuestionnaireMagicLinkUrl(sb, user.id);

        const content = `
          <h1 style="margin:0 0 24px;font-size:26px;font-weight:400;color:#253239;line-height:1.25;letter-spacing:-0.02em;">
            Your protocol is on hold, ${name}.
          </h1>
          <p style="margin:0 0 16px;font-size:15px;color:#515255;line-height:1.65;">
            You purchased your Attractiveness Protocol but your assessment isn't complete yet.
          </p>
          <p style="margin:0 0 32px;font-size:15px;color:#515255;line-height:1.65;">
            We can't build your protocol until we have your full answers. The more precise your inputs, the more accurate your results. It takes less than 10 minutes to finish.
          </p>
          <a href="${assessmentUrl}" style="display:inline-block;background:#253239;color:#ffffff;font-size:14px;font-weight:600;padding:14px 28px;border-radius:8px;text-decoration:none;letter-spacing:0.01em;">Complete my assessment →</a>
          <p style="margin:24px 0 0;font-size:13px;color:#7f949b;line-height:1.6;">
            Your answers are encrypted and never shared. Photos are deleted after 12 weeks.
          </p>
        `;

        await resend.emails.send({
          from: FROM,
          to: user.email,
          subject: `Your protocol is on hold, ${name}`,
          html: emailShell(content),
        });

        qResults[resultKey].sent++;
        console.log(`[abandoned-cart] questionnaire ${reminderKey} sent`, { email: user.email });
      } catch (err) {
        qResults[resultKey].failed++;
        console.error(`[abandoned-cart] questionnaire ${reminderKey} failed`, { email: user.email, error: String(err) });
      }
    }
  }

  console.log("[abandoned-cart] questionnaire reminders done", qResults);

  return { statusCode: 200 };
});

export { handler };
