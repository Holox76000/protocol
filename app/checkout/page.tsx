import Link from "next/link";
import { headers } from "next/headers";
import { getCheckoutLineItems, getPublicSiteUrl, getStripeServerClient } from "../../lib/stripe";
import { sendMetaEvent } from "../../lib/metaCapi";
import CheckoutRedirect from "./checkout-redirect";

export const runtime = "nodejs";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams?: {
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
  };
}) {
  const rawFunnel = searchParams?.funnel?.trim() || "main";
  const KNOWN_FUNNELS = new Set(["main", "f2", "v3", "woman", "f1"]);
  const funnel = KNOWN_FUNNELS.has(rawFunnel) ? rawFunnel : "main";
  const internalFunnel = funnel === "v2" ? "f2" : funnel;
  const stripe = getStripeServerClient();

  if (!stripe) {
    return (
      <main className="min-h-screen bg-ash px-6 py-16 text-ink">
        <div className="mx-auto max-w-2xl rounded-[32px] border border-black/10 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ink/60">Stripe setup required</p>
          <h1 className="mt-4 font-display text-4xl">Checkout is almost ready</h1>
          <p className="mt-4 text-lg text-ink/70">
            Add <code>STRIPE_SECRET_KEY</code> and optionally <code>STRIPE_PRICE_ID</code> to enable the live checkout
            flow.
          </p>
          <p className="mt-3 text-sm text-ink/60">
            Without a price ID, the app will create a one-time Stripe checkout for $19 USD automatically.
          </p>
          <div className="mt-8">
            <Link
              href={`/?funnel=${encodeURIComponent(funnel)}`}
              className="inline-flex items-center justify-center rounded-full border border-black bg-black px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-white hover:text-black"
            >
              Back to landing page
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const origin = headers().get("origin");
  const siteUrl = getPublicSiteUrl(origin);

  // Collect UTM params and attribution data from the request URL
  const utmSource = searchParams?.utm_source ?? null;
  const utmMedium = searchParams?.utm_medium ?? null;
  const utmCampaign = searchParams?.utm_campaign ?? null;
  const utmContent = searchParams?.utm_content ?? null;
  const utmTerm = searchParams?.utm_term ?? null;
  const utmId = searchParams?.utm_id ?? null;
  const fbclid = searchParams?.fbclid ?? null;
  const funnelType = searchParams?.funnel_type ?? "long";
  const landingPage = searchParams?.landing_page ?? (funnel === "f1" ? "/f1" : "/");
  const customerEmail = searchParams?.customer_email ?? null;

  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      billing_address_collection: "auto",
      allow_promotion_codes: true,
      line_items: getCheckoutLineItems(internalFunnel),
      // Pre-fill customer email so Stripe can send recovery emails on abandonment
      ...(customerEmail && { customer_email: customerEmail }),
      // Always create a customer record so Stripe recovery emails work
      customer_creation: "always",
      // Enable Stripe's built-in checkout recovery for expired sessions
      after_expiration: {
        recovery: {
          enabled: true,
          allow_promotion_codes: false,
        },
      },
      // 30-minute window — enough for any normal checkout flow
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&funnel=${encodeURIComponent(funnel)}`,
      cancel_url: `${siteUrl}/checkout/cancel?funnel=${encodeURIComponent(funnel)}`,
      metadata: {
        funnel: internalFunnel,
        funnel_type: funnelType,
        source: "app_checkout",
        landing_page: landingPage,
        ...(utmSource && { utm_source: utmSource }),
        ...(utmMedium && { utm_medium: utmMedium }),
        ...(utmCampaign && { utm_campaign: utmCampaign }),
        ...(utmContent && { utm_content: utmContent }),
        ...(utmTerm && { utm_term: utmTerm }),
        ...(utmId && { utm_id: utmId }),
        ...(fbclid && { fbclid: fbclid }),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[checkout] Stripe session creation failed", {
      error: message,
      funnel,
      utmSource,
      utmCampaign,
      timestamp: new Date().toISOString(),
    });

    return (
      <main className="min-h-screen bg-ash px-6 py-16 text-ink">
        <div className="mx-auto max-w-2xl rounded-[32px] border border-black/10 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-500">Payment error</p>
          <h1 className="mt-4 font-display text-4xl">Something went wrong</h1>
          <p className="mt-4 text-lg text-ink/70">
            We couldn&apos;t start your checkout. This is a temporary issue on our end — your card was not charged.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/checkout?funnel=${encodeURIComponent(funnel)}`}
              className="inline-flex items-center justify-center rounded-full border border-black bg-black px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-white hover:text-black"
            >
              Try again
            </Link>
            <Link
              href={funnel === "f1" ? "/f1/offer" : "/"}
              className="inline-flex items-center justify-center rounded-full border border-black/20 px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-ink/70 transition hover:border-black hover:text-ink"
            >
              Back to offer
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ✅ InitiateCheckout CAPI — fires server-side after Stripe session is created.
  // Same session.id is used as eventID in the client-side pixel (CheckoutRedirect)
  // so Meta can deduplicate the two signals.
  const userAgent = headers().get("user-agent") ?? undefined;
  const ipAddress = headers().get("x-forwarded-for")?.split(",")[0]?.trim();
  const referer = headers().get("referer") ?? undefined;
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
      ...(utmSource && { utm_source: utmSource }),
      ...(utmCampaign && { utm_campaign: utmCampaign }),
      ...(utmContent && { utm_content: utmContent }),
    },
  }).catch((err) => {
    console.error("[checkout] InitiateCheckout CAPI failed", { error: String(err), sessionId: session.id });
  });

  if (!session.url) {
    console.error("[checkout] Stripe session created but no URL returned", {
      sessionId: session.id,
      funnel,
      timestamp: new Date().toISOString(),
    });
    return (
      <main className="min-h-screen bg-ash px-6 py-16 text-ink">
        <div className="mx-auto max-w-2xl rounded-[32px] border border-black/10 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-500">Payment error</p>
          <h1 className="mt-4 font-display text-4xl">Something went wrong</h1>
          <p className="mt-4 text-lg text-ink/70">
            We couldn&apos;t redirect you to checkout. Please try again — your card was not charged.
          </p>
          <div className="mt-8">
            <Link
              href={`/checkout?funnel=${encodeURIComponent(funnel)}`}
              className="inline-flex items-center justify-center rounded-full border border-black bg-black px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-white hover:text-black"
            >
              Try again
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return <CheckoutRedirect redirectUrl={session.url} funnel={funnel} sessionId={session.id} />;
}
