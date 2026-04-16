/**
 * Male Body Fat Estimation Module
 *
 * Estimates body fat percentage for ADULT MEN ONLY (age 18–90) using a
 * multi-formula decision tree rather than a single equation.
 *
 * Design rationale:
 * ─────────────────
 * 1. Waist-first: when waist circumference is available, waist-based formulas
 *    (RFM, WHtR) anchor the estimate. They outperform pure BMI proxies for
 *    central adiposity detection.
 *
 * 2. Age-aware anchoring: Deurenberg's BMI × age term inflates estimates in
 *    older men. Above age 60 we use RFM + CUN-BAE as the anchor and treat
 *    Deurenberg as an upper-control reference only.
 *
 * 3. No double-counting: morphological flags (central fat, abdomen projection)
 *    partially overlap with what waist-based formulas already capture. When
 *    WHtR ≥ 0.55 we moderate those signals before combining them.
 *
 * 4. Honest uncertainty: each combination of data completeness maps to an
 *    explicit range width. Formula disagreement widens the range further.
 *
 * CUN-BAE note:
 * The sex coefficient in CUN-BAE (Gómez-Ambrosi et al. 2012) represents the
 * female increment (sex = 1 for women, 0 for men). This module is male-only
 * and substitutes sex = 0, which matches the paper's validation data for men.
 */

/* ──────────────────────────────────────────────────────────────────────────
   CONSTANTS
   ────────────────────────────────────────────────────────────────────────── */

const AGE_MIN = 18;
const AGE_MAX = 90;
const HEIGHT_MIN_CM = 140;
const HEIGHT_MAX_CM = 220;
const WEIGHT_MIN_KG = 40;
const WEIGHT_MAX_KG = 250;
const WAIST_MIN_CM = 50;
const WAIST_MAX_CM = 200;

const GUARDRAIL_MIN_BF = 6;   // physiological floor for adult men (essential fat)
const GUARDRAIL_MAX_BF = 45;  // upper plausibility ceiling

const FORMULA_SPREAD_THRESHOLD = 5;     // if max−min > this, formulas "disagree substantially"
const OLDER_AGE_THRESHOLD = 60;         // switch anchor strategy above this age
const WHTR_MODERATION_THRESHOLD = 0.55; // cap fat + abdomen morphology signals above this WHtR

const RFM_DIVERGE_NOTE_THRESHOLD = 6;           // RFM vs final: add note if gap > this
const DEURENBERG_OVERSHOOT_NOTE_MARGIN = 4;     // Deurenberg vs final: add note if > this above

const MORPH_ADJ_MIN = -2;
const MORPH_ADJ_MAX = 2;
const WHTR_MORPH_CAP = 1.0; // cap for (fatDistribution + abdomenProjection) when WHtR ≥ threshold

/* ──────────────────────────────────────────────────────────────────────────
   PUBLIC TYPES
   ────────────────────────────────────────────────────────────────────────── */

export type MaleBodyFatInput = {
  age: number;
  heightCm: number;
  weightKg: number;
  waistCm?: number;

  // Optional morphology signals (from questionnaire or image analysis)
  visualMuscularity?: "low" | "medium" | "high";
  fatDistribution?: "central" | "balanced" | "lower_body";
  abdomenProjection?: "low" | "medium" | "high";

  // Metadata
  measurementQuality?: "low" | "medium" | "high";
};

export type MaleBodyFatResult = {
  /** Central point estimate, rounded to 1 decimal */
  pointEstimate: number;
  /** Lower bound of plausible range, rounded to 1 decimal */
  rangeMin: number;
  /** Upper bound of plausible range, rounded to 1 decimal */
  rangeMax: number;
  /** Qualitative confidence level */
  confidence: "low" | "medium" | "high";

  // Intermediate values for transparency (all rounded to 2 decimals when present)
  bmi: number;
  whtr?: number;
  rfm?: number;
  cunBae?: number;
  deurenberg?: number;

  /** Description of the formula combination used as the anchor */
  anchorModel: string;
  /** Net morphological adjustment applied (positive = higher BF, negative = lower) */
  morphologicalAdjustment: number;

  /** Plain-language signals that drove the estimate */
  drivers: string[];
  /** Caveats about data quality, formula choice, or potential biases */
  notes: string[];
};

/** Internal error returned for invalid inputs */
export type ValidationError = {
  valid: false;
  errors: string[];
};

/* ──────────────────────────────────────────────────────────────────────────
   VALIDATION
   ────────────────────────────────────────────────────────────────────────── */

export function validateInput(input: MaleBodyFatInput): ValidationError | null {
  const errors: string[] = [];

  if (input.age < AGE_MIN || input.age > AGE_MAX) {
    errors.push(`Age must be between ${AGE_MIN} and ${AGE_MAX} (received ${input.age}).`);
  }
  if (input.heightCm < HEIGHT_MIN_CM || input.heightCm > HEIGHT_MAX_CM) {
    errors.push(`Height must be between ${HEIGHT_MIN_CM} and ${HEIGHT_MAX_CM} cm (received ${input.heightCm}).`);
  }
  if (input.weightKg < WEIGHT_MIN_KG || input.weightKg > WEIGHT_MAX_KG) {
    errors.push(`Weight must be between ${WEIGHT_MIN_KG} and ${WEIGHT_MAX_KG} kg (received ${input.weightKg}).`);
  }
  if (input.waistCm !== undefined) {
    if (input.waistCm < WAIST_MIN_CM || input.waistCm > WAIST_MAX_CM) {
      errors.push(`Waist must be between ${WAIST_MIN_CM} and ${WAIST_MAX_CM} cm (received ${input.waistCm}).`);
    }
  }

  return errors.length > 0 ? { valid: false, errors } : null;
}

/* ──────────────────────────────────────────────────────────────────────────
   FORMULA HELPERS
   ────────────────────────────────────────────────────────────────────────── */

/** Body Mass Index */
export function computeBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

/** Waist-to-Height Ratio */
export function computeWHtR(waistCm: number, heightCm: number): number {
  return waistCm / heightCm;
}

/**
 * Relative Fat Mass (Woolcott & Bergman, 2018) — men's formula.
 * RFM = 64 − 20 × (height / waist)
 * Validated to outperform BMI for BF% estimation in men.
 */
export function computeRFM(heightCm: number, waistCm: number): number {
  return 64 - 20 * (heightCm / waistCm);
}

/**
 * Deurenberg et al. (1991) equation for men.
 * BF% = 1.20 × BMI + 0.23 × age − 16.2
 *
 * Limitation: the age term can overshoot in older men (> 60) who carry
 * less visceral fat than this linear model implies. Treat as upper-control
 * reference in that age group.
 */
export function computeDeurenberg(bmi: number, age: number): number {
  return 1.20 * bmi + 0.23 * age - 16.2;
}

/**
 * CUN-BAE (Gómez-Ambrosi et al. 2012) — male encoding.
 *
 * Original formula uses a sex indicator where sex = 1 for FEMALE (female
 * increment term). For men we substitute sex = 0, which zeroes out the
 * sex-interaction terms. This matches the paper's validation cohort for men.
 *
 * Full formula retained in code for auditability; sex = 0 terms collapse to zero.
 */
export function computeCunBae(bmi: number, age: number): number {
  const sex = 0; // male: sex = 0 (female increment term)
  return (
    -44.988
    + 0.503  * age
    + 10.689 * sex                     // = 0 for men
    + 3.172  * bmi
    - 0.026  * bmi * bmi
    + 0.181  * bmi * sex               // = 0 for men
    - 0.02   * bmi * age
    - 0.005  * bmi * bmi * sex         // = 0 for men
    + 0.00021 * bmi * bmi * age
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   STATISTICS HELPERS
   ────────────────────────────────────────────────────────────────────────── */

/** Returns the median of a non-empty array of numbers. */
export function median(values: number[]): number {
  if (values.length === 0) throw new Error("median() requires at least one value");
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Returns the arithmetic mean of a non-empty array of numbers. */
export function average(values: number[]): number {
  if (values.length === 0) throw new Error("average() requires at least one value");
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/* ──────────────────────────────────────────────────────────────────────────
   DECISION TREE — ANCHOR MODEL
   ────────────────────────────────────────────────────────────────────────── */

type AnchorResult = {
  anchorValue: number;
  anchorModel: string;
  drivers: string[];
  notes: string[];
};

function chooseAnchor(
  input: MaleBodyFatInput,
  rfm: number | undefined,
  cunBae: number,
  deurenberg: number,
): AnchorResult {
  const { age, visualMuscularity } = input;
  const hasWaist = rfm !== undefined;
  const drivers: string[] = [];
  const notes: string[] = [];
  let anchorValue: number;
  let anchorModel: string;

  if (hasWaist) {
    // ── Waist available ────────────────────────────────────────────────
    drivers.push("waist circumference provides direct central-adiposity signal");

    if (age >= OLDER_AGE_THRESHOLD) {
      // Older men: BMI–age interaction in Deurenberg tends to overshoot.
      // Use RFM + CUN-BAE; treat Deurenberg as upper-control reference only.
      anchorValue = median([rfm!, cunBae]);
      anchorModel = "median(RFM, CUN-BAE)";
      notes.push("Deurenberg treated as upper-control reference due to age ≥ 60 — BMI-based age formula may overshoot");
      drivers.push("age ≥ 60 increases expected body-fat percentage and shifts anchor to waist-based formulas");

    } else if (visualMuscularity === "high") {
      // Muscular men: elevated BMI is muscle mass, not fat.
      // Deurenberg would overestimate; use waist-based formulas only.
      anchorValue = median([rfm!, cunBae]);
      anchorModel = "median(RFM, CUN-BAE)";
      notes.push("Deurenberg excluded from anchor — BMI-based formulas overestimate body fat in muscular builds");
      drivers.push("muscular build reduces reliance on BMI-based formulas");

    } else {
      // Typical adult: three-formula median for balance
      anchorValue = median([rfm!, cunBae, deurenberg]);
      anchorModel = "median(RFM, CUN-BAE, Deurenberg)";
      drivers.push("waist-to-height ratio indicates central adiposity");
    }

  } else {
    // ── Waist unavailable ─────────────────────────────────────────────
    notes.push("waist measurement missing — estimate relies more on BMI-based formulas");

    if (age >= OLDER_AGE_THRESHOLD) {
      // Cannot be high confidence without waist at this age
      anchorValue = average([cunBae, deurenberg]);
      anchorModel = "average(CUN-BAE, Deurenberg)";
      drivers.push("age ≥ 60 increases expected body-fat percentage at a given BMI");
      notes.push("confidence cannot be high without waist measurement for men aged ≥ 60");

    } else {
      anchorValue = median([cunBae, deurenberg]);
      anchorModel = "median(CUN-BAE, Deurenberg)";
    }
  }

  return { anchorValue, anchorModel, drivers, notes };
}

/* ──────────────────────────────────────────────────────────────────────────
   MORPHOLOGICAL ADJUSTMENT
   ────────────────────────────────────────────────────────────────────────── */

type MorphResult = {
  adjustment: number;
  drivers: string[];
  notes: string[];
};

function computeMorphologicalAdjustment(
  input: MaleBodyFatInput,
  whtr: number | undefined,
): MorphResult {
  const { visualMuscularity, fatDistribution, abdomenProjection } = input;
  const drivers: string[] = [];
  const notes: string[] = [];

  // ── Individual component scores ────────────────────────────────────────
  let muscularityDelta = 0;
  if (visualMuscularity === "high") {
    muscularityDelta = -1.5;
    drivers.push("high visible muscularity shifts estimate downward");
  } else if (visualMuscularity === "low") {
    muscularityDelta = +1.0;
    drivers.push("low visible muscularity shifts estimate upward");
  }

  let fatDistDelta = 0;
  if (fatDistribution === "central") {
    fatDistDelta = +0.75;
    drivers.push("central fat distribution increases estimate");
  } else if (fatDistribution === "lower_body") {
    fatDistDelta = -0.5;
    drivers.push("lower-body fat distribution slightly reduces estimate");
  }

  let abdomenDelta = 0;
  if (abdomenProjection === "high") {
    abdomenDelta = +0.75;
    drivers.push("high abdominal projection increases estimate");
  } else if (abdomenProjection === "medium") {
    abdomenDelta = +0.25;
  }

  // ── Moderation: avoid double-counting central fat when WHtR already
  //    captures it (WHtR ≥ 0.55 means the waist formulas already reflect
  //    significant central adiposity)
  let centralSum = fatDistDelta + abdomenDelta;
  if (whtr !== undefined && whtr >= WHTR_MODERATION_THRESHOLD) {
    if (centralSum > WHTR_MORPH_CAP) {
      centralSum = WHTR_MORPH_CAP;
      notes.push("central fat signals were moderated to avoid double-counting — WHtR already reflects central adiposity");
    }
  }

  // ── Combine and apply global cap ──────────────────────────────────────
  const rawAdj = muscularityDelta + centralSum;
  const adjustment = Math.max(MORPH_ADJ_MIN, Math.min(MORPH_ADJ_MAX, rawAdj));

  return { adjustment, drivers, notes };
}

/* ──────────────────────────────────────────────────────────────────────────
   CONFIDENCE SCORING
   ────────────────────────────────────────────────────────────────────────── */

function computeConfidence(
  input: MaleBodyFatInput,
  formulaSpread: number,
): "low" | "medium" | "high" {
  const hasWaist = input.waistCm !== undefined;
  const hasMorphology =
    input.visualMuscularity !== undefined ||
    input.fatDistribution !== undefined ||
    input.abdomenProjection !== undefined;
  const qualityOk =
    input.measurementQuality === "high" || input.measurementQuality === "medium";
  const isLowQuality = input.measurementQuality === "low";
  const spreadOk = formulaSpread <= FORMULA_SPREAD_THRESHOLD;

  // HIGH: all signals present and formulas agree
  if (hasWaist && qualityOk && hasMorphology && spreadOk) {
    return "high";
  }

  // LOW: too many gaps or very noisy measurement
  if ((!hasWaist && !hasMorphology) || isLowQuality || formulaSpread > FORMULA_SPREAD_THRESHOLD * 2) {
    return "low";
  }

  // MEDIUM: everything else
  return "medium";
}

/* ──────────────────────────────────────────────────────────────────────────
   OUTPUT RANGE
   ────────────────────────────────────────────────────────────────────────── */

type RangeResult = { rangeMin: number; rangeMax: number };

function computeOutputRange(
  pointEstimate: number,
  input: MaleBodyFatInput,
  formulaSpread: number,
  confidence: "low" | "medium" | "high",
): RangeResult {
  const hasWaist = input.waistCm !== undefined;
  const hasMorphology =
    input.visualMuscularity !== undefined ||
    input.fatDistribution !== undefined ||
    input.abdomenProjection !== undefined;
  const isLowQuality = input.measurementQuality === "low";
  const isMediumQuality = input.measurementQuality === "medium";

  // ── Base half-width ───────────────────────────────────────────────────
  let halfWidth: number;

  if (confidence === "high") {
    // Waist + morphology + good quality + aligned formulas
    halfWidth = 2.0;
  } else if (hasWaist && !isLowQuality && hasMorphology) {
    // Waist present but formulas disagree or some morphology missing
    halfWidth = 2.5;
  } else if (hasWaist && (isLowQuality || isMediumQuality) && !hasMorphology) {
    // Waist present but limited morphology or medium quality
    halfWidth = 2.5;
  } else if (!hasWaist && isLowQuality) {
    // No waist + poor measurement
    halfWidth = 4.0;
  } else if (!hasWaist) {
    // No waist, otherwise ok
    halfWidth = 3.5;
  } else {
    halfWidth = 3.5;
  }

  // ── Widen if formulas disagree substantially ──────────────────────────
  if (formulaSpread > FORMULA_SPREAD_THRESHOLD) {
    halfWidth += 0.5;
  }

  const rangeMin = Math.round((pointEstimate - halfWidth) * 10) / 10;
  const rangeMax = Math.round((pointEstimate + halfWidth) * 10) / 10;

  return { rangeMin, rangeMax };
}

/* ──────────────────────────────────────────────────────────────────────────
   PLAUSIBILITY NOTES
   ────────────────────────────────────────────────────────────────────────── */

function buildConsistencyNotes(
  finalEstimate: number,
  rfm: number | undefined,
  deurenberg: number,
  age: number,
): string[] {
  const notes: string[] = [];

  if (rfm !== undefined) {
    const rfmGap = finalEstimate - rfm;
    if (rfmGap > RFM_DIVERGE_NOTE_THRESHOLD) {
      notes.push(
        `RFM (${rfm.toFixed(1)}%) is substantially below the final estimate — consider rechecking the waist measurement`
      );
    }
  }

  if (age >= OLDER_AGE_THRESHOLD) {
    const deureGap = deurenberg - finalEstimate;
    if (deureGap > DEURENBERG_OVERSHOOT_NOTE_MARGIN) {
      notes.push(
        `Deurenberg (${deurenberg.toFixed(1)}%) is well above the final estimate — BMI-based age formula may be overshooting for this age group`
      );
    }
  }

  return notes;
}

/* ──────────────────────────────────────────────────────────────────────────
   MAIN EXPORT
   ────────────────────────────────────────────────────────────────────────── */

/**
 * Estimates body fat percentage for an adult male.
 *
 * @throws {Error} when input validation fails — the error message contains
 *   a semicolon-separated list of specific failures.
 */
export function estimateMaleBodyFat(input: MaleBodyFatInput): MaleBodyFatResult {
  // ── 1. Validate inputs ────────────────────────────────────────────────
  const validation = validateInput(input);
  if (validation) {
    throw new Error(`Invalid input: ${validation.errors.join("; ")}`);
  }

  const { age, heightCm, weightKg, waistCm } = input;
  const allDrivers: string[] = [];
  const allNotes: string[] = [];

  // ── 2. Compute all valid formulas ─────────────────────────────────────
  const bmi       = computeBMI(weightKg, heightCm);
  const deurenberg = computeDeurenberg(bmi, age);
  const cunBae     = computeCunBae(bmi, age);

  const whtr: number | undefined =
    waistCm !== undefined ? computeWHtR(waistCm, heightCm) : undefined;

  const rfm: number | undefined =
    waistCm !== undefined ? computeRFM(heightCm, waistCm) : undefined;

  // WHtR driver — explicit central-adiposity warning
  if (whtr !== undefined && whtr >= 0.5) {
    allDrivers.push("waist-to-height ratio indicates central adiposity");
  }

  // Age driver
  if (age >= 45) {
    allDrivers.push("age increases expected body-fat percentage at a given BMI");
  }

  // ── 3. Choose anchor model ────────────────────────────────────────────
  const { anchorValue, anchorModel, drivers: anchorDrivers, notes: anchorNotes } =
    chooseAnchor(input, rfm, cunBae, deurenberg);

  allDrivers.push(...anchorDrivers);
  allNotes.push(...anchorNotes);

  // ── 4. Morphological adjustment ───────────────────────────────────────
  const { adjustment: morphAdj, drivers: morphDrivers, notes: morphNotes } =
    computeMorphologicalAdjustment(input, whtr);

  allDrivers.push(...morphDrivers);
  allNotes.push(...morphNotes);

  // ── 5. Final estimate ─────────────────────────────────────────────────
  let finalEstimate = anchorValue + morphAdj;

  // Soft guardrails — physiological bounds, not hard clipping
  if (finalEstimate < GUARDRAIL_MIN_BF) finalEstimate = GUARDRAIL_MIN_BF;
  if (finalEstimate > GUARDRAIL_MAX_BF) finalEstimate = GUARDRAIL_MAX_BF;

  // ── 6. Consistency notes ──────────────────────────────────────────────
  const consistencyNotes = buildConsistencyNotes(finalEstimate, rfm, deurenberg, age);
  allNotes.push(...consistencyNotes);

  // ── 7. Formula spread (for confidence + range) ────────────────────────
  const computedValues = [deurenberg, cunBae, rfm].filter((v): v is number => v !== undefined);
  const formulaSpread = Math.max(...computedValues) - Math.min(...computedValues);

  if (formulaSpread > FORMULA_SPREAD_THRESHOLD) {
    allNotes.push(`formulas show wide disagreement (spread: ${formulaSpread.toFixed(1)}%) — range widened accordingly`);
  }

  // ── 8. Confidence ────────────────────────────────────────────────────
  const confidence = computeConfidence(input, formulaSpread);

  // ── 9. Output range ──────────────────────────────────────────────────
  const { rangeMin, rangeMax } = computeOutputRange(finalEstimate, input, formulaSpread, confidence);

  // ── 10. Measurement quality caveats ──────────────────────────────────
  if (input.measurementQuality === "low") {
    allNotes.push("low measurement quality — range widened to reflect uncertainty");
  }

  // ── 11. Round and return ─────────────────────────────────────────────
  return {
    pointEstimate:           Math.round(finalEstimate * 10) / 10,
    rangeMin,
    rangeMax,
    confidence,
    bmi:                     Math.round(bmi * 100) / 100,
    whtr:                    whtr !== undefined ? Math.round(whtr * 100) / 100 : undefined,
    rfm:                     rfm  !== undefined ? Math.round(rfm  * 100) / 100 : undefined,
    cunBae:                  Math.round(cunBae     * 100) / 100,
    deurenberg:              Math.round(deurenberg  * 100) / 100,
    anchorModel,
    morphologicalAdjustment: Math.round(morphAdj   * 100) / 100,
    drivers: allDrivers,
    notes:   allNotes,
  };
}
