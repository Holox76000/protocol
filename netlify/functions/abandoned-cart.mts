import { schedule } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const CHECKOUT_URL = "https://protocol-club.com/f1";
const EMAIL_1_DELAY_MIN = 10;
const EMAIL_2_DELAY_HOURS = 4;
const FROM = "Protocol Club <hello@protocol-club.com>";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

function buildEmailHtml(name: string, heading: string, body: string, cta: string, url: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:48px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#111;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:40px 40px 32px;">
          <p style="margin:0 0 8px;font-size:13px;color:#888;letter-spacing:0.08em;text-transform:uppercase;">Protocol Club</p>
          <h1 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#fff;line-height:1.3;">${heading}</h1>
          <p style="margin:0 0 32px;font-size:15px;color:#bbb;line-height:1.6;">${body}</p>
          <a href="${url}" style="display:inline-block;background:#fff;color:#000;font-size:15px;font-weight:600;padding:14px 28px;border-radius:8px;text-decoration:none;">${cta}</a>
          <p style="margin:32px 0 0;font-size:13px;color:#555;line-height:1.5;">Any questions? Reply directly to this email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

const handler = schedule("*/5 * * * *", async () => {
  const sb = getSupabase();
  const resend = new Resend(process.env.RESEND_API_KEY!);
  const now = new Date();

  // ── Email 1 : 10 min après inscription ──
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

    try {
      await resend.emails.send({
        from: FROM,
        to: user.email,
        subject: "You left something behind 👀",
        html: buildEmailHtml(
          user.first_name ?? "there",
          `Your protocol is waiting for you`,
          "You started filling out your questionnaire but didn't complete your order. Your personalized protocol is one click away.",
          "Complete my order →",
          CHECKOUT_URL
        ),
      });
      console.log("[abandoned-cart] email1 sent", { email: user.email });
    } catch (err) {
      console.error("[abandoned-cart] email1 failed", { email: user.email, error: String(err) });
    }
  }

  // ── Email 2 : 4h après inscription, si email 1 déjà envoyé ──
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

    try {
      await resend.emails.send({
        from: FROM,
        to: user.email,
        subject: "Last chance to start your protocol",
        html: buildEmailHtml(
          user.first_name ?? "there",
          `${user.first_name ?? "Hey"}, your protocol is still waiting`,
          "A few hours ago, you started your questionnaire but didn't complete your order. This is our last follow-up — we won't bother you after this.",
          "Complete my order now →",
          CHECKOUT_URL
        ),
      });
      console.log("[abandoned-cart] email2 sent", { email: user.email });
    } catch (err) {
      console.error("[abandoned-cart] email2 failed", { email: user.email, error: String(err) });
    }
  }

  return { statusCode: 200 };
});

export { handler };
