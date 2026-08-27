import { Resend } from "resend";
import { createUnsubscribeToken } from "./unsubscribeToken";
import {
  getPatterns,
  getAgeContent,
  getEnvParagraph,
  getHistoryParagraph,
} from "./report-content";

const FROM         = "Protocol Club <hello@protocol-club.com>";
const FROM_EXPERT  = "Protocol Expert <expert@protocol-club.com>";
const FROM_PIERRE  = "Pierre <hello@protocol-club.com>";

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://protocol-club.com";
const FOUNDER_REPLY_TO = "patrypierreandre@gmail.com";

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
// Marketing send wrapper — generates an unsubscribe token,
// appends a footer to the rendered HTML, and produces the
// List-Unsubscribe headers (RFC 8058 one-click).
//
// All nurture sequence sends + abandoned-cart should go through
// this so suppression + compliance are uniform.
// ─────────────────────────────────────────────────────────
export async function buildMarketingFooter(email: string): Promise<{
  footerHtml: string;
  listUnsubscribeHeader: string;
  listUnsubscribePost: string;
}> {
  const token = await createUnsubscribeToken(email);
  const unsubUrl = `${SITE_URL}/api/email/unsubscribe?token=${token}`;

  const footerHtml = `
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0 0;">
      <tr><td style="text-align:center;">
        <p style="margin:0;font-size:11px;color:${C.subtle};line-height:1.6;">
          You're receiving this because you opted in for your Protocol Club report.<br>
          <a href="${unsubUrl}" style="color:${C.subtle};text-decoration:underline;">Unsubscribe</a> · Protocol Club, Paris, France
        </p>
      </td></tr>
    </table>`;

  return {
    footerHtml,
    listUnsubscribeHeader: `<${unsubUrl}>`,
    listUnsubscribePost: "List-Unsubscribe=One-Click",
  };
}

// Inject the marketing footer just before the closing </body> of an emailShell-wrapped HTML.
export function appendUnsubscribeFooter(html: string, footerHtml: string): string {
  return html.replace("</body>", `${footerHtml}</body>`);
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
// Protocol Dating — post-purchase confirmation + upload link
// ─────────────────────────────────────────────────────────
export async function sendDatingConfirmationEmail(props: {
  email: string;
  firstName?: string;
  uploadUrl: string;
}): Promise<void> {
  const resend = getResend();
  const name = props.firstName ?? "there";

  const content = `
    <h1 style="margin:0 0 8px;font-size:26px;font-weight:400;color:${C.brand};line-height:1.25;letter-spacing:-0.02em;">
      Payment confirmed.<br>Now send us your photos.
    </h1>

    <p style="margin:24px 0;font-size:15px;color:${C.muted};line-height:1.65;">
      Hey ${name} — your Protocol Dating order is in. Upload 6–12 recent photos and our AI studio gets to work.
    </p>

    <p style="margin:0 0 32px;font-size:15px;color:${C.muted};line-height:1.65;">
      Different angles, good light, face clearly visible. Phone selfies work.
    </p>

    ${btn("Upload my photos →", props.uploadUrl)}

    <p style="margin:32px 0 0;font-size:13px;color:${C.subtle};line-height:1.6;">
      Your 30 photos land in your inbox within 24 hours of your upload.
    </p>
  `;

  const { error } = await resend.emails.send({
    from: FROM,
    to: props.email,
    subject: "Your order is confirmed — upload your photos",
    html: emailShell(content),
  });

  if (error) throw new Error(`[resend] sendDatingConfirmationEmail failed: ${error.message}`);
  console.log("[resend] dating confirmation email sent", { email: props.email });
}

// ─────────────────────────────────────────────────────────
// Experiments — post-purchase confirmation (generic, driven
// by the lib/experiments.ts registry)
// ─────────────────────────────────────────────────────────
export async function sendExperimentConfirmationEmail(props: {
  email: string;
  firstName?: string;
  brand: string;
  productName: string;
  deliveryPromise: string;
  billing?: "one_time" | "subscription";
  renewalInterval?: "week" | "month" | "year";
  trialDays?: number;
}): Promise<void> {
  const resend = getResend();
  const name = props.firstName ?? "there";
  const isSubscription = props.billing === "subscription";
  const isTrial = isSubscription && !!props.trialDays;
  const renews = props.renewalInterval ? `${props.renewalInterval}ly` : "automatically";

  const headline = isTrial ? "Your free trial has started." : "You're all set.";

  const openingLine = isTrial
    ? `Hey ${name} — your ${props.brand} ${props.trialDays}-day free trial is live. You won&rsquo;t be charged until it ends.`
    : `Hey ${name} — your ${props.brand} membership is in. Your first result lands by email ${props.deliveryPromise}.`;

  const refundLine = isTrial
    ? `Not for you? Cancel before the trial ends and you pay nothing — just reply &ldquo;cancel&rdquo; to this email.`
    : isSubscription
    ? `Not for you? Reply to this email — your first payment is refunded, no questions asked.`
    : `Not for you? Reply to this email — full refund, no questions asked.`;

  const renewalLine = isSubscription && !isTrial
    ? `<p style="margin:24px 0 0;font-size:15px;color:${C.muted};line-height:1.65;">
      Your membership renews ${renews}. Cancel anytime by replying &ldquo;cancel&rdquo; — handled the same day.
    </p>`
    : "";

  const content = `
    <h1 style="margin:0 0 8px;font-size:26px;font-weight:400;color:${C.brand};line-height:1.25;letter-spacing:-0.02em;">
      ${headline}
    </h1>

    <p style="margin:24px 0;font-size:15px;color:${C.muted};line-height:1.65;">
      ${openingLine}
    </p>

    <p style="margin:0;font-size:15px;color:${C.muted};line-height:1.65;">
      ${refundLine}
    </p>

    ${renewalLine}

    <p style="margin:32px 0 0;font-size:13px;color:${C.subtle};line-height:1.6;">
      Order: ${props.productName}
    </p>
  `;

  const { error } = await resend.emails.send({
    from: FROM,
    to: props.email,
    subject: isTrial ? `Your ${props.brand} free trial has started` : `Your ${props.brand} order is confirmed`,
    html: emailShell(content),
  });

  if (error) throw new Error(`[resend] sendExperimentConfirmationEmail failed: ${error.message}`);
  console.log("[resend] experiment confirmation email sent", { email: props.email, brand: props.brand });
}

// ─────────────────────────────────────────────────────────
// Protocol Dating — delivery notification (photos are ready)
// ─────────────────────────────────────────────────────────
export async function sendDatingDeliveryEmail(props: {
  email: string;
  firstName?: string;
  galleryUrl: string;
  photoCount: number;
}): Promise<void> {
  const resend = getResend();
  const name = props.firstName ?? "there";

  const content = `
    <h1 style="margin:0 0 8px;font-size:26px;font-weight:400;color:${C.brand};line-height:1.25;letter-spacing:-0.02em;">
      Your ${props.photoCount} photos are ready.
    </h1>

    <p style="margin:24px 0;font-size:15px;color:${C.muted};line-height:1.65;">
      Hey ${name} — the AI studio finished your shoot. ${props.photoCount} profile-ready photos across all styles, ready to download and post.
    </p>

    ${btn("View & download my photos →", props.galleryUrl)}

    <p style="margin:32px 0 0;font-size:13px;color:${C.subtle};line-height:1.6;">
      The link stays live — bookmark it. If any photo doesn't look like you or feel right, reply to this email and we'll regenerate free.
    </p>
  `;

  const { error } = await resend.emails.send({
    from: FROM,
    to: props.email,
    subject: `Your ${props.photoCount} dating photos are ready`,
    html: emailShell(content),
  });

  if (error) throw new Error(`[resend] sendDatingDeliveryEmail failed: ${error.message}`);
  console.log("[resend] dating delivery email sent", { email: props.email, count: props.photoCount });
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
//
// Both emails reuse report-content helpers when funnel answers are
// available, falling back to a generic copy if not. This makes the
// cart recovery feel like a continuation of the report rather than
// a generic relaunch.
// ─────────────────────────────────────────────────────────
export async function sendAbandonedCartEmail(props: {
  email: string;
  firstName?: string;
  checkoutUrl: string;
  emailNumber: 1 | 2;
  morphology?: string;
  pastSolutions?: string | string[];
}): Promise<void> {
  const resend = getResend();
  const name = props.firstName ?? "there";
  const isSecond = props.emailNumber === 2;

  const patterns = getPatterns(props.morphology ?? "Average");
  const hasMorpho = Boolean(props.morphology);

  let subject: string;
  let content: string;

  if (isSecond) {
    // E2 cart — actionable pattern + target numbers
    subject = hasMorpho
      ? patterns.p2t
      : "Your protocol projection — last call";

    content = `
      <p style="margin:0 0 24px;font-size:15px;color:${C.muted};line-height:1.7;">
        A few hours ago you started your questionnaire. Here's the part of the report most men miss on the first read.
      </p>

      <h2 style="margin:0 0 16px;font-size:22px;font-weight:500;color:${C.brand};line-height:1.3;letter-spacing:-0.01em;">
        ${patterns.p2t}
      </h2>

      <p style="margin:0 0 20px;font-size:15px;color:${C.muted};line-height:1.7;">${patterns.p2b}</p>

      <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:${C.brand};letter-spacing:-0.01em;">
        ${patterns.p4t}
      </p>
      <p style="margin:0 0 32px;font-size:15px;color:${C.muted};line-height:1.7;">${patterns.p4b}</p>

      ${btn("Get my protocol — $89 →", props.checkoutUrl)}

      <p style="margin:24px 0 0;font-size:13px;color:${C.subtle};line-height:1.6;">
        90-day money-back guarantee. No conditions.
      </p>
    `;
  } else {
    // E1 cart — wedge on past_solutions + emotional pattern teaser
    const historyLine = props.pastSolutions
      ? getHistoryParagraph(props.pastSolutions)
      : "";

    subject = hasMorpho
      ? `${patterns.p1t} — ${name}`
      : `Your body analysis is waiting, ${name}`;

    content = `
      <p style="margin:0 0 20px;font-size:15px;color:${C.muted};line-height:1.7;">
        ${name}, your questionnaire is in. We've already mapped the patterns specific to your build.
      </p>

      ${historyLine ? `<p style="margin:0 0 20px;font-size:15px;color:${C.muted};line-height:1.7;">${historyLine}</p>` : ""}

      <h2 style="margin:0 0 16px;font-size:20px;font-weight:500;color:${C.brand};line-height:1.3;letter-spacing:-0.01em;">
        ${patterns.p1t}
      </h2>

      <p style="margin:0 0 32px;font-size:15px;color:${C.muted};line-height:1.7;">
        That's the pattern your protocol is built around. The full path is one click away.
      </p>

      ${btn("Complete my order — $89 →", props.checkoutUrl)}

      <p style="margin:24px 0 0;font-size:13px;color:${C.subtle};line-height:1.6;">
        90-day money-back guarantee. No conditions.
      </p>
    `;
  }

  const footer = await buildMarketingFooter(props.email);
  const html = appendUnsubscribeFooter(emailShell(content), footer.footerHtml);

  const { error } = await resend.emails.send({
    from: FROM,
    to: props.email,
    subject,
    html,
    headers: {
      "List-Unsubscribe": footer.listUnsubscribeHeader,
      "List-Unsubscribe-Post": footer.listUnsubscribePost,
    },
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
    replyTo: `reply+${props.userId}@${inboundDomain}`,
    subject: "A message from your Protocol expert",
    html: emailShell(content),
  });

  if (error || !data) throw new Error(`[resend] sendExpertMessage failed: ${error?.message ?? "no data"}`);
  console.log("[resend] expert message sent", { email: props.email, userId: props.userId, id: data.id });
  return { resendEmailId: data.id };
}

// ─────────────────────────────────────────────────────────
// Report ready — sent after quiz optin with link to analysis
// ─────────────────────────────────────────────────────────
export async function sendReportEmail(props: {
  email: string;
  firstName?: string;
  reportUrl: string;
}): Promise<void> {
  const resend = getResend();
  const name = props.firstName ?? "there";

  const content = `
    <h1 style="margin:0 0 8px;font-size:26px;font-weight:400;color:${C.brand};line-height:1.25;letter-spacing:-0.02em;">
      Your preliminary report is ready, ${name}.
    </h1>
    <p style="margin:8px 0 24px;font-size:13px;color:${C.subtle};line-height:1.5;">
      Based on your quiz answers — not yet a full personalized analysis.
    </p>

    <p style="margin:0 0 16px;font-size:15px;color:${C.muted};line-height:1.65;">
      We've generated a preliminary report from your profile: body projection, patterns specific to your type, and a complete example of what a personalized analysis looks like.
    </p>

    <p style="margin:0 0 32px;font-size:15px;color:${C.muted};line-height:1.65;">
      The preliminary report is a starting point. The full analysis — built from your actual photos and measurements — goes much deeper.
    </p>

    ${btn("View my preliminary report →", props.reportUrl)}

    <p style="margin:28px 0 0;font-size:13px;color:${C.subtle};line-height:1.6;">
      This link is yours — bookmark it to come back anytime.<br>
      Questions? Reply directly to this email.
    </p>
  `;

  const { error } = await resend.emails.send({
    from: FROM,
    to: props.email,
    subject: `${name}, your preliminary report is ready`,
    html: emailShell(content),
  });

  if (error) {
    console.error("[resend] sendReportEmail failed", { error: error.message, email: props.email });
    return;
  }
  console.log("[resend] report email sent", { email: props.email });
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

// ═════════════════════════════════════════════════════════
// LEAD NURTURE SEQUENCE (E2–E7)
// Triggered between optin (E1 = sendReportEmail) and checkout.
// Each email reuses one unique content block from the report,
// so the email feels like a continuation rather than a relaunch.
// All marketing sends go through buildMarketingFooter + List-Unsubscribe.
// ═════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────
// E2 — T+24h · Wedge passé
// Subject + opener vary by past_solutions; body reuses getHistoryParagraph.
// ─────────────────────────────────────────────────────────
export async function sendNurtureWedgeEmail(props: {
  email: string;
  firstName?: string;
  pastSolutions?: string | string[];
  reportUrl: string;
}): Promise<void> {
  const resend = getResend();
  const name = props.firstName ?? "there";

  const raw = Array.isArray(props.pastSolutions)
    ? props.pastSolutions.join("|")
    : (props.pastSolutions ?? "");
  const lower = raw.toLowerCase();

  let subject: string;
  if (lower.includes("personal trainer"))      subject = `The trainer wasn't aimed at this, ${name}`;
  else if (lower.includes("youtube"))           subject = `Why YouTube failed your build`;
  else if (lower.includes("diet"))              subject = `Diets shrink you. They don't reshape you.`;
  else if (lower.includes("surgery"))           subject = `One variable isn't the answer`;
  else if (lower.includes("nothing"))           subject = `${name}, the zero-baseline advantage`;
  else                                          subject = `What you've tried wasn't built for this`;

  const opener = "One line from your report keeps coming back in replies.";

  const historyPara = getHistoryParagraph(props.pastSolutions ?? "");

  const content = `
    <p style="margin:0 0 24px;font-size:15px;color:${C.muted};line-height:1.7;">${opener}</p>

    <p style="margin:0 0 20px;font-size:15px;color:${C.muted};line-height:1.7;">${historyPara}</p>

    <p style="margin:0 0 32px;font-size:15px;color:${C.muted};line-height:1.7;">
      This is exactly why your protocol orders the variables in the sequence it does, not the gym's.
    </p>

    ${btn("Re-open my report →", props.reportUrl)}

    <p style="margin:28px 0 0;font-size:13px;color:${C.subtle};line-height:1.6;">
      If you remember exactly what your report said about your build, you're ahead of most men who download it.
    </p>
  `;

  const footer = await buildMarketingFooter(props.email);
  const html = appendUnsubscribeFooter(emailShell(content), footer.footerHtml);

  const { error } = await resend.emails.send({
    from: FROM,
    to: props.email,
    subject,
    html,
    headers: {
      "List-Unsubscribe": footer.listUnsubscribeHeader,
      "List-Unsubscribe-Post": footer.listUnsubscribePost,
    },
  });

  if (error) {
    console.error("[resend] sendNurtureWedgeEmail failed", { error: error.message, email: props.email });
    return;
  }
  console.log("[resend] nurture E2 (wedge) sent", { email: props.email });
}

// ─────────────────────────────────────────────────────────
// E3 — T+48h · Insight ignoré
// Subject = patterns.p2t (the under-read pattern), body = p2b + dataset fact.
// ─────────────────────────────────────────────────────────
export async function sendNurtureInsightEmail(props: {
  email: string;
  firstName?: string;
  morphology?: string;
  offerUrl: string;
}): Promise<void> {
  const resend = getResend();
  const patterns = getPatterns(props.morphology ?? "Average");

  const opener = "Quick check — when you read your report, did this one stick?";

  const content = `
    <p style="margin:0 0 24px;font-size:15px;color:${C.muted};line-height:1.7;">${opener}</p>

    <h2 style="margin:0 0 16px;font-size:22px;font-weight:500;color:${C.brand};line-height:1.3;letter-spacing:-0.01em;">
      ${patterns.p2t}
    </h2>

    <p style="margin:0 0 20px;font-size:15px;color:${C.muted};line-height:1.7;">${patterns.p2b}</p>

    <p style="margin:0 0 32px;font-size:15px;color:${C.muted};line-height:1.7;">
      Across the 2,500+ men in our reference dataset, this single variable explains a disproportionate share of the perceived-attractiveness score for your build. It's the cheapest win in the protocol.
    </p>

    <p style="margin:0 0 32px;font-size:15px;color:${C.brand};line-height:1.7;font-weight:500;">
      Most miss it. You don't have to.
    </p>

    ${btn("See my full protocol →", props.offerUrl)}
  `;

  const footer = await buildMarketingFooter(props.email);
  const html = appendUnsubscribeFooter(emailShell(content), footer.footerHtml);

  const { error } = await resend.emails.send({
    from: FROM,
    to: props.email,
    subject: patterns.p2t,
    html,
    headers: {
      "List-Unsubscribe": footer.listUnsubscribeHeader,
      "List-Unsubscribe-Post": footer.listUnsubscribePost,
    },
  });

  if (error) {
    console.error("[resend] sendNurtureInsightEmail failed", { error: error.message, email: props.email });
    return;
  }
  console.log("[resend] nurture E3 (insight) sent", { email: props.email });
}

// ─────────────────────────────────────────────────────────
// E4 — T+72h · Mirror social
// Anchors on patterns.p1; optionally weaves in AI photo analysis if present.
// ─────────────────────────────────────────────────────────
export async function sendNurtureMirrorEmail(props: {
  email: string;
  firstName?: string;
  morphology?: string;
  ageBracket?: string;
  analysisText?: string | null;
  offerUrl: string;
}): Promise<void> {
  const resend = getResend();
  const name = props.firstName ?? "there";
  const patterns = getPatterns(props.morphology ?? "Average");
  const ageLabel = props.ageBracket ? `(${props.ageBracket})` : "";

  const opener = "I want to show you what someone who started where you are now looks like 12 weeks in.";

  // If we have a real AI photo analysis, weave a single sentence from it.
  // Otherwise fall back to the pattern p1b body as the mirror.
  const analysisLine = props.analysisText
    ? `<p style="margin:0 0 20px;font-size:15px;color:${C.muted};line-height:1.7;">The analysis we ran on your photo flagged the same pattern we surface for men on this build. ${props.analysisText.split(/[.\n]/).filter(Boolean)[0]?.trim() ?? ""}.</p>`
    : "";

  const content = `
    <p style="margin:0 0 24px;font-size:15px;color:${C.muted};line-height:1.7;">Hey ${name},</p>

    <p style="margin:0 0 24px;font-size:15px;color:${C.muted};line-height:1.7;">${opener}</p>

    <p style="margin:0 0 16px;font-size:15px;color:${C.muted};line-height:1.7;">
      Adam ${ageLabel}, ${props.morphology ?? "same build"}. He'd hit the same wall your report describes — the <em style="color:${C.brand};font-style:normal;font-weight:500;">${patterns.p1t.toLowerCase()}</em> pattern. Standard programs, no proportional change.
    </p>

    <p style="margin:0 0 20px;font-size:15px;color:${C.muted};line-height:1.7;">
      ${patterns.p1b}
    </p>

    ${analysisLine}

    <p style="margin:0 0 32px;font-size:15px;color:${C.muted};line-height:1.7;">
      He moved past it in 12 weeks. The same path is in your protocol.
    </p>

    ${btn("Lock in my protocol →", props.offerUrl)}
  `;

  const footer = await buildMarketingFooter(props.email);
  const html = appendUnsubscribeFooter(emailShell(content), footer.footerHtml);

  const { error } = await resend.emails.send({
    from: FROM,
    to: props.email,
    subject: `Same build, 12 weeks later — ${name}`,
    html,
    headers: {
      "List-Unsubscribe": footer.listUnsubscribeHeader,
      "List-Unsubscribe-Post": footer.listUnsubscribePost,
    },
  });

  if (error) {
    console.error("[resend] sendNurtureMirrorEmail failed", { error: error.message, email: props.email });
    return;
  }
  console.log("[resend] nurture E4 (mirror) sent", { email: props.email });
}

// ─────────────────────────────────────────────────────────
// E5 — T+5j · Stakes contextuels
// Reuses getEnvParagraph + a fragment of getAgeContent.
// Subject varies by social_environment; gay/bi adds 1 opt-in line.
// ─────────────────────────────────────────────────────────
export async function sendNurtureStakesEmail(props: {
  email: string;
  firstName?: string;
  socialEnvironment?: string;
  ageBracket?: string;
  sexualOrientation?: string;
  offerUrl: string;
}): Promise<void> {
  const resend = getResend();
  const name = props.firstName ?? "there";
  const env = props.socialEnvironment ?? "";

  const subjectByEnv: Record<string, string> = {
    "Corporate":                `The executive presence variable, ${name}`,
    "Entrepreneur / Startup":   `Signaling in rooms that matter`,
    "Manual / Trade work":      `Looking strong AND looking sharp`,
    "Creative / Freelance":     `The composed-not-muscular target`,
    "Medical / Healthcare":     `You know the literature, ${name}`,
    "Student":                  `Term-by-term, not year-by-year`,
  };
  const subject = subjectByEnv[env] ?? `What your environment changes, ${name}`;

  const envPara = getEnvParagraph(env);
  const ageContent = getAgeContent(props.ageBracket ?? "");

  const orient = (props.sexualOrientation ?? "").toLowerCase();
  const orientLine = (orient === "gay" || orient === "bisexual")
    ? `<p style="margin:0 0 20px;font-size:15px;color:${C.muted};line-height:1.7;">Aesthetic standards and physique references differ when you're optimizing for men. Your protocol accounts for that — that's why we asked.</p>`
    : "";

  const ageBlock = ageContent
    ? `<p style="margin:0 0 8px;font-size:14px;font-weight:600;color:${C.brand};letter-spacing:-0.01em;">${ageContent.title}</p>
       <p style="margin:0 0 20px;font-size:15px;color:${C.muted};line-height:1.7;">${ageContent.body.split(/[.\n]/).filter(Boolean).slice(0, 2).join(". ").trim()}.</p>`
    : "";

  const content = `
    <p style="margin:0 0 24px;font-size:15px;color:${C.muted};line-height:1.7;">Your report touched on this briefly. Here's the longer version.</p>

    <p style="margin:0 0 20px;font-size:15px;color:${C.muted};line-height:1.7;">${envPara}</p>

    ${ageBlock}

    ${orientLine}

    <p style="margin:0 0 32px;font-size:15px;color:${C.muted};line-height:1.7;">
      This isn't generic "be in shape" advice. Your protocol is calibrated for the specific intersection of your build, your stage, and your environment.
    </p>

    ${btn("View my protocol →", props.offerUrl)}
  `;

  const footer = await buildMarketingFooter(props.email);
  const html = appendUnsubscribeFooter(emailShell(content), footer.footerHtml);

  const { error } = await resend.emails.send({
    from: FROM,
    to: props.email,
    subject,
    html,
    headers: {
      "List-Unsubscribe": footer.listUnsubscribeHeader,
      "List-Unsubscribe-Post": footer.listUnsubscribePost,
    },
  });

  if (error) {
    console.error("[resend] sendNurtureStakesEmail failed", { error: error.message, email: props.email });
    return;
  }
  console.log("[resend] nurture E5 (stakes) sent", { email: props.email });
}

// ─────────────────────────────────────────────────────────
// E6 — T+8j · Projection + targets
// Embeds before/after images + patterns.p4b target numbers.
// Highest-revenue email of the sequence.
// ─────────────────────────────────────────────────────────
export async function sendNurtureProjectionEmail(props: {
  email: string;
  firstName?: string;
  morphology?: string;
  beforeUrl?: string | null;
  afterUrl?: string | null;
  offerUrl: string;
}): Promise<void> {
  const resend = getResend();
  const name = props.firstName ?? "there";
  const patterns = getPatterns(props.morphology ?? "Average");

  const imagesBlock = (props.beforeUrl && props.afterUrl)
    ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
      <tr>
        <td width="48%" style="padding:0 4px 0 0;">
          <img src="${props.beforeUrl}" alt="You now" style="width:100%;height:auto;display:block;border-radius:12px;border:1px solid ${C.border};">
          <p style="margin:6px 0 0;font-size:11px;color:${C.subtle};letter-spacing:0.08em;text-transform:uppercase;text-align:center;">Now</p>
        </td>
        <td width="48%" style="padding:0 0 0 4px;">
          <img src="${props.afterUrl}" alt="Projection" style="width:100%;height:auto;display:block;border-radius:12px;border:1px solid ${C.border};">
          <p style="margin:6px 0 0;font-size:11px;color:${C.subtle};letter-spacing:0.08em;text-transform:uppercase;text-align:center;">Projection</p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 28px;font-size:12px;color:${C.subtle};line-height:1.6;text-align:center;">
      Generated from your photo, calibrated on the 2,500+ men dataset.
    </p>`
    : `
    <p style="margin:0 0 28px;font-size:14px;color:${C.subtle};line-height:1.6;font-style:italic;">
      Your protocol projection is built on your specific proportions — your photo unlocks the visual version.
    </p>`;

  const content = `
    <p style="margin:0 0 24px;font-size:15px;color:${C.muted};line-height:1.7;">${name}, one image. One reason this keeps coming back to you.</p>

    <h2 style="margin:0 0 20px;font-size:22px;font-weight:500;color:${C.brand};line-height:1.3;letter-spacing:-0.01em;">
      Your before. Your projection.
    </h2>

    ${imagesBlock}

    <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:${C.brand};letter-spacing:-0.01em;">
      ${patterns.p4t}
    </p>
    <p style="margin:0 0 28px;font-size:15px;color:${C.muted};line-height:1.7;">${patterns.p4b}</p>

    <p style="margin:0 0 32px;font-size:15px;color:${C.brand};line-height:1.7;font-weight:500;">
      The protocol is the path. The projection is the proof the path exists.
    </p>

    ${btn("Get my protocol — $89 →", props.offerUrl)}

    <p style="margin:24px 0 0;font-size:13px;color:${C.subtle};line-height:1.6;">
      90-day money-back guarantee. No conditions.
    </p>
  `;

  const footer = await buildMarketingFooter(props.email);
  const html = appendUnsubscribeFooter(emailShell(content), footer.footerHtml);

  const { error } = await resend.emails.send({
    from: FROM,
    to: props.email,
    subject: `Your projection, ${name}`,
    html,
    headers: {
      "List-Unsubscribe": footer.listUnsubscribeHeader,
      "List-Unsubscribe-Post": footer.listUnsubscribePost,
    },
  });

  if (error) {
    console.error("[resend] sendNurtureProjectionEmail failed", { error: error.message, email: props.email });
    return;
  }
  console.log("[resend] nurture E6 (projection) sent", { email: props.email });
}

// ─────────────────────────────────────────────────────────
// E7 — T+13j · Breakup
// Founder-letter style, no design, no button. Reply-driver.
// Sent from FROM_PIERRE with reply-to going to the founder inbox.
// ─────────────────────────────────────────────────────────
export async function sendNurtureBreakupEmail(props: {
  email: string;
  firstName?: string;
}): Promise<void> {
  const resend = getResend();
  const name = props.firstName ?? "there";

  // Intentionally plain — no headlines, no buttons. Anti-fingerprint format.
  const content = `
    <p style="margin:0 0 18px;font-size:15px;color:${C.text};line-height:1.7;">Hey ${name},</p>

    <p style="margin:0 0 18px;font-size:15px;color:${C.text};line-height:1.7;">
      Two weeks since you generated your report. I'm closing your assessment file unless I hear back.
    </p>

    <p style="margin:0 0 18px;font-size:15px;color:${C.text};line-height:1.7;">
      No link, no pitch. Just one question:
    </p>

    <p style="margin:0 0 18px;font-size:16px;color:${C.brand};line-height:1.7;font-weight:500;">
      What stopped you?
    </p>

    <p style="margin:0 0 8px;font-size:15px;color:${C.text};line-height:1.8;">1 — too expensive</p>
    <p style="margin:0 0 8px;font-size:15px;color:${C.text};line-height:1.8;">2 — not for me</p>
    <p style="margin:0 0 8px;font-size:15px;color:${C.text};line-height:1.8;">3 — wrong timing</p>
    <p style="margin:0 0 24px;font-size:15px;color:${C.text};line-height:1.8;">4 — something else (reply with one word)</p>

    <p style="margin:0 0 18px;font-size:15px;color:${C.text};line-height:1.7;">
      Whatever you pick, it helps me. Reply the number and I won't follow up unless you ask.
    </p>

    <p style="margin:0;font-size:15px;color:${C.text};line-height:1.7;">— Pierre</p>
  `;

  const footer = await buildMarketingFooter(props.email);
  const html = appendUnsubscribeFooter(emailShell(content), footer.footerHtml);

  const { error } = await resend.emails.send({
    from: FROM_PIERRE,
    to: props.email,
    replyTo: FOUNDER_REPLY_TO,
    subject: `Last email, ${name}`,
    html,
    headers: {
      "List-Unsubscribe": footer.listUnsubscribeHeader,
      "List-Unsubscribe-Post": footer.listUnsubscribePost,
    },
  });

  if (error) {
    console.error("[resend] sendNurtureBreakupEmail failed", { error: error.message, email: props.email });
    return;
  }
  console.log("[resend] nurture E7 (breakup) sent", { email: props.email });
}

// ═════════════════════════════════════════════════════════
// ADMIN INTERNAL NOTIFICATIONS
// Sent to the founder inbox to flag operational obligations.
// ═════════════════════════════════════════════════════════

const ADMIN_INBOX = process.env.ADMIN_NOTIFICATION_EMAIL ?? "patrypierreandre@gmail.com";

// ─────────────────────────────────────────────────────────
// Delivery reminder — fires 24h after purchase if protocol
// is not yet delivered. One-shot per user.
// ─────────────────────────────────────────────────────────
export async function sendAdminDeliveryReminderEmail(props: {
  userId: string;
  email: string;
  firstName?: string;
  paidAt: string;
  protocolStatus: string;
  rushDelivery: boolean;
  hoursSincePayment: number;
}): Promise<void> {
  const resend = getResend();
  const adminUrl = `${SITE_URL}/admin/orders/${props.userId}`;
  const hours = Math.floor(props.hoursSincePayment);
  const rushTag = props.rushDelivery ? " · 🔥 RUSH" : "";

  const content = `
    <p style="margin:0 0 12px;font-size:11px;font-weight:600;color:${C.subtle};letter-spacing:0.1em;text-transform:uppercase;">
      Delivery reminder${rushTag}
    </p>

    <h1 style="margin:0 0 24px;font-size:22px;font-weight:500;color:${C.brand};line-height:1.3;letter-spacing:-0.01em;">
      ${hours}h since payment — protocol still pending
    </h1>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};border-radius:10px;border:1px solid ${C.border};margin:0 0 28px;">
      <tr><td style="padding:16px 20px;">
        <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:${C.subtle};letter-spacing:0.06em;text-transform:uppercase;">Client</p>
        <p style="margin:0 0 12px;font-size:15px;color:${C.text};">${props.firstName ?? "—"} · ${props.email}</p>
        <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:${C.subtle};letter-spacing:0.06em;text-transform:uppercase;">Status</p>
        <p style="margin:0 0 12px;font-size:15px;color:${C.text};font-family:monospace;">${props.protocolStatus}</p>
        <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:${C.subtle};letter-spacing:0.06em;text-transform:uppercase;">Paid at</p>
        <p style="margin:0;font-size:15px;color:${C.text};">${new Date(props.paidAt).toLocaleString("en-GB", { timeZone: "Europe/Paris" })}</p>
      </td></tr>
    </table>

    ${btn("Open order in admin →", adminUrl)}

    <p style="margin:24px 0 0;font-size:13px;color:${C.subtle};line-height:1.6;">
      Sent once per order. If you've already started, ignore.
    </p>
  `;

  const { error } = await resend.emails.send({
    from: FROM,
    to: ADMIN_INBOX,
    subject: `[Delivery] ${hours}h · ${props.firstName ?? props.email}${rushTag}`,
    html: emailShell(content),
  });

  if (error) {
    console.error("[resend] sendAdminDeliveryReminderEmail failed", { error: error.message, userId: props.userId });
    return;
  }
  console.log("[resend] admin delivery reminder sent", { userId: props.userId, hours });
}
