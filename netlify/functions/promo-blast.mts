import { schedule } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import crypto from "node:crypto";

const SITE_URL = "https://protocol-club.com";
const FROM = "Protocol Club <hello@protocol-club.com>";
const PROMO_CODE = "SUMMER40";
const PROMO_DISCOUNT = "40%";
const ORIGINAL_PRICE = "$89";
const DISCOUNTED_PRICE = "$53.40";
const EXPIRY_LABEL = "Thursday, April 24 at midnight";
const OFFER_URL = `${SITE_URL}/f1/offer`;
const CART_RECOVERY_TOKEN_DAYS = 7;

const C = {
  bg: "#f9fbfb",
  card: "#ffffff",
  brand: "#253239",
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

async function getCartRecoveryUrl(
  sb: ReturnType<typeof getSupabase>,
  userId: string
): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(
    Date.now() + CART_RECOVERY_TOKEN_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  await sb.from("cart_recovery_tokens").delete().eq("user_id", userId);
  await sb
    .from("cart_recovery_tokens")
    .insert({ user_id: userId, token_hash: tokenHash, expires_at: expiresAt });

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

// Runs every day at 13:00 UTC = 9:00 AM EDT (New York)
// Guard: promo_summer40_sent_at IS NULL — never sends twice to the same user
const handler = schedule("0 13 * * *", async () => {
  const sb = getSupabase();
  const resend = new Resend(process.env.RESEND_API_KEY!);
  const now = new Date();

  // Stop sending after the offer expires (April 25 00:00 UTC)
  const offerExpiresAt = new Date("2026-04-25T00:00:00Z");
  if (now >= offerExpiresAt) {
    console.log("[promo-blast] Offer expired, skipping.");
    return { statusCode: 200 };
  }

  const { data: users, error } = await sb
    .from("users")
    .select("id, email, first_name")
    .eq("has_paid", false)
    .is("promo_summer40_sent_at", null)
    .limit(500);

  if (error) {
    console.error("[promo-blast] DB query failed", error.message);
    return { statusCode: 500 };
  }

  console.log(`[promo-blast] Sending to ${(users ?? []).length} users`);

  let sent = 0;
  let failed = 0;

  for (const user of users ?? []) {
    // Mark as sent first to avoid duplicates on retry
    await sb
      .from("users")
      .update({ promo_summer40_sent_at: now.toISOString() })
      .eq("id", user.id);

    const name = user.first_name ?? "there";
    let checkoutUrl: string;
    try {
      checkoutUrl = await getCartRecoveryUrl(sb, user.id);
    } catch {
      checkoutUrl = OFFER_URL;
    }

    const content = `
      <h1 style="margin:0 0 24px;font-size:26px;font-weight:400;color:${C.brand};line-height:1.25;letter-spacing:-0.02em;">
        Your Protocol — ${PROMO_DISCOUNT} off, ends Thursday.
      </h1>

      <p style="margin:0 0 16px;font-size:15px;color:${C.muted};line-height:1.65;">
        Hey ${name} — for the next 72 hours, you can access your personalized Attractiveness Protocol at ${PROMO_DISCOUNT} off.
      </p>

      <p style="margin:0 0 32px;font-size:15px;color:${C.muted};line-height:1.65;">
        The protocol runs a complete scientific analysis of your body — every proportion linked to perceived attractiveness — and builds a 12-week roadmap around it. Personalized to your face, frame, and context.
      </p>

      <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;background:#f0f4f5;border-radius:10px;padding:16px 20px;width:100%;">
        <tr>
          <td>
            <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:${C.subtle};letter-spacing:0.1em;text-transform:uppercase;">Your promo code</p>
            <p style="margin:0;font-size:22px;font-weight:700;color:${C.brand};letter-spacing:0.06em;">${PROMO_CODE}</p>
          </td>
          <td align="right" style="vertical-align:middle;">
            <p style="margin:0;font-size:13px;color:${C.subtle};text-decoration:line-through;">${ORIGINAL_PRICE}</p>
            <p style="margin:0;font-size:22px;font-weight:700;color:${C.brand};">${DISCOUNTED_PRICE}</p>
          </td>
        </tr>
      </table>

      <a href="${checkoutUrl}" style="display:inline-block;background:${C.brand};color:#ffffff;font-size:14px;font-weight:600;padding:14px 28px;border-radius:8px;text-decoration:none;letter-spacing:0.01em;">Get my Protocol — ${PROMO_DISCOUNT} off →</a>

      <p style="margin:24px 0 0;font-size:13px;color:${C.subtle};line-height:1.6;">
        One-time payment · 90-day money-back guarantee<br>
        Offer expires <strong>${EXPIRY_LABEL}</strong>.
      </p>
    `;

    try {
      await resend.emails.send({
        from: FROM,
        to: user.email,
        subject: `Your Protocol — ${PROMO_DISCOUNT} off, ends Thursday.`,
        html: emailShell(content),
      });
      sent++;
      console.log("[promo-blast] sent", { email: user.email });
    } catch (err) {
      failed++;
      console.error("[promo-blast] failed", { email: user.email, error: String(err) });
    }
  }

  console.log("[promo-blast] done", { sent, failed });
  return { statusCode: 200 };
});

export { handler };
