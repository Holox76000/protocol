import Link from "next/link";
import { headers } from "next/headers";
import { getCheckoutLineItems, getPublicSiteUrl, getStripeServerClient } from "../../lib/stripe";
import CheckoutRedirect from "./checkout-redirect";

export const runtime = "nodejs";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams?: { funnel?: string };
}) {
  const funnel = searchParams?.funnel?.trim() || "main";
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
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    billing_address_collection: "auto",
    allow_promotion_codes: true,
    line_items: getCheckoutLineItems(),
    success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&funnel=${encodeURIComponent(funnel)}`,
    cancel_url: `${siteUrl}/checkout/cancel?funnel=${encodeURIComponent(funnel)}`,
    metadata: {
      funnel: internalFunnel,
      source: "app_checkout",
    },
  });

  if (!session.url) {
    throw new Error("Stripe checkout session did not return a redirect URL.");
  }

  return <CheckoutRedirect redirectUrl={session.url} funnel={funnel} />;
}
