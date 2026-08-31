import Stripe from "stripe";
import { getExperiment, getExperimentPlan } from "./experiments";

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
    return "https://protocol-club.com";
  }

  return configuredUrl.replace(/\/$/, "");
}

export function getCheckoutLineItems(funnel = "main", planKey?: string | null): Stripe.Checkout.SessionCreateParams.LineItem[] {
  if (funnel === "f1") {
    const f1PriceId = process.env.STRIPE_F1_PRICE_ID?.trim();
    if (f1PriceId) {
      return [{ price: f1PriceId, quantity: 1 }];
    }
    return [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: 8900,
          product_data: {
            name: "Attractiveness Protocol — 3-Month Program",
            description: "AI body analysis, personalized 3-month attractiveness protocol, and expert access for 3 months.",
          },
        },
      },
    ];
  }

  if (funnel === "dating") {
    const datingPriceId = process.env.STRIPE_DATING_PRICE_ID?.trim();
    if (datingPriceId) {
      return [{ price: datingPriceId, quantity: 1 }];
    }
    return [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: 3900,
          product_data: {
            name: "Protocol Dating — AI Dating Photos",
            description: "30 AI-generated dating profile photos, 5 styles, 24h delivery.",
          },
        },
      },
    ];
  }

  const experiment = getExperiment(funnel);
  if (experiment) {
    const plan = getExperimentPlan(experiment, planKey);
    return [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: plan.priceCents,
          // One-time plans carry no `interval` — omitting `recurring` is what
          // makes Stripe treat the line item as a single charge.
          ...(experiment.billing === "subscription" && plan.interval && {
            recurring: { interval: plan.interval },
          }),
          product_data: {
            name: experiment.productName,
            description: experiment.productDescription,
          },
        },
      },
    ];
  }

  const priceId = process.env.STRIPE_PRICE_ID?.trim();
  if (priceId) {
    return [{ price: priceId, quantity: 1 }];
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
