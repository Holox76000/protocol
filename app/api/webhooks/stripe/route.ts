import Stripe from "stripe";
import { NextResponse } from "next/server";
import { sendMetaEvent } from "../../../../lib/metaCapi";

export const runtime = "nodejs";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const stripe =
  stripeSecretKey && stripeSecretKey.length > 0
    ? new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" })
    : null;


export async function POST(request: Request) {
  if (!stripe || !stripeWebhookSecret) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  const payload = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, stripeWebhookSecret);
  } catch (error) {
    return NextResponse.json({ error: "Invalid Stripe signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    await sendMetaEvent({
      eventName: "Purchase",
      eventTime: session.created ?? Math.floor(Date.now() / 1000),
      eventId: session.id ?? `${event.id}`,
      actionSource: "other",
      email: session.customer_details?.email ?? null,
      customData: {
        value:
          typeof session.amount_total === "number"
            ? session.amount_total / 100
            : null,
        currency: session.currency ?? null
      }
    });
  }

  return NextResponse.json({ received: true });
}
