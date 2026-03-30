import Stripe from "stripe";

const STRIPE_API_VERSION: Stripe.LatestApiVersion = "2024-06-20";
const DEFAULT_CHECKOUT_AMOUNT = 1900;
const DEFAULT_CHECKOUT_CURRENCY = "usd";
const DEFAULT_PRODUCT_NAME = "Body Analysis + Body Transformation Protocol";
const DEFAULT_PRODUCT_DESCRIPTION =
  "Lifetime access to the complete body analysis, transformation protocol, and member resources.";

export function getStripeServerClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return null;
  }

  return new Stripe(secretKey, { apiVersion: STRIPE_API_VERSION });
}

export function getPublicSiteUrl(origin?: string | null) {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    origin;

  if (!configuredUrl) {
    return "http://localhost:3000";
  }

  return configuredUrl.replace(/\/$/, "");
}

export function getCheckoutLineItems(): Stripe.Checkout.SessionCreateParams.LineItem[] {
  const priceId = process.env.STRIPE_PRICE_ID?.trim();
  if (priceId) {
    return [
      {
        price: priceId,
        quantity: 1,
      },
    ];
  }

  return [
    {
      quantity: 1,
      price_data: {
        currency: DEFAULT_CHECKOUT_CURRENCY,
        unit_amount: DEFAULT_CHECKOUT_AMOUNT,
        product_data: {
          name: DEFAULT_PRODUCT_NAME,
          description: DEFAULT_PRODUCT_DESCRIPTION,
        },
      },
    },
  ];
}
