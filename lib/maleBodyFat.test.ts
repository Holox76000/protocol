/**
 * Tests for the male body fat estimation module.
 *
 * Reference values were verified by hand-calculating each formula before
 * writing assertions. Floating-point tolerances use toBeCloseTo() rather
 * than strict equality to accommodate JS rounding on intermediate values.
 */

import { describe, it, expect } from "vitest";
import {
  estimateMaleBodyFat,
  validateInput,
  computeBMI,
  computeWHtR,
  computeRFM,
  computeDeurenberg,
  computeCunBae,
  median,
  average,
} from "./maleBodyFat";

/* ──────────────────────────────────────────────────────────────────────────
   UNIT TESTS — formula helpers
   ────────────────────────────────────────────────────────────────────────── */

describe("computeBMI", () => {
  it("returns correct BMI for a typical adult", () => {
    // 80 kg, 180 cm → 80 / 3.24 = 24.69
    expect(computeBMI(80, 180)).toBeCloseTo(24.69, 1);
  });

  it("returns correct BMI for a heavy, short individual", () => {
    // 100 kg, 160 cm → 100 / 2.56 = 39.06
    expect(computeBMI(100, 160)).toBeCloseTo(39.06, 1);
  });
});

describe("computeWHtR", () => {
  it("returns waist divided by height", () => {
    expect(computeWHtR(90, 180)).toBeCloseTo(0.5, 5);
    expect(computeWHtR(84, 178)).toBeCloseTo(0.4719, 3);
  });
});

describe("computeRFM", () => {
  it("returns 64 minus 20 times height/waist", () => {
    // height=180, waist=90 → 64 - 20*(180/90) = 64 - 40 = 24
    expect(computeRFM(180, 90)).toBeCloseTo(24, 5);
  });

  it("matches expected value for case 1", () => {
    // height=193, waist=112 → 64 - 20*(193/112) = 64 - 34.464 = 29.536
    expect(computeRFM(193, 112)).toBeCloseTo(29.54, 1);
  });
});

describe("computeDeurenberg (men)", () => {
  it("matches formula: 1.20*BMI + 0.23*age - 16.2", () => {
    const bmi = computeBMI(82, 180); // 25.31
    const result = computeDeurenberg(bmi, 32);
    // 1.20*25.31 + 0.23*32 - 16.2 = 30.37 + 7.36 - 16.2 = 21.53
    expect(result).toBeCloseTo(21.53, 1);
  });
});

describe("computeCunBae (male, sex=0)", () => {
  it("produces reasonable BF% for an average adult male", () => {
    // 32yo, BMI=25.31 → should be in the 20-30% range
    const bmi = computeBMI(82, 180);
    const result = computeCunBae(bmi, 32);
    expect(result).toBeGreaterThan(15);
    expect(result).toBeLessThan(35);
  });

  it("returns a higher estimate for older men at the same BMI", () => {
    const bmi = computeBMI(80, 180);
    const young = computeCunBae(bmi, 30);
    const old   = computeCunBae(bmi, 65);
    expect(old).toBeGreaterThan(young);
  });
});

describe("median", () => {
  it("returns the middle value for odd-length arrays", () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([10, 20, 30])).toBe(20);
    expect(median([21.5, 22.8, 23.6])).toBe(22.8);
  });

  it("returns the average of the two middle values for even-length arrays", () => {
    expect(median([1, 3])).toBe(2);
    expect(median([10, 20])).toBe(15);
    expect(median([29.5, 32.5])).toBeCloseTo(31, 3);
  });

  it("throws on empty array", () => {
    expect(() => median([])).toThrow();
  });
});

describe("average", () => {
  it("returns the arithmetic mean", () => {
    expect(average([10, 20, 30])).toBe(20);
    expect(average([29, 35])).toBe(32);
  });

  it("throws on empty array", () => {
    expect(() => average([])).toThrow();
  });
});

/* ──────────────────────────────────────────────────────────────────────────
   UNIT TESTS — validateInput
   ────────────────────────────────────────────────────────────────────────── */

describe("validateInput", () => {
  const valid = { age: 35, heightCm: 178, weightKg: 80 };

  it("returns null for valid inputs", () => {
    expect(validateInput(valid)).toBeNull();
  });

  it("rejects age below 18", () => {
    const err = validateInput({ ...valid, age: 16 });
    expect(err).not.toBeNull();
    expect(err!.errors.some(e => e.includes("Age"))).toBe(true);
  });

  it("rejects age above 90", () => {
    const err = validateInput({ ...valid, age: 95 });
    expect(err).not.toBeNull();
  });

  it("rejects height below 140 cm", () => {
    const err = validateInput({ ...valid, heightCm: 130 });
    expect(err).not.toBeNull();
    expect(err!.errors.some(e => e.includes("Height"))).toBe(true);
  });

  it("rejects weight above 250 kg", () => {
    const err = validateInput({ ...valid, weightKg: 260 });
    expect(err).not.toBeNull();
    expect(err!.errors.some(e => e.includes("Weight"))).toBe(true);
  });

  it("rejects implausible waist (below 50 cm)", () => {
    const err = validateInput({ ...valid, waistCm: 30 });
    expect(err).not.toBeNull();
    expect(err!.errors.some(e => e.includes("Waist"))).toBe(true);
  });

  it("accepts valid waist", () => {
    expect(validateInput({ ...valid, waistCm: 85 })).toBeNull();
  });
});

/* ──────────────────────────────────────────────────────────────────────────
   INTEGRATION TESTS — estimateMaleBodyFat
   ────────────────────────────────────────────────────────────────────────── */

describe("CASE 1 — Older man with waist, low muscularity, central fat", () => {
  const result = estimateMaleBodyFat({
    age: 71,
    heightCm: 193,
    weightKg: 108.9,
    waistCm: 112,
    visualMuscularity: "low",
    fatDistribution: "central",
    abdomenProjection: "medium",
    measurementQuality: "high",
  });

  it("computes BMI around 29.23", () => {
    expect(result.bmi).toBeCloseTo(29.23, 1);
  });

  it("computes WHtR around 0.58", () => {
    expect(result.whtr).toBeCloseTo(0.58, 1);
  });

  it("computes RFM around 29.5", () => {
    expect(result.rfm).toBeDefined();
    expect(result.rfm!).toBeCloseTo(29.5, 0);
  });

  it("uses median(RFM, CUN-BAE) as anchor — Deurenberg is not the anchor", () => {
    expect(result.anchorModel).toBe("median(RFM, CUN-BAE)");
  });

  it("has a positive morphological adjustment (low muscularity + central fat)", () => {
    expect(result.morphologicalAdjustment).toBeGreaterThan(0);
  });

  it("point estimate lands in the low-to-mid 30s", () => {
    // RFM ≈ 29.5, CUN-BAE ≈ 32.5, anchor ≈ 31, morph ≈ +2 → ~33
    expect(result.pointEstimate).toBeGreaterThan(30);
    expect(result.pointEstimate).toBeLessThan(38);
  });

  it("confidence is medium (wide formula spread prevents high)", () => {
    expect(result.confidence).toBe("medium");
  });

  it("mentions Deurenberg as upper-control reference in notes", () => {
    expect(result.notes.some(n => n.toLowerCase().includes("deurenberg"))).toBe(true);
  });

  it("range is wider than ±2 due to formula spread", () => {
    const spread = result.rangeMax - result.rangeMin;
    expect(spread).toBeGreaterThan(4);
  });
});

describe("CASE 2 — Younger average man with waist", () => {
  const result = estimateMaleBodyFat({
    age: 32,
    heightCm: 180,
    weightKg: 82,
    waistCm: 89,
    visualMuscularity: "medium",
    fatDistribution: "balanced",
    abdomenProjection: "low",
    measurementQuality: "high",
  });

  it("uses median(RFM, CUN-BAE, Deurenberg) as anchor", () => {
    expect(result.anchorModel).toBe("median(RFM, CUN-BAE, Deurenberg)");
  });

  it("has zero morphological adjustment (neutral profile)", () => {
    expect(result.morphologicalAdjustment).toBe(0);
  });

  it("point estimate is in a typical lean-average range (~20-25%)", () => {
    expect(result.pointEstimate).toBeGreaterThanOrEqual(18);
    expect(result.pointEstimate).toBeLessThanOrEqual(28);
  });

  it("confidence is high (waist + quality + morphology + aligned formulas)", () => {
    expect(result.confidence).toBe("high");
  });

  it("range is tight (formulas agree)", () => {
    const spread = result.rangeMax - result.rangeMin;
    expect(spread).toBeLessThanOrEqual(5);
  });

  it("provides RFM and WHtR (waist is present)", () => {
    expect(result.rfm).toBeDefined();
    expect(result.whtr).toBeDefined();
  });
});

describe("CASE 3 — Muscular man", () => {
  const result = estimateMaleBodyFat({
    age: 29,
    heightCm: 178,
    weightKg: 92,
    waistCm: 84,
    visualMuscularity: "high",
    fatDistribution: "balanced",
    abdomenProjection: "low",
    measurementQuality: "high",
  });

  it("uses median(RFM, CUN-BAE) — Deurenberg excluded due to high muscularity", () => {
    expect(result.anchorModel).toBe("median(RFM, CUN-BAE)");
  });

  it("applies a negative morphological adjustment (muscular build)", () => {
    expect(result.morphologicalAdjustment).toBe(-1.5);
  });

  it("point estimate is below Deurenberg (BMI-based formula not inflating result)", () => {
    expect(result.pointEstimate).toBeLessThan(result.deurenberg!);
  });

  it("point estimate is in a lean-athletic range (~18-27%)", () => {
    expect(result.pointEstimate).toBeGreaterThanOrEqual(18);
    expect(result.pointEstimate).toBeLessThanOrEqual(27);
  });

  it("notes mention that Deurenberg was excluded from anchor", () => {
    expect(
      result.notes.some(n => n.toLowerCase().includes("deurenberg") && n.toLowerCase().includes("muscular"))
    ).toBe(true);
  });

  it("includes 'muscular build' in drivers", () => {
    expect(result.drivers.some(d => d.toLowerCase().includes("muscular"))).toBe(true);
  });
});

describe("CASE 4 — Missing waist", () => {
  const result = estimateMaleBodyFat({
    age: 45,
    heightCm: 175,
    weightKg: 88,
    visualMuscularity: "medium",
    measurementQuality: "medium",
  });

  it("provides no RFM (waist missing)", () => {
    expect(result.rfm).toBeUndefined();
  });

  it("provides no WHtR (waist missing)", () => {
    expect(result.whtr).toBeUndefined();
  });

  it("uses a BMI-based anchor model (no waist)", () => {
    expect(result.anchorModel).toBe("median(CUN-BAE, Deurenberg)");
  });

  it("confidence is at most medium (no waist)", () => {
    expect(result.confidence === "medium" || result.confidence === "low").toBe(true);
  });

  it("range is wider than ±3 (missing waist)", () => {
    const halfSpread = (result.rangeMax - result.rangeMin) / 2;
    expect(halfSpread).toBeGreaterThanOrEqual(3);
  });

  it("notes mention missing waist measurement", () => {
    expect(
      result.notes.some(n => n.toLowerCase().includes("waist"))
    ).toBe(true);
  });
});

describe("CASE 5 — Bad input validation", () => {
  it("throws a descriptive error for age below 18", () => {
    expect(() =>
      estimateMaleBodyFat({ age: 16, heightCm: 175, weightKg: 70 })
    ).toThrowError(/Invalid input/);
  });

  it("throws for age above 90", () => {
    expect(() =>
      estimateMaleBodyFat({ age: 92, heightCm: 175, weightKg: 70 })
    ).toThrow();
  });

  it("throws for implausible height", () => {
    expect(() =>
      estimateMaleBodyFat({ age: 30, heightCm: 100, weightKg: 70 })
    ).toThrow();
  });

  it("throws for implausible weight", () => {
    expect(() =>
      estimateMaleBodyFat({ age: 30, heightCm: 175, weightKg: 300 })
    ).toThrow();
  });

  it("throws for implausible waist", () => {
    expect(() =>
      estimateMaleBodyFat({ age: 30, heightCm: 175, weightKg: 75, waistCm: 20 })
    ).toThrow();
  });
});

/* ──────────────────────────────────────────────────────────────────────────
   EDGE CASES
   ────────────────────────────────────────────────────────────────────────── */

describe("Edge cases", () => {
  it("guardrail clamps implausibly low estimate to 6%", () => {
    // Very tall, very light, max muscularity — could theoretically compute below 6
    const result = estimateMaleBodyFat({
      age: 18,
      heightCm: 218,
      weightKg: 55,
      waistCm: 52,
      visualMuscularity: "high",
      fatDistribution: "lower_body",
      abdomenProjection: "low",
    });
    expect(result.pointEstimate).toBeGreaterThanOrEqual(6);
  });

  it("guardrail clamps implausibly high estimate to 45%", () => {
    const result = estimateMaleBodyFat({
      age: 85,
      heightCm: 150,
      weightKg: 145,
      waistCm: 135,
      visualMuscularity: "low",
      fatDistribution: "central",
      abdomenProjection: "high",
    });
    expect(result.pointEstimate).toBeLessThanOrEqual(45);
  });

  it("WHtR moderation note appears when WHtR >= 0.55 and both central signals present", () => {
    // waist 115, height 185 → WHtR = 0.621 > 0.55
    const result = estimateMaleBodyFat({
      age: 55,
      heightCm: 185,
      weightKg: 110,
      waistCm: 115,
      fatDistribution: "central",
      abdomenProjection: "high",
    });
    // If sum of fat+abdomen deltas (0.75+0.75=1.5) > 1.0 and WHtR >= 0.55, moderation fires
    expect(
      result.notes.some(n => n.toLowerCase().includes("moderat"))
    ).toBe(true);
  });

  it("minimum age 18 is accepted", () => {
    expect(() =>
      estimateMaleBodyFat({ age: 18, heightCm: 175, weightKg: 70 })
    ).not.toThrow();
  });

  it("maximum age 90 is accepted", () => {
    expect(() =>
      estimateMaleBodyFat({ age: 90, heightCm: 170, weightKg: 75 })
    ).not.toThrow();
  });

  it("all intermediate formula values are present and rounded to 2 decimals", () => {
    const result = estimateMaleBodyFat({
      age: 40,
      heightCm: 180,
      weightKg: 85,
      waistCm: 92,
    });
    // Round-trip: re-rounding should not change the value
    expect(result.bmi).toBe(Math.round(result.bmi * 100) / 100);
    expect(result.rfm).toBe(Math.round(result.rfm! * 100) / 100);
    expect(result.cunBae).toBe(Math.round(result.cunBae! * 100) / 100);
    expect(result.deurenberg).toBe(Math.round(result.deurenberg! * 100) / 100);
  });

  it("pointEstimate is rounded to 1 decimal", () => {
    const result = estimateMaleBodyFat({
      age: 40, heightCm: 180, weightKg: 85, waistCm: 92,
    });
    expect(result.pointEstimate).toBe(Math.round(result.pointEstimate * 10) / 10);
  });

  it("rangeMin < pointEstimate < rangeMax", () => {
    const result = estimateMaleBodyFat({
      age: 40, heightCm: 180, weightKg: 85, waistCm: 92,
    });
    expect(result.rangeMin).toBeLessThan(result.pointEstimate);
    expect(result.rangeMax).toBeGreaterThan(result.pointEstimate);
  });

  it("always populates drivers and notes arrays (may be empty)", () => {
    const result = estimateMaleBodyFat({
      age: 35, heightCm: 175, weightKg: 78,
    });
    expect(Array.isArray(result.drivers)).toBe(true);
    expect(Array.isArray(result.notes)).toBe(true);
  });
});
