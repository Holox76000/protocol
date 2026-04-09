import type Stripe from "stripe";
import { NextResponse } from "next/server";
import { sendMetaEvent } from "../../../../lib/metaCapi";
import { getStripeServerClient } from "../../../../lib/stripe";

export const runtime = "nodejs";

const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripe = getStripeServerClient();

export async function POST(request: Request) {
  if (!stripe || !stripeWebhookSecret) {
    console.error("[webhook/stripe] Stripe not configured — missing secret key or webhook secret");
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
    console.error("[webhook/stripe] Invalid signature", { error: String(error) });
    return NextResponse.json({ error: "Invalid Stripe signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const meta = (session.metadata ?? {}) as Record<string, string>;

    console.log("[webhook/stripe] checkout.session.completed", {
      sessionId: session.id,
      amountTotal: session.amount_total,
      currency: session.currency,
      funnel: meta.funnel,
      utmSource: meta.utm_source,
      utmCampaign: meta.utm_campaign,
    });

    // ✅ Purchase fires via CAPI only — never client-side — to avoid double-counting
    // and bypass browser ad blockers. eventID = Stripe session ID for deduplication.
    try {
      await sendMetaEvent({
        eventName: "Purchase",
        eventTime: session.created ?? Math.floor(Date.now() / 1000),
        eventId: session.id,
        actionSource: "website",
        eventSourceUrl: "https://protocol-club.com/checkout",
        email: session.customer_details?.email ?? null,
        customData: {
          value: typeof session.amount_total === "number" ? session.amount_total / 100 : 49,
          currency: (session.currency ?? "usd").toUpperCase(),
          content_name: "Attractiveness Protocol",
          content_ids: ["f1-attractiveness-protocol"],
          content_type: "product",
          funnel: meta.funnel ?? null,
          funnel_type: meta.funnel_type ?? null,
          ...(meta.utm_source && { utm_source: meta.utm_source }),
          ...(meta.utm_medium && { utm_medium: meta.utm_medium }),
          ...(meta.utm_campaign && { utm_campaign: meta.utm_campaign }),
          ...(meta.utm_content && { utm_content: meta.utm_content }),
          ...(meta.utm_term && { utm_term: meta.utm_term }),
          ...(meta.fbclid && { fbclid: meta.fbclid }),
        },
      });
      console.log("[webhook/stripe] Purchase CAPI sent", { sessionId: session.id });
    } catch (err) {
      // Log but don't fail the webhook — Stripe retries on non-2xx responses
      console.error("[webhook/stripe] Purchase CAPI failed", {
        error: String(err),
        sessionId: session.id,
      });
    }
  }

  return NextResponse.json({ received: true });
}
