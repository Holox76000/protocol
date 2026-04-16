import { Resend } from "resend";

const FROM = "Protocol Club <hello@protocol-club.com>";

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY not set");
  return new Resend(key);
}

// ─────────────────────────────────────────────────────────
// Welcome email — sent after purchase to create account
// ─────────────────────────────────────────────────────────
export async function sendWelcomeEmail(props: {
  email: string;
  firstName?: string;
  registrationUrl: string;
}): Promise<void> {
  const resend = getResend();
  const name = props.firstName ?? "there";

  const { error } = await resend.emails.send({
    from: FROM,
    to: props.email,
    subject: "Create your Protocol Club account",
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:48px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#111;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:40px 40px 32px;">
          <p style="margin:0 0 8px;font-size:13px;color:#888;letter-spacing:0.08em;text-transform:uppercase;">Protocol Club</p>
          <h1 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#fff;line-height:1.3;">
            Welcome ${name} 👋
          </h1>
          <p style="margin:0 0 16px;font-size:15px;color:#bbb;line-height:1.6;">
            Your payment is confirmed. All that's left is to create your account to access your protocol.
          </p>
          <p style="margin:0 0 32px;font-size:15px;color:#bbb;line-height:1.6;">
            Click the button below to set your password and access your dashboard.
          </p>
          <a href="${props.registrationUrl}"
             style="display:inline-block;background:#fff;color:#000;font-size:15px;font-weight:600;padding:14px 28px;border-radius:8px;text-decoration:none;">
            Create my account →
          </a>
          <p style="margin:32px 0 0;font-size:13px;color:#555;line-height:1.5;">
            This link is valid for 7 days. If you have any questions, reply directly to this email.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
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

  const { error } = await resend.emails.send({
    from: FROM,
    to: props.email,
    subject: "Your Protocol Club login link",
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:48px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#111;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:40px 40px 32px;">
          <p style="margin:0 0 8px;font-size:13px;color:#888;letter-spacing:0.08em;text-transform:uppercase;">Protocol Club</p>
          <h1 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#fff;line-height:1.3;">
            Your login link
          </h1>
          <p style="margin:0 0 16px;font-size:15px;color:#bbb;line-height:1.6;">
            Hey ${props.firstName}, here's your link to sign in to your Protocol Club dashboard.
          </p>
          <a href="${props.magicLinkUrl}"
             style="display:inline-block;background:#fff;color:#000;font-size:15px;font-weight:600;padding:14px 28px;border-radius:8px;text-decoration:none;">
            Sign in →
          </a>
          <p style="margin:32px 0 0;font-size:13px;color:#555;line-height:1.5;">
            This link expires in 20 minutes and can only be used once.<br>
            If you didn't request this, you can safely ignore this email.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });

  if (error) throw new Error(`[resend] sendMagicLinkEmail failed: ${error.message}`);
  console.log("[resend] magic link email sent", { email: props.email });
}

// ─────────────────────────────────────────────────────────
// Protocol delivered — notifies the client their protocol is ready
// ─────────────────────────────────────────────────────────
export async function sendProtocolDeliveredEmail(props: {
  email: string;
  firstName?: string;
  dashboardUrl: string;
}): Promise<void> {
  const resend = getResend();
  const name = props.firstName ?? "there";

  const { error } = await resend.emails.send({
    from: FROM,
    to: props.email,
    subject: "Your protocol is ready 🎯",
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:48px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#111;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:40px 40px 32px;">
          <p style="margin:0 0 8px;font-size:13px;color:#888;letter-spacing:0.08em;text-transform:uppercase;">Protocol Club</p>
          <h1 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#fff;line-height:1.3;">
            Your protocol is ready, ${name} 🎯
          </h1>
          <p style="margin:0 0 16px;font-size:15px;color:#bbb;line-height:1.6;">
            Your personalized protocol has been finalized and is now available in your dashboard.
          </p>
          <p style="margin:0 0 32px;font-size:15px;color:#bbb;line-height:1.6;">
            Sign in to view it and get started today.
          </p>
          <a href="${props.dashboardUrl}"
             style="display:inline-block;background:#fff;color:#000;font-size:15px;font-weight:600;padding:14px 28px;border-radius:8px;text-decoration:none;">
            View my protocol →
          </a>
          <p style="margin:32px 0 0;font-size:13px;color:#555;line-height:1.5;">
            Any questions? Reply directly to this email.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });

  if (error) throw new Error(`[resend] sendProtocolDeliveredEmail failed: ${error.message}`);
  console.log("[resend] protocol delivered email sent", { email: props.email });
}

// ─────────────────────────────────────────────────────────
// Purchase confirmation — sent immediately after payment
// ─────────────────────────────────────────────────────────
export async function sendPurchaseConfirmationEmail(props: {
  email: string;
  firstName?: string;
  amount: number;
  currency: string;
}): Promise<void> {
  const resend = getResend();
  const name = props.firstName ?? "there";
  const formattedAmount = `${props.amount.toFixed(2)} ${props.currency}`;

  const { error } = await resend.emails.send({
    from: FROM,
    to: props.email,
    subject: "Your Protocol Club order is confirmed",
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:48px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#111;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:40px 40px 32px;">
          <p style="margin:0 0 8px;font-size:13px;color:#888;letter-spacing:0.08em;text-transform:uppercase;">Protocol Club</p>
          <h1 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#fff;line-height:1.3;">
            Order confirmed ✓
          </h1>
          <p style="margin:0 0 24px;font-size:15px;color:#bbb;line-height:1.6;">
            Thanks ${name}, your payment has been received.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:8px;margin:0 0 28px;">
            <tr><td style="padding:20px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:14px;color:#888;">Product</td>
                  <td align="right" style="font-size:14px;color:#888;">Total</td>
                </tr>
                <tr><td colspan="2" style="padding:8px 0;border-bottom:1px solid #2a2a2a;"></td></tr>
                <tr>
                  <td style="padding-top:12px;font-size:15px;color:#fff;">Attractiveness Protocol</td>
                  <td align="right" style="padding-top:12px;font-size:15px;color:#fff;font-weight:600;">${formattedAmount}</td>
                </tr>
              </table>
            </td></tr>
          </table>
          <p style="margin:0 0 8px;font-size:15px;color:#bbb;line-height:1.6;">
            We're now building your personalized protocol. You'll receive an email as soon as it's ready.
          </p>
          <p style="margin:0;font-size:13px;color:#555;line-height:1.5;">
            Any questions? Reply directly to this email.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });

  if (error) throw new Error(`[resend] sendPurchaseConfirmationEmail failed: ${error.message}`);
  console.log("[resend] purchase confirmation email sent", { email: props.email });
}

// ─────────────────────────────────────────────────────────
// Abandoned cart — email 1 (10 min) and email 2 (4h)
// Triggered by the cron /api/cron/abandoned-cart
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
    ? "Last chance to start your protocol"
    : "You left something behind 👀";

  const heading = isSecond
    ? `${name}, your protocol is still waiting`
    : `Your protocol is waiting for you`;

  const body = isSecond
    ? `A few hours ago, you started your questionnaire but didn't complete your order. This is our last follow-up — we won't bother you after this.`
    : `You started filling out your questionnaire but didn't complete your order. Your personalized protocol is one click away.`;

  const cta = isSecond ? "Complete my order now →" : "Complete my order →";

  const { error } = await resend.emails.send({
    from: FROM,
    to: props.email,
    subject,
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:48px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#111;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:40px 40px 32px;">
          <p style="margin:0 0 8px;font-size:13px;color:#888;letter-spacing:0.08em;text-transform:uppercase;">Protocol Club</p>
          <h1 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#fff;line-height:1.3;">
            ${heading}
          </h1>
          <p style="margin:0 0 32px;font-size:15px;color:#bbb;line-height:1.6;">
            ${body}
          </p>
          <a href="${props.checkoutUrl}"
             style="display:inline-block;background:#fff;color:#000;font-size:15px;font-weight:600;padding:14px 28px;border-radius:8px;text-decoration:none;">
            ${cta}
          </a>
          <p style="margin:32px 0 0;font-size:13px;color:#555;line-height:1.5;">
            Any questions? Reply directly to this email.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });

  if (error) {
    console.error("[resend] sendAbandonedCartEmail failed", { error: error.message, email: props.email, emailNumber: props.emailNumber });
    return;
  }
  console.log("[resend] abandoned cart email sent", { email: props.email, emailNumber: props.emailNumber });
}
