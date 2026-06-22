import { NextResponse } from "next/server";
import { getStripeServerClient, getPublicSiteUrl } from "../../../lib/stripe";
import { sendMetaEvent } from "../../../lib/metaCapi";
import { sendTiktokEvent } from "../../../lib/tiktokEventsApi";

export const runtime = "nodejs";

type Body = {
  customer_email?: string;
  funnel?: string;
  from?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  utm_id?: string;
  fbclid?: string;
  ttclid?: string;
  ga_client_id?: string;
};

export async function POST(request: Request) {
  const stripe = getStripeServerClient();
  if (!stripe) return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });

  const body = (await request.json().catch(() => ({}))) as Body;
  const email = (body.customer_email ?? "").trim().toLowerCase() || null;
  const funnel = body.funnel ?? "f1";
  const utmMetadata: Record<string, string> = {};
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "utm_id", "fbclid", "ttclid", "ga_client_id"] as const) {
    if (body[key]) utmMetadata[key] = body[key]!;
  }
  if (body.from) utmMetadata.from = body.from;

  // Capture customer signals here — the Stripe webhook can't see them later
  // (Stripe → us = server-to-server, headers are Stripe's). Stashing in
  // payment_intent.metadata so the Purchase event can use them for EMQ.
  const customerUserAgent = request.headers.get("user-agent")?.slice(0, 500);
  const customerIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const customerTtp = request.headers.get("cookie")?.match(/(?:^|;\s*)_ttp=([^;]+)/)?.[1];
  const customerSignalsMetadata: Record<string, string> = {};
  if (customerUserAgent) customerSignalsMetadata.customer_user_agent = customerUserAgent;
  if (customerIp) customerSignalsMetadata.customer_ip = customerIp;
  if (customerTtp) customerSignalsMetadata.customer_ttp = customerTtp;

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
      amount: 8900, // $89.00
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      ...(customerId && { customer: customerId }),
      metadata: {
        funnel,
        customer_email: email ?? "",
        source: "app_checkout",
        capi_purchase_source: "payment_intent",
        ...utmMetadata,
        ...customerSignalsMetadata,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[create-payment-intent] Stripe error", { error: message });
    return NextResponse.json({ error: "Failed to create payment intent" }, { status: 500 });
  }

  // CAPI InitiateCheckout — reuse the customer signals already captured above.
  const userAgent = customerUserAgent;
  const ipAddress = customerIp;
  const referer = request.headers.get("referer") ?? undefined;
  const ttp = customerTtp;
  const siteUrl = getPublicSiteUrl(request.headers.get("origin"));
  const eventTime = Math.floor(Date.now() / 1000);

  void sendMetaEvent({
    eventName: "InitiateCheckout",
    eventTime,
    eventId: paymentIntent.id,
    actionSource: "website",
    eventSourceUrl: referer ?? `${siteUrl}/dashboard`,
    userAgent,
    ipAddress,
    email,
    fbclid: body.fbclid || null,
    customData: {
      content_name: "Attractiveness Protocol",
      content_ids: ["f1-attractiveness-protocol"],
      value: 89,
      currency: "USD",
      num_items: 1,
    },
  }).catch((err) =>
    console.error("[create-payment-intent] CAPI failed", { error: String(err) })
  );

  void sendTiktokEvent({
    eventName: "InitiateCheckout",
    eventTime,
    eventId: paymentIntent.id,
    eventSourceUrl: referer ?? `${siteUrl}/dashboard`,
    userAgent,
    ipAddress,
    email,
    externalId: email,
    ttclid: body.ttclid || null,
    ttp,
    properties: {
      value: 89,
      currency: "USD",
      contents: [{
        content_id: "f1-attractiveness-protocol",
        content_type: "product",
        content_name: "Attractiveness Protocol",
      }],
    },
  }).catch((err) =>
    console.error("[create-payment-intent] TikTok Events API failed", { error: String(err) })
  );

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  });
}
