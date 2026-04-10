import { NextResponse } from "next/server";
import { getCheckoutLineItems, getPublicSiteUrl, getStripeServerClient } from "../../../lib/stripe";
import { sendMetaEvent } from "../../../lib/metaCapi";

export const runtime = "nodejs";

const KNOWN_FUNNELS = new Set(["main", "f2", "v3", "woman", "f1"]);

type Body = {
  funnel?: string;
  funnel_type?: string;
  customer_email?: string;
  landing_page?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  utm_id?: string;
  fbclid?: string;
  embedded?: boolean;
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

  const sharedMetadata = {
    funnel: internalFunnel,
    funnel_type: funnelType,
    source: "app_checkout",
    landing_page: landingPage,
    ...(body.utm_source && { utm_source: body.utm_source }),
    ...(body.utm_medium && { utm_medium: body.utm_medium }),
    ...(body.utm_campaign && { utm_campaign: body.utm_campaign }),
    ...(body.utm_content && { utm_content: body.utm_content }),
    ...(body.utm_term && { utm_term: body.utm_term }),
    ...(body.utm_id && { utm_id: body.utm_id }),
    ...(body.fbclid && { fbclid: body.fbclid }),
  };

  let session;
  try {
    if (embedded) {
      session = await stripe.checkout.sessions.create({
        mode: "payment",
        ui_mode: "embedded",
        billing_address_collection: "auto",
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
  // so Meta can deduplicate the two signals.
  const userAgent = request.headers.get("user-agent") ?? undefined;
  const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const referer = request.headers.get("referer") ?? undefined;

  void sendMetaEvent({
    eventName: "InitiateCheckout",
    eventTime: Math.floor(Date.now() / 1000),
    eventId: session.id,
    actionSource: "website",
    eventSourceUrl: referer ?? `${siteUrl}/checkout`,
    userAgent,
    ipAddress,
    email: customerEmail,
    customData: {
      content_name: "Attractiveness Protocol",
      content_ids: ["f1-attractiveness-protocol"],
      value: 49,
      currency: "USD",
      num_items: 1,
      ...(body.utm_source && { utm_source: body.utm_source }),
      ...(body.utm_campaign && { utm_campaign: body.utm_campaign }),
      ...(body.utm_content && { utm_content: body.utm_content }),
    },
  }).catch((err) => {
    console.error("[create-checkout-session] CAPI failed", { error: String(err), sessionId: session.id });
  });

  if (embedded) {
    return NextResponse.json({ clientSecret: session.client_secret, sessionId: session.id });
  }
  return NextResponse.json({ url: session.url, sessionId: session.id });
}
