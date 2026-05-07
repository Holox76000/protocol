import { NextResponse } from "next/server";
import { getStripeServerClient } from "../../../lib/stripe";

export const runtime = "nodejs";

const BASE_AMOUNT = 8900;
const RUSH_AMOUNT = 2900;

export async function POST(request: Request) {
  const stripe = getStripeServerClient();
  if (!stripe) return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });

  const body = (await request.json().catch(() => ({}))) as {
    paymentIntentId?: string;
    rush_delivery?: boolean;
    discountedBase?: number; // base amount after any promo, in cents
  };

  const { paymentIntentId, rush_delivery = false, discountedBase } = body;

  if (!paymentIntentId || !/^pi_[a-zA-Z0-9]+$/.test(paymentIntentId)) {
    return NextResponse.json({ error: "Invalid paymentIntentId" }, { status: 400 });
  }

  const base = typeof discountedBase === "number" ? discountedBase : BASE_AMOUNT;
  const newAmount = base + (rush_delivery ? RUSH_AMOUNT : 0);

  try {
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
