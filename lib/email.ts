import { Resend } from "resend";

const FROM         = "Protocol Club <hello@protocol-club.com>";
const FROM_EXPERT  = "Protocol Expert <expert@protocol-club.com>";

// Brand colors matching /f1/offer
const C = {
  bg: "#f9fbfb",
  card: "#ffffff",
  brand: "#253239",
  brandHover: "#1a262d",
  text: "#253239",
  muted: "#515255",
  subtle: "#7f949b",
  border: "#edf0f1",
  borderMid: "#dfe4e6",
};

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY not set");
  return new Resend(key);
}

function emailShell(content: string): string {
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
          ${content}
        </td></tr>

        <!-- Footer -->
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
}

function btn(text: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;background:${C.brand};color:#ffffff;font-size:14px;font-weight:600;padding:14px 28px;border-radius:8px;text-decoration:none;letter-spacing:0.01em;">${text}</a>`;
}

function divider(): string {
  return `<tr><td style="padding:24px 0;"><div style="height:1px;background:${C.border};"></div></td></tr>`;
}

// ─────────────────────────────────────────────────────────
// Welcome — sent post-purchase for new users
// ─────────────────────────────────────────────────────────
export async function sendWelcomeEmail(props: {
  email: string;
  firstName?: string;
  registrationUrl: string;
}): Promise<void> {
  const resend = getResend();
  const name = props.firstName ?? "there";

  const content = `
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

    ${btn("Create my account →", props.registrationUrl)}

    <p style="margin:32px 0 0;font-size:13px;color:${C.subtle};line-height:1.6;">
      This link expires in 7 days. You'll receive a second email when your protocol is ready to view.
    </p>
  `;

  const { error } = await resend.emails.send({
    from: FROM,
    to: props.email,
    subject: "Your order is confirmed — create your account",
    html: emailShell(content),
  });

  if (error) throw new Error(`[resend] sendWelcomeEmail failed: ${error.message}`);
  console.log("[resend] welcome email sent", { email: props.email });
}

// ─────────────────────────────────────────────────────────
// Magic link — passwordless login
// ─────────────────────────────────────────────────────────
export async function sendMagicLinkEmail(props: {
  email: string;
  firstName: string;
  magicLinkUrl: string;
}): Promise<void> {
  const resend = getResend();

  const content = `
    <h1 style="margin:0 0 24px;font-size:26px;font-weight:400;color:${C.brand};line-height:1.25;letter-spacing:-0.02em;">
      Your login link
    </h1>

    <p style="margin:0 0 32px;font-size:15px;color:${C.muted};line-height:1.65;">
      Hey ${props.firstName} — click below to sign in to your Protocol Club dashboard. No password needed.
    </p>

    ${btn("Sign in to my dashboard →", props.magicLinkUrl)}

    <p style="margin:32px 0 0;font-size:13px;color:${C.subtle};line-height:1.6;">
      This link expires in 20 minutes and can only be used once.<br>
      Didn't request this? You can safely ignore this email.
    </p>
  `;

  const { error } = await resend.emails.send({
    from: FROM,
    to: props.email,
    subject: "Your Protocol Club login link",
    html: emailShell(content),
  });

  if (error) throw new Error(`[resend] sendMagicLinkEmail failed: ${error.message}`);
  console.log("[resend] magic link email sent", { email: props.email });
}

// ─────────────────────────────────────────────────────────
// Protocol delivered
// ─────────────────────────────────────────────────────────
export async function sendProtocolDeliveredEmail(props: {
  email: string;
  firstName?: string;
  dashboardUrl: string;
}): Promise<void> {
  const resend = getResend();
  const name = props.firstName ?? "there";

  const content = `
    <h1 style="margin:0 0 24px;font-size:26px;font-weight:400;color:${C.brand};line-height:1.25;letter-spacing:-0.02em;">
      Your protocol is ready, ${name}.
    </h1>

    <p style="margin:0 0 16px;font-size:15px;color:${C.muted};line-height:1.65;">
      Your personalized Attractiveness Protocol has been finalized by our specialist + AI review team.
    </p>

    <p style="margin:0 0 32px;font-size:15px;color:${C.muted};line-height:1.65;">
      It includes your full body analysis, your attractiveness score, and a science-backed roadmap tailored to your specific proportions and goals.
    </p>

    ${btn("View my protocol →", props.dashboardUrl)}

    <p style="margin:32px 0 0;font-size:13px;color:${C.subtle};line-height:1.6;">
      Questions about your protocol? Reply directly to this email.
    </p>
  `;

  const { error } = await resend.emails.send({
    from: FROM,
    to: props.email,
    subject: "Your Attractiveness Protocol is ready 🎯",
    html: emailShell(content),
  });

  if (error) throw new Error(`[resend] sendProtocolDeliveredEmail failed: ${error.message}`);
  console.log("[resend] protocol delivered email sent", { email: props.email });
}

// ─────────────────────────────────────────────────────────
// Purchase confirmation — for existing users (no registration needed)
// ─────────────────────────────────────────────────────────
export async function sendPurchaseConfirmationEmail(props: {
  email: string;
  firstName?: string;
  amount: number;
  currency: string;
}): Promise<void> {
  const resend = getResend();
  const name = props.firstName ?? "there";
  const formattedAmount = `$${props.amount.toFixed(2)}`;

  const content = `
    <h1 style="margin:0 0 24px;font-size:26px;font-weight:400;color:${C.brand};line-height:1.25;letter-spacing:-0.02em;">
      Order confirmed, ${name}.
    </h1>

    <p style="margin:0 0 24px;font-size:15px;color:${C.muted};line-height:1.65;">
      Your payment has been received. Our specialist + AI review team will now build your personalized Attractiveness Protocol based on your body analysis.
    </p>

    <!-- Order summary -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};border-radius:10px;border:1px solid ${C.border};margin:0 0 32px;">
      <tr>
        <td style="padding:16px 20px;font-size:13px;font-weight:600;color:${C.subtle};letter-spacing:0.06em;text-transform:uppercase;border-bottom:1px solid ${C.border};">Order summary</td>
      </tr>
      <tr>
        <td style="padding:16px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:15px;color:${C.text};">Attractiveness Protocol</td>
              <td align="right" style="font-size:15px;font-weight:600;color:${C.brand};">${formattedAmount}</td>
            </tr>
            <tr>
              <td colspan="2" style="padding:8px 0;"><div style="height:1px;background:${C.border};"></div></td>
            </tr>
            <tr>
              <td style="font-size:13px;color:${C.subtle};">Full body analysis · Personalized roadmap</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 8px;font-size:15px;color:${C.muted};line-height:1.65;">
      We'll notify you by email as soon as your protocol is ready to view in your dashboard.
    </p>
    <p style="margin:0;font-size:13px;color:${C.subtle};line-height:1.6;">
      Questions? Reply directly to this email.
    </p>
  `;

  const { error } = await resend.emails.send({
    from: FROM,
    to: props.email,
    subject: "Your Protocol Club order is confirmed",
    html: emailShell(content),
  });

  if (error) throw new Error(`[resend] sendPurchaseConfirmationEmail failed: ${error.message}`);
  console.log("[resend] purchase confirmation email sent", { email: props.email });
}

// ─────────────────────────────────────────────────────────
// Abandoned cart — email 1 (10 min) and email 2 (4h)
// ─────────────────────────────────────────────────────────
export async function sendAbandonedCartEmail(props: {
  email: string;
  firstName?: string;
  checkoutUrl: string;
  emailNumber: 1 | 2;
}): Promise<void> {
  const resend = getResend();
  const name = props.firstName ?? "there";
  const isSecond = props.emailNumber === 2;

  const subject = isSecond
    ? "Still thinking about it?"
    : "Your body analysis is waiting";

  const content = isSecond ? `
    <h1 style="margin:0 0 24px;font-size:26px;font-weight:400;color:${C.brand};line-height:1.25;letter-spacing:-0.02em;">
      Still thinking about it, ${name}?
    </h1>

    <p style="margin:0 0 16px;font-size:15px;color:${C.muted};line-height:1.65;">
      A few hours ago you started your questionnaire. We've analyzed 100+ attractiveness markers for your profile — but your protocol hasn't been built yet.
    </p>

    <p style="margin:0 0 32px;font-size:15px;color:${C.muted};line-height:1.65;">
      Most guys who complete it see exactly what's holding their score back within the first read. It's not guesswork — it's your data.
    </p>

    ${btn("Get my protocol — $89 →", props.checkoutUrl)}

    <p style="margin:24px 0 0;font-size:13px;color:${C.subtle};line-height:1.6;">
      90-day money-back guarantee. No conditions. This is our last email.
    </p>
  ` : `
    <h1 style="margin:0 0 24px;font-size:26px;font-weight:400;color:${C.brand};line-height:1.25;letter-spacing:-0.02em;">
      Your body analysis is waiting, ${name}.
    </h1>

    <p style="margin:0 0 16px;font-size:15px;color:${C.muted};line-height:1.65;">
      You started your questionnaire — which means we already have enough data to build your personalized Attractiveness Protocol.
    </p>

    <p style="margin:0 0 32px;font-size:15px;color:${C.muted};line-height:1.65;">
      Your protocol covers 15+ body proportions, your attractiveness score, and a science-backed roadmap built around your specific goals and body type.
    </p>

    ${btn("Complete my order — $89 →", props.checkoutUrl)}

    <p style="margin:24px 0 0;font-size:13px;color:${C.subtle};line-height:1.6;">
      90-day money-back guarantee. No conditions.
    </p>
  `;

  const { error } = await resend.emails.send({
    from: FROM,
    to: props.email,
    subject,
    html: emailShell(content),
  });

  if (error) {
    console.error("[resend] sendAbandonedCartEmail failed", { error: error.message, email: props.email, emailNumber: props.emailNumber });
    return;
  }
  console.log("[resend] abandoned cart email sent", { email: props.email, emailNumber: props.emailNumber });
}

// ─────────────────────────────────────────────────────────
// Questionnaire unlocked — sent when admin reopens questionnaire for edits
// ─────────────────────────────────────────────────────────
export async function sendQuestionnaireUnlockedEmail(props: {
  email: string;
  firstName?: string;
  questionnaireUrl: string;
}): Promise<void> {
  const resend = getResend();
  const name = props.firstName ?? "there";

  const content = `
    <h1 style="margin:0 0 24px;font-size:26px;font-weight:400;color:${C.brand};line-height:1.25;letter-spacing:-0.02em;">
      Your assessment is open for edits, ${name}.
    </h1>

    <p style="margin:0 0 16px;font-size:15px;color:${C.muted};line-height:1.65;">
      Our team has a few questions or needs you to adjust something in your assessment before we can finalize your Protocol.
    </p>

    <p style="margin:0 0 32px;font-size:15px;color:${C.muted};line-height:1.65;">
      Click below to review and update your answers. Once you're done, submit again and we'll pick up right where we left off.
    </p>

    ${btn("Update my assessment →", props.questionnaireUrl)}

    <p style="margin:32px 0 0;font-size:13px;color:${C.subtle};line-height:1.6;">
      Questions? Reply directly to this email.
    </p>
  `;

  const { error } = await resend.emails.send({
    from: FROM_EXPERT,
    to: props.email,
    subject: "Action needed — please update your assessment",
    html: emailShell(content),
  });

  if (error) throw new Error(`[resend] sendQuestionnaireUnlockedEmail failed: ${error.message}`);
  console.log("[resend] questionnaire unlocked email sent", { email: props.email });
}

// ─────────────────────────────────────────────────────────
// Expert message — sent from admin to client
// reply-to routes inbound replies back to the admin panel
// ─────────────────────────────────────────────────────────
export async function sendExpertMessage(props: {
  email: string;
  firstName?: string;
  body: string;
  userId: string;
}): Promise<{ resendEmailId: string }> {
  const resend = getResend();
  const name = props.firstName ?? "there";

  const bodyHtml = props.body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");

  const content = `
    <p style="margin:0 0 20px;font-size:11px;font-weight:600;color:${C.subtle};letter-spacing:0.1em;text-transform:uppercase;">
      A Protocol expert sent you a message
    </p>

    <p style="margin:0 0 8px;font-size:15px;font-weight:500;color:${C.brand};">Hey ${name},</p>

    <p style="margin:0 0 32px;font-size:15px;color:${C.muted};line-height:1.7;">
      ${bodyHtml}
    </p>

    <div style="border-top:1px solid ${C.border};padding-top:20px;">
      <p style="margin:0;font-size:13px;color:${C.subtle};line-height:1.6;">
        Reply directly to this email — your expert will see your response.
      </p>
    </div>
  `;

  const inboundDomain = process.env.RESEND_INBOUND_DOMAIN ?? "inbound.protocol-club.com";

  const { data, error } = await resend.emails.send({
    from: FROM_EXPERT,
    to: props.email,
    reply_to: `reply+${props.userId}@${inboundDomain}`,
    subject: "A message from your Protocol expert",
    html: emailShell(content),
  });

  if (error || !data) throw new Error(`[resend] sendExpertMessage failed: ${error?.message ?? "no data"}`);
  console.log("[resend] expert message sent", { email: props.email, userId: props.userId, id: data.id });
  return { resendEmailId: data.id };
}

// ─────────────────────────────────────────────────────────
// Questionnaire reminder — J+1, J+3, J+6 post-purchase
// Only sent if questionnaire not yet submitted
// ─────────────────────────────────────────────────────────
export async function sendQuestionnaireReminderEmail(props: {
  email: string;
  firstName?: string;
  assessmentUrl: string;
}): Promise<void> {
  const resend = getResend();
  const name = props.firstName ?? "there";

  const content = `
    <h1 style="margin:0 0 24px;font-size:26px;font-weight:400;color:${C.brand};line-height:1.25;letter-spacing:-0.02em;">
      Your protocol is on hold, ${name}.
    </h1>

    <p style="margin:0 0 16px;font-size:15px;color:${C.muted};line-height:1.65;">
      You purchased your Attractiveness Protocol but your assessment isn't complete yet.
    </p>

    <p style="margin:0 0 32px;font-size:15px;color:${C.muted};line-height:1.65;">
      We can't build your protocol until we have your full answers. The more precise your inputs, the more accurate your results. It takes less than 10 minutes to finish.
    </p>

    ${btn("Complete my assessment →", props.assessmentUrl)}

    <p style="margin:24px 0 0;font-size:13px;color:${C.subtle};line-height:1.6;">
      Your answers are encrypted and never shared. Photos are deleted after 12 weeks.
    </p>
  `;

  const { error } = await resend.emails.send({
    from: FROM,
    to: props.email,
    subject: `Your protocol is on hold, ${name}`,
    html: emailShell(content),
  });

  if (error) {
    console.error("[resend] sendQuestionnaireReminderEmail failed", { error: error.message, email: props.email });
    return;
  }
  console.log("[resend] questionnaire reminder email sent", { email: props.email });
}
