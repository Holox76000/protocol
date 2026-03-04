import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createHash } from "crypto";

export const runtime = "nodejs";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const metaAccessToken = process.env.META_ACCESS_TOKEN;
const metaPixelId = process.env.META_PIXEL_ID;

const stripe =
  stripeSecretKey && stripeSecretKey.length > 0
    ? new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" })
    : null;

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

async function sendMetaPurchase(params: {
  eventId: string;
  eventTime: number;
  value?: number | null;
  currency?: string | null;
  email?: string | null;
}) {
  if (!metaAccessToken || !metaPixelId) return;

  const userData: Record<string, string> = {};
  if (params.email) {
    const normalizedEmail = params.email.trim().toLowerCase();
    userData.em = sha256(normalizedEmail);
  }

  const body = {
    data: [
      {
        event_name: "Purchase",
        event_time: params.eventTime,
        event_id: params.eventId,
        action_source: "other",
        user_data: userData,
        custom_data: {
          value: params.value ?? undefined,
          currency: params.currency ?? undefined
        }
      }
    ]
  };

  await fetch(`https://graph.facebook.com/v18.0/${metaPixelId}/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

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

    await sendMetaPurchase({
      eventId: session.id ?? `${event.id}`,
      eventTime: session.created ?? Math.floor(Date.now() / 1000),
      value:
        typeof session.amount_total === "number"
          ? session.amount_total / 100
          : null,
      currency: session.currency ?? null,
      email: session.customer_details?.email ?? null
    });
  }

  return NextResponse.json({ received: true });
}
