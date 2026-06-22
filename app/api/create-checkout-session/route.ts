import { NextResponse } from "next/server";
import { getCheckoutLineItems, getPublicSiteUrl, getStripeServerClient } from "../../../lib/stripe";
import { sendMetaEvent } from "../../../lib/metaCapi";
import { sendTiktokEvent } from "../../../lib/tiktokEventsApi";

export const runtime = "nodejs";

const KNOWN_FUNNELS = new Set(["main", "f2", "v3", "woman", "f1"]);

type Body = {
  funnel?: string;
  funnel_type?: string;
  from?: string;
  customer_email?: string;
  landing_page?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  utm_id?: string;
  fbclid?: string;
  ttclid?: string;
  embedded?: boolean;
  ga_client_id?: string;
};

export async function POST(request: Request) {
  const stripe = getStripeServerClient();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as Body;

  const rawFunnel = body.funnel?.trim() || "main";
  const funnel = KNOWN_FUNNELS.has(rawFunnel) ? rawFunnel : "main";
  const internalFunnel = funnel === "v2" ? "f2" : funnel;
  const funnelType = body.funnel_type ?? "long";
  const landingPage = body.landing_page ?? (funnel === "f1" ? "/f1" : "/");
  const customerEmail = body.customer_email ?? null;
  const embedded = body.embedded === true;

  const origin = request.headers.get("origin");
  const siteUrl = getPublicSiteUrl(origin);

  // Capture customer signals here — the Stripe webhook is server-to-server,
  // so we stash these in session.metadata to lift Purchase EMQ later.
  const customerUserAgent = request.headers.get("user-agent")?.slice(0, 500);
  const customerIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const customerTtp = request.headers.get("cookie")?.match(/(?:^|;\s*)_ttp=([^;]+)/)?.[1];

  const sharedMetadata = {
    funnel: internalFunnel,
    funnel_type: funnelType,
    source: "app_checkout",
    capi_purchase_source: "checkout_session",
    landing_page: landingPage,
    ...(body.utm_source && { utm_source: body.utm_source }),
    ...(body.utm_medium && { utm_medium: body.utm_medium }),
    ...(body.utm_campaign && { utm_campaign: body.utm_campaign }),
    ...(body.utm_content && { utm_content: body.utm_content }),
    ...(body.utm_term && { utm_term: body.utm_term }),
    ...(body.utm_id && { utm_id: body.utm_id }),
    ...(body.fbclid && { fbclid: body.fbclid }),
    ...(body.ttclid && { ttclid: body.ttclid }),
    ...(body.ga_client_id && { ga_client_id: body.ga_client_id }),
    ...(body.from && { from: body.from }),
    ...(customerUserAgent && { customer_user_agent: customerUserAgent }),
    ...(customerIp && { customer_ip: customerIp }),
    ...(customerTtp && { customer_ttp: customerTtp }),
  };

  let session;
  try {
    if (embedded) {
      session = await stripe.checkout.sessions.create({
        mode: "payment",
        ui_mode: "embedded",
        billing_address_collection: "auto",
        phone_number_collection: { enabled: true },
        allow_promotion_codes: true,
        line_items: getCheckoutLineItems(internalFunnel),
        ...(customerEmail && { customer_email: customerEmail }),
        customer_creation: "always",
        return_url: `${siteUrl}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        metadata: sharedMetadata,
      });
    } else {
      session = await stripe.checkout.sessions.create({
        mode: "payment",
        billing_address_collection: "auto",
        phone_number_collection: { enabled: true },
        allow_promotion_codes: true,
        line_items: getCheckoutLineItems(internalFunnel),
        ...(customerEmail && { customer_email: customerEmail }),
        customer_creation: "always",
        after_expiration: {
          recovery: { enabled: true, allow_promotion_codes: false },
        },
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
        success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&funnel=${encodeURIComponent(funnel)}`,
        cancel_url: `${siteUrl}/checkout/cancel?funnel=${encodeURIComponent(funnel)}`,
        metadata: sharedMetadata,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[create-checkout-session] Stripe error", {
      error: message,
      funnel,
      utmSource: body.utm_source,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }

  if (embedded) {
    if (!session.client_secret) {
      console.error("[create-checkout-session] No client_secret returned", { sessionId: session.id });
      return NextResponse.json({ error: "Failed to initialize checkout" }, { status: 500 });
    }
  } else if (!session.url) {
    console.error("[create-checkout-session] No URL returned", { sessionId: session.id, funnel });
    return NextResponse.json({ error: "No checkout URL returned" }, { status: 500 });
  }

  // ✅ CAPI InitiateCheckout — fires exactly once, here in the API route.
  // The client will fire fbq('track', 'InitiateCheckout') with the same session.id
  // so Meta can deduplicate the two signals. Reuse the customer signals already
  // captured above (stashed in metadata for the Purchase webhook downstream).
  const userAgent = customerUserAgent;
  const ipAddress = customerIp;
  const referer = request.headers.get("referer") ?? undefined;
  const ttp = customerTtp;
  const eventTime = Math.floor(Date.now() / 1000);

  void sendMetaEvent({
    eventName: "InitiateCheckout",
    eventTime,
    eventId: session.id,
    actionSource: "website",
    eventSourceUrl: referer ?? `${siteUrl}/checkout`,
    userAgent,
    ipAddress,
    email: customerEmail,
    fbclid: body.fbclid || null,
    customData: {
      content_name: "Attractiveness Protocol",
      content_ids: ["f1-attractiveness-protocol"],
      value: 89,
      currency: "USD",
      num_items: 1,
      ...(body.utm_source && { utm_source: body.utm_source }),
      ...(body.utm_campaign && { utm_campaign: body.utm_campaign }),
      ...(body.utm_content && { utm_content: body.utm_content }),
    },
  }).catch((err) => {
    console.error("[create-checkout-session] CAPI failed", { error: String(err), sessionId: session.id });
  });

  void sendTiktokEvent({
    eventName: "InitiateCheckout",
    eventTime,
    eventId: session.id,
    eventSourceUrl: referer ?? `${siteUrl}/checkout`,
    userAgent,
    ipAddress,
    email: customerEmail,
    externalId: customerEmail,
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
  }).catch((err) => {
    console.error("[create-checkout-session] TikTok Events API failed", { error: String(err), sessionId: session.id });
  });

  if (embedded) {
    return NextResponse.json({ clientSecret: session.client_secret, sessionId: session.id });
  }
  return NextResponse.json({ url: session.url, sessionId: session.id });
}
