import { NextResponse } from "next/server";
import { getStripeServerClient } from "../../../lib/stripe";

export const runtime = "nodejs";

const BASE_AMOUNT = 8900; // $89.00 in cents

export async function POST(request: Request) {
  const stripe = getStripeServerClient();
  if (!stripe) return NextResponse.json({ valid: false, error: "Not configured" }, { status: 503 });

  let code: string | undefined;
  let paymentIntentId: string | undefined;
  try {
    ({ code, paymentIntentId } = await request.json());
  } catch {
    return NextResponse.json({ valid: false, error: "Invalid request" }, { status: 400 });
  }

  if (!code || !paymentIntentId) {
    return NextResponse.json({ valid: false, error: "Missing parameters" }, { status: 400 });
  }

  // Look up active promotion code (case-insensitive via Stripe)
  let promoCodes;
  try {
    promoCodes = await stripe.promotionCodes.list({
      code: code.trim().toUpperCase(),
      active: true,
      limit: 1,
    });
  } catch (err) {
    console.error("[apply-promo] Stripe lookup failed", { error: String(err) });
    return NextResponse.json({ valid: false, error: "Unable to validate code" }, { status: 500 });
  }

  if (promoCodes.data.length === 0) {
    return NextResponse.json({ valid: false, error: "Code invalide ou expiré" });
  }

  const coupon = promoCodes.data[0].coupon;

  let discountCents = 0;
  let discountLabel = "";

  if (coupon.percent_off) {
    discountCents = Math.round(BASE_AMOUNT * coupon.percent_off / 100);
    discountLabel = `-${coupon.percent_off}%`;
  } else if (coupon.amount_off) {
    discountCents = coupon.amount_off;
    discountLabel = `-$${(coupon.amount_off / 100).toFixed(2)}`;
  } else {
    return NextResponse.json({ valid: false, error: "Code invalide" });
  }

  const newAmount = Math.max(100, BASE_AMOUNT - discountCents);

  try {
    await stripe.paymentIntents.update(paymentIntentId, {
      amount: newAmount,
      metadata: { promo_code: code.trim().toUpperCase() },
    });
  } catch (err) {
    console.error("[apply-promo] PaymentIntent update failed", { error: String(err), paymentIntentId });
    return NextResponse.json({ valid: false, error: "Unable to apply code" }, { status: 500 });
  }

  return NextResponse.json({
    valid: true,
    discountLabel,
    newAmount,
    originalAmount: BASE_AMOUNT,
  });
}
