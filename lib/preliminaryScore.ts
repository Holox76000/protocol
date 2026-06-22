// Preliminary attractiveness score built from quiz answers only.
//
// The full `computeAttractivenessScore` (lib/attractivenessScore.ts) requires
// CalibrationMetrics from a photo calibration — those don't exist at the
// preliminary-report stage. This helper estimates a current + potential score
// from morphology, age bracket, BMI proxy, and self-reported context.
//
// It's deliberately defensible (not a clinical claim) and shaped to match the
// same 0-100 scale used everywhere else in the report.

export type PrelimScore = {
  current: number;     // 0-100
  potential: number;   // 0-100, always > current
  currentLabel: string;
  potentialLabel: string;
};

function labelFor(score: number): string {
  if (score >= 85) return "Elite";
  if (score >= 70) return "High";
  if (score >= 55) return "Above Average";
  if (score >= 40) return "Average";
  if (score >= 25) return "Below Average";
  return "Needs Work";
}

function parseAge(ageBracket: string): number {
  if (ageBracket.includes("20")) return 25;
  if (ageBracket.includes("30")) return 35;
  if (ageBracket.includes("40")) return 45;
  if (ageBracket.includes("50+") || ageBracket.includes("50–") || ageBracket.includes("50-")) return 55;
  return 30;
}

function bmi(answers: Record<string, unknown>): number | null {
  const heightCm = Number(answers.height_cm);
  const heightFt = Number(answers.height_ft);
  const heightIn = Number(answers.height_in);
  const weightKg = Number(answers.weight_kg);
  const weightVal = Number(answers.weight_value);
  const weightUnit = String(answers.weight_unit ?? "");

  let h: number | null = null;
  if (Number.isFinite(heightCm) && heightCm > 100) h = heightCm;
  else if (Number.isFinite(heightFt)) h = heightFt * 30.48 + (Number.isFinite(heightIn) ? heightIn * 2.54 : 0);

  let w: number | null = null;
  if (Number.isFinite(weightKg) && weightKg > 30) w = weightKg;
  else if (Number.isFinite(weightVal)) w = weightUnit === "lbs" ? weightVal * 0.4536 : weightVal;

  if (!h || !w) return null;
  return w / Math.pow(h / 100, 2);
}

// Multiplier representing how much of the gap-to-100 the Protocol can close.
// Younger users can close more (anabolic environment, faster adaptation).
function realisticGainMultiplier(age: number): number {
  if (age <= 25) return 0.65;
  if (age <= 35) return 0.55;
  if (age <= 45) return 0.45;
  if (age <= 55) return 0.35;
  return 0.25;
}

export function computePreliminaryScore(answers: Record<string, unknown>): PrelimScore {
  const morphology = String(answers.morphology ?? "").toLowerCase();
  const age = parseAge(String(answers.age_bracket ?? ""));
  const bmiValue = bmi(answers);

  // Baseline current score per morphology — anchored on what the patterns
  // describe: skinny / skinny-fat / overweight are off the SWR + BF optimum
  // in different ways.
  const morphBase: Record<string, number> = {
    "skinny":     40,
    "skinny-fat": 32,
    "overweight": 28,
    "average":    52,
  };
  let current = morphBase[morphology] ?? 45;

  // BMI nudge: high BMI on skinny-fat / overweight drags the score down further.
  // Low BMI on skinny similarly drags it down (frame still under-built).
  if (bmiValue != null) {
    if (bmiValue > 28) current -= 4;
    else if (bmiValue > 25) current -= 2;
    else if (bmiValue < 19) current -= 3;
  }

  // Age penalty: 3 points per decade after 30 (sarcopenia onset).
  if (age > 30) current -= Math.floor((age - 30) / 10) * 3;

  current = Math.max(15, Math.min(75, current));

  // Realistic potential after 12 weeks of Protocol.
  const gap = 100 - current;
  const potential = Math.round(current + gap * realisticGainMultiplier(age));
  const clampedPotential = Math.max(current + 12, Math.min(92, potential));

  return {
    current: Math.round(current),
    potential: clampedPotential,
    currentLabel: labelFor(current),
    potentialLabel: labelFor(clampedPotential),
  };
}
