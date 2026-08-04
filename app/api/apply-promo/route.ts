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
    return NextResponse.json({ valid: false, error: "Invalid or expired promo code" });
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
    return NextResponse.json({ valid: false, error: "Invalid promo code" });
  }

  // Guard: only apply a promo to a PaymentIntent this app created for checkout
  // and that is not yet paid — prevents applying a discount to an arbitrary or
  // already-settled PaymentIntent (which the client should never control).
  let pi;
  try {
    pi = await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (err) {
    console.error("[apply-promo] retrieve failed", { error: String(err), paymentIntentId });
    return NextResponse.json({ valid: false, error: "Unable to apply code" }, { status: 404 });
  }
  const MODIFIABLE = new Set(["requires_payment_method", "requires_confirmation", "requires_action"]);
  if (pi.metadata?.source !== "app_checkout" || !MODIFIABLE.has(pi.status)) {
    return NextResponse.json({ valid: false, error: "Unable to apply code" }, { status: 403 });
  }

  // Preserve any rush-delivery surcharge already on the intent, so applying a
  // promo doesn't silently drop it.
  const rushCents = pi.metadata?.rush_delivery === "true" ? 2900 : 0;
  const newAmount = Math.max(100, BASE_AMOUNT - discountCents) + rushCents;

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
