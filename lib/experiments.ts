// Registry of "experiment" verticals — fast painted-door tests of new
// business ideas, cloned from the /dating landing format.
//
// One entry here + one route folder under app/<slug>/ = a fully wired test:
// Stripe line items, checkout success/cancel URLs, the webhook confirmation
// email, and Meta/TikTok/GA4 product data all read from this registry, so
// adding an idea never touches the per-funnel branches again.
//
// Must stay client-safe (imported by lib/analytics.ts): no server-only deps.

export type ExperimentPlan = {
  /** Stable key sent from the client and matched server-side. */
  key: string;
  /** Selector label, e.g. "Weekly". */
  label: string;
  priceCents: number;
  /** Billing interval (subscription verticals only). */
  interval: "week" | "month" | "year";
  /** Headline price, e.g. "$8.99". */
  priceLabel: string;
  /** Interval suffix, e.g. "/week". */
  perLabel: string;
  /** Optional secondary line, e.g. "just $2.92/mo, billed yearly". */
  subLabel?: string;
  /** Optional strike-through anchor price, e.g. "$14.99". */
  wasLabel?: string;
  /** Optional badge, e.g. "Most popular". */
  badge?: string;
  /** Free-trial length in days (subscription only). Adds a Stripe trial and
   *  flips the copy to "Start N-day free trial" for this plan. */
  trialDays?: number;
};

export type Experiment = {
  /** Route slug — the landing lives at /<slug> and `funnel` metadata uses it. */
  slug: string;
  /** Customer-facing brand, e.g. "Protocol Abs". */
  brand: string;
  /** Product name shown in Stripe Checkout and sent to Meta/TikTok CAPI. */
  productName: string;
  /** Stripe Checkout line-item description. */
  productDescription: string;
  /** Meta/TikTok content_id. */
  contentId: string;
  /** One-time charge or recurring subscription (drives Stripe Checkout mode). */
  billing: "one_time" | "subscription";
  /** Price tiers offered on the paywall. First-listed is the anchor order. */
  plans: ExperimentPlan[];
  /** Which plan is preselected / used for view-time CAPI value. */
  defaultPlanKey: string;
  /** Delivery window quoted in the confirmation email ("within 48 hours"). */
  deliveryPromise: string;
};

export const EXPERIMENTS: Record<string, Experiment> = {
  abs: {
    slug: "abs",
    brand: "Protocol Abs",
    productName: "Protocol Abs — AI Abs Analysis + Adaptive Plan",
    productDescription:
      "Abs Score, zone-by-zone breakdown, body-fat estimate, your #1 blocker, a plan that adapts weekly, and a monthly re-scan. Cancel anytime.",
    contentId: "abs-analysis-plan",
    billing: "subscription",
    plans: [
      {
        key: "weekly",
        label: "Weekly",
        priceCents: 899,
        interval: "week",
        priceLabel: "$8.99",
        perLabel: "/week",
      },
      {
        key: "monthly",
        label: "Monthly",
        priceCents: 1199,
        interval: "month",
        priceLabel: "$11.99",
        perLabel: "/month",
        badge: "Most popular",
      },
      {
        key: "yearly",
        label: "Yearly",
        priceCents: 3499,
        interval: "year",
        priceLabel: "$34.99",
        perLabel: "/year",
        subLabel: "just $2.92/mo, billed yearly",
        badge: "Best value",
      },
    ],
    defaultPlanKey: "monthly",
    deliveryPromise: "within 48 hours",
  },

  bluffai: {
    slug: "bluffai",
    brand: "Bluff AI",
    productName: "Bluff AI — AI Prank Photo Editor",
    productDescription:
      "Pick a template, upload one photo, get a result that looks real. Fake tattoos, fake couples, bald, aged, and more. New credits every week. Cancel anytime.",
    contentId: "bluff-prank-photo",
    billing: "subscription",
    // Mirrors Bluff AI's real paywall: weekly with a 3-day free trial + a
    // yearly anchor, no monthly tier. Weekly price is a sector benchmark —
    // their exact numbers are served per-market and A/B tested.
    plans: [
      {
        key: "weekly",
        label: "Weekly",
        priceCents: 699,
        interval: "week",
        priceLabel: "$6.99",
        perLabel: "/week",
        subLabel: "3 days free, then $6.99/week",
        badge: "3-day free trial",
        trialDays: 3,
      },
      {
        key: "yearly",
        label: "Yearly",
        priceCents: 3999,
        interval: "year",
        priceLabel: "$39.99",
        perLabel: "/year",
        subLabel: "just $0.77/week, billed yearly",
        badge: "Best value",
      },
    ],
    defaultPlanKey: "weekly",
    deliveryPromise: "within minutes",
  },

  nose: {
    slug: "nose",
    brand: "NoseLab",
    productName: "NoseLab — AI Rhinoplasty Preview",
    productDescription:
      "See your nose reshaped before you book surgery. Photoreal previews — hump removed, tip refined, bridge smoothed — with a surgeon-ready export. Cancel anytime.",
    contentId: "nose-rhinoplasty-preview",
    billing: "subscription",
    // Mirrors Nosefix (the niche leader): weekly + annual, no monthly.
    plans: [
      {
        key: "weekly",
        label: "Weekly",
        priceCents: 299,
        interval: "week",
        priceLabel: "$2.99",
        perLabel: "/week",
        badge: "Most popular",
      },
      {
        key: "yearly",
        label: "Yearly",
        priceCents: 1799,
        interval: "year",
        priceLabel: "$17.99",
        perLabel: "/year",
        subLabel: "just $0.35/week, billed yearly",
        badge: "Best value",
      },
    ],
    defaultPlanKey: "weekly",
    deliveryPromise: "within 24 hours",
  },

  jewelry: {
    slug: "jewelry",
    brand: "GemCheck",
    productName: "GemCheck — AI Jewelry Identifier & Value",
    productDescription:
      "Snap a photo, get an identification and value estimate: materials, gemstones, era, hallmarks, and a fair-market range. Catalog your whole box. Cancel anytime.",
    contentId: "jewelry-appraisal",
    billing: "subscription",
    // Mirrors the iOS jewelry-scan competitors: weekly + annual, no monthly.
    plans: [
      {
        key: "weekly",
        label: "Weekly",
        priceCents: 499,
        interval: "week",
        priceLabel: "$4.99",
        perLabel: "/week",
        badge: "Most popular",
      },
      {
        key: "yearly",
        label: "Yearly",
        priceCents: 3499,
        interval: "year",
        priceLabel: "$34.99",
        perLabel: "/year",
        subLabel: "just $0.67/week, billed yearly",
        badge: "Best value",
      },
    ],
    defaultPlanKey: "weekly",
    deliveryPromise: "within 24 hours",
  },
};

export const EXPERIMENT_SLUGS = Object.keys(EXPERIMENTS);

export function getExperiment(funnel: string | null | undefined): Experiment | null {
  if (!funnel) return null;
  return EXPERIMENTS[funnel] ?? null;
}

/** Resolve a plan by key, falling back to the experiment's default. */
export function getExperimentPlan(
  experiment: Experiment,
  planKey?: string | null
): ExperimentPlan {
  const byKey = planKey ? experiment.plans.find((p) => p.key === planKey) : undefined;
  return (
    byKey ??
    experiment.plans.find((p) => p.key === experiment.defaultPlanKey) ??
    experiment.plans[0]
  );
}
