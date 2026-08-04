import { NextResponse } from "next/server";
import { getStripeServerClient } from "../../../lib/stripe";

export const runtime = "nodejs";

const BASE_AMOUNT = 8900;
const RUSH_AMOUNT = 2900;
const MIN_AMOUNT = 100;

export async function POST(request: Request) {
  const stripe = getStripeServerClient();
  if (!stripe) return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });

  const body = (await request.json().catch(() => ({}))) as {
    paymentIntentId?: string;
    rush_delivery?: boolean;
  };

  const { paymentIntentId, rush_delivery = false } = body;

  if (!paymentIntentId || !/^pi_[a-zA-Z0-9]+$/.test(paymentIntentId)) {
    return NextResponse.json({ error: "Invalid paymentIntentId" }, { status: 400 });
  }

  // Retrieve the PaymentIntent server-side. The price is derived ENTIRELY from
  // server state — the client may only toggle rush delivery. Previously this
  // route trusted a client-supplied `discountedBase`, which let anyone pay
  // $0.50 for an $89 product (the webhook then granted access regardless of
  // amount). The base amount and any discount are now recomputed here.
  let pi;
  try {
    pi = await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (err) {
    console.error("[update-payment-intent] retrieve failed", { error: String(err) });
    return NextResponse.json({ error: "Payment intent not found" }, { status: 404 });
  }

  // Only ever mutate PaymentIntents this app created for checkout…
  if (pi.metadata?.source !== "app_checkout") {
    return NextResponse.json({ error: "Not modifiable" }, { status: 403 });
  }
  // …and never one that is already paid / processing / canceled.
  const MODIFIABLE = new Set(["requires_payment_method", "requires_confirmation", "requires_action"]);
  if (!MODIFIABLE.has(pi.status)) {
    return NextResponse.json({ error: "Payment intent not modifiable" }, { status: 409 });
  }

  // Re-validate any stored promo code against Stripe (source of truth), exactly
  // like /api/apply-promo does — never trust a client-sent discount.
  let discountCents = 0;
  const promoCode = pi.metadata?.promo_code;
  if (promoCode) {
    try {
      const promoCodes = await stripe.promotionCodes.list({ code: promoCode, active: true, limit: 1 });
      const coupon = promoCodes.data[0]?.coupon;
      if (coupon?.percent_off) discountCents = Math.round((BASE_AMOUNT * coupon.percent_off) / 100);
      else if (coupon?.amount_off) discountCents = coupon.amount_off;
    } catch (err) {
      console.error("[update-payment-intent] promo re-validation failed", { error: String(err), promoCode });
    }
  }

  const discountedBase = Math.max(MIN_AMOUNT, BASE_AMOUNT - discountCents);
  const newAmount = discountedBase + (rush_delivery ? RUSH_AMOUNT : 0);

  try {
    // Stripe merges metadata keys, so promo_code is preserved.
    await stripe.paymentIntents.update(paymentIntentId, {
      amount: newAmount,
      metadata: { rush_delivery: rush_delivery ? "true" : "false" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[update-payment-intent] Stripe error", { error: message });
    return NextResponse.json({ error: "Failed to update payment intent" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, newAmount });
}
