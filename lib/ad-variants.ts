export type AdVariant = {
  badge?: string;
  headline: string;
  subtext: string;
  cta?: string;
};

export const DEFAULT_VARIANT: AdVariant = {
  badge: "Attractiveness Diagnostic",
  headline: "Find out exactly where you stand.",
  subtext:
    "A 3-minute science-based assessment that maps your appearance across 18 data points — and tells you what to fix first.",
  cta: "Start the assessment →",
};

// Ad name → IDs (multiple IDs per name = same creative in different ad sets)
// Fill in headline/subtext/badge once you share the images.

export const AD_VARIANTS: Record<string, AdVariant> = {
  // ── Static 1 ──────────────────────────────────────────────────────────────
  "120241594466430290": { ...DEFAULT_VARIANT },
  "120239953321010290": { ...DEFAULT_VARIANT },

  // ── Static 2 ──────────────────────────────────────────────────────────────
  "120241594466380290": { ...DEFAULT_VARIANT },
  "120239970314040290": { ...DEFAULT_VARIANT },

  // ── Static 3 ──────────────────────────────────────────────────────────────
  "120241594466370290": { ...DEFAULT_VARIANT },
  "120239970342220290": { ...DEFAULT_VARIANT },

  // ── Static 4 ──────────────────────────────────────────────────────────────
  "120241594466440290": { ...DEFAULT_VARIANT },
  "120239970350460290": { ...DEFAULT_VARIANT },

  // ── Static 5 ──────────────────────────────────────────────────────────────
  "120241594466390290": { ...DEFAULT_VARIANT },
  "120239970353770290": { ...DEFAULT_VARIANT },

  // ── Static 6 ──────────────────────────────────────────────────────────────
  "120241594466420290": { ...DEFAULT_VARIANT },
  "120239970357070290": { ...DEFAULT_VARIANT },

  // ── Static 7 ──────────────────────────────────────────────────────────────
  "120241594466410290": { ...DEFAULT_VARIANT },
  "120239970360490290": { ...DEFAULT_VARIANT },

  // ── Vidéo Alex - 1 ────────────────────────────────────────────────────────
  "120241546214050290": { ...DEFAULT_VARIANT },
  "120241594399340290": { ...DEFAULT_VARIANT },

  // ── Vidéo Alex - 2 ────────────────────────────────────────────────────────
  "120241546214040290": { ...DEFAULT_VARIANT },
  "120241594399320290": { ...DEFAULT_VARIANT },

  // ── Vidéo Bavesh - 1 ──────────────────────────────────────────────────────
  "120241594399310290": { ...DEFAULT_VARIANT },
  "120241546574590290": { ...DEFAULT_VARIANT },

  // ── Vidéo 1 ───────────────────────────────────────────────────────────────
  "120239970434830290": { ...DEFAULT_VARIANT },
  "120241594399330290": { ...DEFAULT_VARIANT },

  // ── Vidéo 2 ───────────────────────────────────────────────────────────────
  "120239970479110290": { ...DEFAULT_VARIANT },
  "120241594399350290": { ...DEFAULT_VARIANT },
};

export function getAdVariant(adId: string | undefined): AdVariant {
  if (!adId) return DEFAULT_VARIANT;
  return AD_VARIANTS[adId] ?? DEFAULT_VARIANT;
}
