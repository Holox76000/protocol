import { NextResponse } from "next/server";
import { getStripeServerClient, getPublicSiteUrl } from "../../../lib/stripe";
import { sendMetaEvent } from "../../../lib/metaCapi";

export const runtime = "nodejs";

type Body = {
  customer_email?: string;
  funnel?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  utm_id?: string;
  fbclid?: string;
};

export async function POST(request: Request) {
  const stripe = getStripeServerClient();
  if (!stripe) return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });

  const body = (await request.json().catch(() => ({}))) as Body;
  const email = (body.customer_email ?? "").trim().toLowerCase() || null;
  const funnel = body.funnel ?? "f1";
  const utmMetadata: Record<string, string> = {};
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "utm_id", "fbclid"] as const) {
    if (body[key]) utmMetadata[key] = body[key]!;
  }

  // Find or create Stripe customer so the payment is linked to them
  let customerId: string | undefined;
  if (email) {
    try {
      const existing = await stripe.customers.list({ email, limit: 1 });
      if (existing.data.length > 0) {
        customerId = existing.data[0].id;
      } else {
        const customer = await stripe.customers.create({ email });
        customerId = customer.id;
      }
    } catch (err) {
      console.error("[create-payment-intent] Customer lookup failed", { error: String(err) });
    }
  }

  let paymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.create({
      amount: 4900, // $49.00
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      ...(customerId && { customer: customerId }),
      metadata: {
        funnel,
        customer_email: email ?? "",
        source: "app_checkout",
        ...utmMetadata,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[create-payment-intent] Stripe error", { error: message });
    return NextResponse.json({ error: "Failed to create payment intent" }, { status: 500 });
  }

  // CAPI InitiateCheckout
  const userAgent = request.headers.get("user-agent") ?? undefined;
  const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const referer = request.headers.get("referer") ?? undefined;
  const siteUrl = getPublicSiteUrl(request.headers.get("origin"));

  void sendMetaEvent({
    eventName: "InitiateCheckout",
    eventTime: Math.floor(Date.now() / 1000),
    eventId: paymentIntent.id,
    actionSource: "website",
    eventSourceUrl: referer ?? `${siteUrl}/dashboard`,
    userAgent,
    ipAddress,
    email,
    customData: {
      content_name: "Attractiveness Protocol",
      content_ids: ["f1-attractiveness-protocol"],
      value: 49,
      currency: "USD",
      num_items: 1,
    },
  }).catch((err) =>
    console.error("[create-payment-intent] CAPI failed", { error: String(err) })
  );

  return NextResponse.json({ clientSecret: paymentIntent.client_secret });
}
