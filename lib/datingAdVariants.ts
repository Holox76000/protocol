// Per-ad H1 variants for /dating. When a visitor lands from a Meta ad,
// utm_content carries the ad_id — we look it up here and render a
// headline that matches the angle the ad promised. Congruence = higher
// conversion + lower "wait, this isn't what I clicked" bounce.
//
// Fallback (unknown ad_id or no utm_content) → the default variant.
// SSR always renders default; the swap happens in a useEffect after
// hydration. This keeps the SEO snapshot clean and avoids a layout
// shift on cached/direct visits.
//
// To add a new variant when a new ad ships:
//   1. Copy the ad_id from Meta Business Manager
//   2. Append an entry below with matching { headlineMain, headlineEm }
//   3. The em segment gets styled italic — keep it as the "closer" that
//      ties back to what we sell ("Without a photographer.")

export type DatingHeroVariant = {
  key: string;              // stable slug, used for GA4 event breakdown
  headlineMain: string;     // rendered plain
  headlineEm: string;       // rendered inside <em> (italic display span)
};

export const DEFAULT_DATING_HERO_VARIANT: DatingHeroVariant = {
  key: "default",
  headlineMain: "Photos that get you matches.",
  headlineEm: "Without a photographer.",
};

// ad_id (from Meta) → variant. Ad_ids match Meta's numeric ad IDs and are
// what our checkout flow already persists in utm_content.
const AD_ID_TO_VARIANT: Record<string, DatingHeroVariant> = {
  // "US | Broad | Remake Photos" — angle covered by the default headline
  "120249755223770660": DEFAULT_DATING_HERO_VARIANT,

  // "US | Broad | 5x Matches"
  "120249755208740660": {
    key: "5x-matches",
    headlineMain: "5x your dating app matches.",
    headlineEm: "Without a photographer.",
  },

  // "US | Broad | 3-Step Guide"
  "120249755151070660": {
    key: "3-step-guide",
    headlineMain: "Get more dates on Tinder, Hinge, Bumble.",
    headlineEm: "Without a photographer.",
  },

  // "US | Broad | Build Profile"
  "120249755138420660": {
    key: "build-profile",
    headlineMain: "Build a dating profile that gets matches.",
    headlineEm: "Without a photographer.",
  },

  // "US | Broad | Double 2026"
  "120249755215020660": {
    key: "double-2026",
    headlineMain: "Double your matches in 2026.",
    headlineEm: "Without a photographer.",
  },

  // "US | Broad | Beat Tinder Algorithm"
  "120249755164520660": {
    key: "beat-tinder-algo",
    headlineMain: "Beat the Tinder algorithm.",
    headlineEm: "Without a photographer.",
  },

  // "US | Broad | Hinge 2026"
  "120249755202030660": {
    key: "hinge-2026",
    headlineMain: "Beat the Hinge algorithm.",
    headlineEm: "Without a photographer.",
  },

  // "US | Broad | 16000 Swipes"
  "120249755145860660": {
    key: "16000-swipes",
    headlineMain: "Photos backed by 16,000 swipes of data.",
    headlineEm: "Without a photographer.",
  },

  // "US | Broad | 5 Mistakes"
  "120249755186670660": {
    key: "5-mistakes",
    headlineMain: "Fix the 5 photo mistakes killing your matches.",
    headlineEm: "Without a photographer.",
  },
};

// Returns the matched variant or the default. Never throws; safe to call
// with any value (undefined, empty string, unknown id).
export function getDatingHeroVariant(utmContent: string | null | undefined): DatingHeroVariant {
  if (!utmContent) return DEFAULT_DATING_HERO_VARIANT;
  return AD_ID_TO_VARIANT[utmContent] ?? DEFAULT_DATING_HERO_VARIANT;
}
