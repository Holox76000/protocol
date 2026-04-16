import type { CalibrationMetrics } from "../app/admin/orders/[userId]/PhotoCalibrator";

/* ─── Weights (from literature) ─────────────────────────────────────────────
 * SWR  0.35 — strongest single predictor (Maisey 1999; Sell 2017)
 * BF%  0.25 — second strongest; moderates visual readability of all ratios
 * CWR  0.15 — secondary signal, consistent (Stulp 2015)
 * TI   0.10 — complementary to SWR, independent morphological axis
 * PAS  0.10 — posture/perceived height effect (Carney 2010; Nettle 2002)
 * PC   0.05 — composite — weakest independent signal
 * ─────────────────────────────────────────────────────────────────────────── */

const WEIGHTS: Record<keyof CalibrationMetrics, number> = {
  swr: 0.35,
  bf:  0.25,
  cwr: 0.15,
  ti:  0.10,
  pas: 0.10,
  pc:  0.05,
};

const RANGES: Record<keyof CalibrationMetrics, [number, number]> = {
  swr: [1.41, 1.63],
  cwr: [1.25, 1.35],
  bf:  [10,   17  ],
  pas: [80,   95  ],
  ti:  [1.1,  1.5 ],
  pc:  [75,   95  ],
};

/**
 * Age-adjusted optimal ranges.
 *
 * BF%: healthy-optimal BF rises with age (hormonal decline, metabolic slowdown).
 * Muscle metrics (SWR, CWR, TI, PC): optimal window shifts down with sarcopenia onset.
 * PAS: fully trainable at any age — range unchanged.
 */
export function getAgeRanges(age: number): Record<keyof CalibrationMetrics, [number, number]> {
  // BF% — optimal window shifts up with age
  const bf: [number, number] =
    age <= 30 ? [10, 17] :
    age <= 40 ? [11, 18] :
    age <= 50 ? [13, 20] :
    age <= 60 ? [15, 22] :
    age <= 70 ? [17, 24] :
               [19, 26];

  // Muscle metric shift — how much the achievable optimal window drops per decade
  const s =
    age <= 30 ? 0.00 :
    age <= 40 ? 0.02 :
    age <= 50 ? 0.05 :
    age <= 60 ? 0.08 :
    age <= 70 ? 0.11 :
               0.14;

  const r = (v: number) => Math.round(v * 100) / 100;

  return {
    swr: [r(1.41 - s),        r(1.63 - s)       ],
    cwr: [r(1.25 - s * 0.5),  r(1.35 - s * 0.5) ],
    bf,
    pas: [80, 95],  // age-neutral
    ti:  [r(1.10 - s * 0.25), r(1.50 - s * 0.25)],
    pc:  [Math.round(75 - s * 50), Math.round(95 - s * 50)],
  };
}

const SCORE_LABELS: { min: number; label: string }[] = [
  { min: 85, label: "Elite" },
  { min: 70, label: "High" },
  { min: 55, label: "Above Average" },
  { min: 40, label: "Average" },
  { min: 25, label: "Below Average" },
  { min:  0, label: "Needs Work" },
];

export type AttractivenessResult = {
  score:     number;  // 0–100
  label:     string;
  breakdown: Record<keyof CalibrationMetrics, number>;  // per-metric 0–10
};

export type RealisticPotential = {
  min:       number;  // lower bound
  max:       number;  // upper bound (ceiling)
  label:     string;  // label of the ceiling score
  execution: string;  // context string
};

/** Compute a per-metric score (0–10) against a given range. */
function metricScore(
  key: keyof CalibrationMetrics,
  value: number,
  ranges: Record<keyof CalibrationMetrics, [number, number]> = RANGES,
): number {
  const [min, max] = ranges[key];
  const span = max - min;

  if (value >= min && value <= max) return 10;

  let gapNormalized: number;
  if (value < min) {
    gapNormalized = (min - value) / span;
  } else {
    gapNormalized = (value - max) / span;
    if (key === "bf") gapNormalized *= 1.4;
  }

  return Math.max(0, 10 - gapNormalized * 10);
}

// ── Age-calibrated realistic potential ───────────────────────────────────────

/**
 * Muscle-dependent metrics (SWR, CWR, TI, PC):
 * Fraction of the gap-to-optimal that can realistically be closed.
 * Grounded in sarcopenia onset (~35–40 yo) and testosterone decline (~1%/yr after 30).
 */
export function muscleGainMultiplier(age: number): number {
  if (age <= 25) return 0.95;
  if (age <= 35) return 0.80;
  if (age <= 45) return 0.65;
  if (age <= 55) return 0.50;
  if (age <= 65) return 0.35;
  return 0.20;
}

/**
 * BF% realistic floor by age.
 * Metabolic slowdown + hormonal decline raise the practical minimum BF.
 */
export function bfRealisticTarget(currentBf: number, age: number): number {
  const floor   = age <= 25 ? 10 : age <= 35 ? 11 : age <= 45 ? 13 : age <= 55 ? 15 : age <= 65 ? 17 : 19;
  const maxDrop = age <= 25 ? 12 : age <= 35 ?  9 : age <= 45 ?  7 : age <= 55 ?  5 : age <= 65 ?  3 :  2;
  return Math.max(currentBf - maxDrop, floor);
}

/** Best realistic metric score (0–10) achievable at a given age (using age-adjusted ranges). */
function ceilingMetricScore(key: keyof CalibrationMetrics, value: number, age: number): number {
  const ageRanges = getAgeRanges(age);
  const [min] = ageRanges[key];

  if (key === "bf") {
    return metricScore("bf", bfRealisticTarget(value, age), ageRanges);
  }

  if (key === "pas") {
    return metricScore("pas", Math.min(92, value + 20), ageRanges);
  }

  // SWR, CWR, TI, PC — can close the gap toward age-adjusted optimal
  const ageScore = metricScore(key, value, ageRanges);
  if (ageScore >= 10) return 10; // already at or above age-adjusted optimal

  if (value < min) {
    const target = value + (min - value) * muscleGainMultiplier(age);
    return metricScore(key, target, ageRanges);
  }

  return ageScore;
}

/**
 * Compute the age-adjusted ceiling score.
 *
 * This is NOT a 12–18 month projection — it is the score this person would get
 * if ALL their metrics were at the midpoint of the age-adjusted optimal ranges.
 * In other words: 100 = "perfect for your age", and this shows how far from
 * that ceiling they can theoretically get.
 *
 * Since the main score already uses age-adjusted ranges, the ceiling here
 * and the current score are on the exact same scale.
 */
export function computeRealisticPotential(
  metrics: CalibrationMetrics,
  age: number,
): RealisticPotential {
  const ageRanges = getAgeRanges(age);

  // Target for each metric = midpoint of the age-adjusted optimal range
  // (BF uses the floor of the range since lower is better there)
  let weightedCeiling = 0;
  for (const key of Object.keys(metrics) as (keyof CalibrationMetrics)[]) {
    const [min, max] = ageRanges[key];
    const target = key === "bf" ? min : (min + max) / 2;
    weightedCeiling += metricScore(key, target, ageRanges) * WEIGHTS[key];
  }

  // Ceiling should always be 100 since all targets are within optimal ranges —
  // but clamp in case of floating-point edge cases.
  const ceiling = Math.min(100, Math.round(weightedCeiling * 10));
  const label   = SCORE_LABELS.find(({ min }) => ceiling >= min)?.label ?? "Needs Work";

  const execution =
    age <= 35 ? "with consistent training" :
    age <= 50 ? "with consistent training & recovery focus" :
                "with adapted training and lifestyle";

  return { min: ceiling, max: ceiling, label, execution };
}

/**
 * Compute the attractiveness score.
 *
 * Without age: absolute score against universal optimal ranges (0–100).
 *
 * With age: score computed against age-adjusted optimal ranges.
 * A 71-year-old with BF 22% is NOT penalized — 22% is within their optimal range.
 * This reflects "how well is this person doing for their age", not vs a 25-year-old.
 */
export function computeAttractivenessScore(
  metrics: CalibrationMetrics,
  age?: number,
): AttractivenessResult {
  const ranges = age != null ? getAgeRanges(age) : RANGES;
  const breakdown = {} as Record<keyof CalibrationMetrics, number>;
  let weightedSum = 0;

  for (const key of Object.keys(metrics) as (keyof CalibrationMetrics)[]) {
    const ms = metricScore(key, metrics[key], ranges);
    breakdown[key] = Math.round(ms * 10) / 10;
    weightedSum += ms * WEIGHTS[key];
  }

  const score = Math.round(weightedSum * 10);  // 0–100
  const label = SCORE_LABELS.find(({ min }) => score >= min)?.label ?? "Needs Work";
  return { score, label, breakdown };
}
