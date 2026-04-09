"use client";

import { useState } from "react";
import type { SectionProps } from "../QuestionnaireFlow";
import { SectionHeader, Field, SectionFooter, CardSelect } from "./shared";

const WEIGHT_TREND_OPTIONS = [
  { value: "stable", label: "Stable — within 2 kg" },
  { value: "slight_gain", label: "Slight gain — 2–5 kg up" },
  { value: "significant_gain", label: "Significant gain — more than 5 kg up" },
  { value: "slight_loss", label: "Slight loss — 2–5 kg down" },
  { value: "significant_loss", label: "Significant loss — more than 5 kg down" },
  { value: "yoyo", label: "Up and down — inconsistent" },
];

function feetInchesToCm(ft: number, inches: number): number {
  return Math.round((ft * 30.48) + (inches * 2.54));
}

function cmToFeetInches(cm: number): { ft: number; inches: number } {
  const totalInches = cm / 2.54;
  return { ft: Math.floor(totalInches / 12), inches: Math.round(totalInches % 12) };
}

function lbsToKg(lbs: number): number {
  return Math.round((lbs / 2.20462) * 10) / 10;
}

function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462);
}

function inchesToCm(inches: number): number {
  return Math.round(inches * 2.54);
}

function cmToInches(cm: number): number {
  return Math.round(cm / 2.54);
}

export default function S3Biometrics({ answers, setAnswer, onNext, onBack, saving, serverError }: SectionProps) {
  const [error, setError] = useState<string | null>(null);
  const [heightUnit, setHeightUnit] = useState<"cm" | "imperial">("cm");
  const [weightUnit, setWeightUnit] = useState<"kg" | "lbs">("kg");
  const [waistUnit, setWaistUnit] = useState<"cm" | "in">("cm");

  // Display values derived from stored metric values
  const heightCm = answers.height_cm ?? 0;
  const heightFt = heightCm ? cmToFeetInches(heightCm).ft : undefined;
  const heightIn = heightCm ? cmToFeetInches(heightCm).inches : undefined;

  const weightKg = answers.weight_kg ?? 0;

  const waistCm = answers.waist_circumference_cm ?? 0;

  const handleNext = () => {
    if (!answers.height_cm) return setError("Please enter your height.");
    if (answers.height_cm < 130 || answers.height_cm > 230) return setError("Height must be between 130 and 230 cm.");
    if (!answers.weight_kg) return setError("Please enter your weight.");
    if (answers.weight_kg < 40 || answers.weight_kg > 200) return setError("Weight must be between 40 and 200 kg.");
    if (!answers.weight_trend_6mo) return setError("Please select your weight trend.");
    if (answers.waist_circumference_cm && (answers.waist_circumference_cm < 50 || answers.waist_circumference_cm > 160)) return setError("Waist must be between 50 and 160 cm.");
    setError(null);
    onNext();
  };

  return (
    <div>
      <SectionHeader
        eyebrow="Section 3 — Biometrics"
        title="Your measurements."
        subtitle="These numbers are the foundation of your proportion analysis. Measure before filling this in if you can."
      />

      <div className="flex flex-col gap-8">
        {/* Height */}
        <Field label="What's your height?" required>
          <div className="flex items-center gap-2 mb-2">
            {(["cm", "imperial"] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setHeightUnit(u)}
                className={`rounded-full px-3 py-1 text-[12px] font-semibold transition ${
                  heightUnit === u ? "bg-black text-white" : "bg-black/8 text-ink/60 hover:bg-black/15"
                }`}
              >
                {u === "cm" ? "cm" : "ft / in"}
              </button>
            ))}
          </div>
          {heightUnit === "cm" ? (
            <input
              type="number"
              placeholder="180"
              min={130}
              max={230}
              value={heightCm || ""}
              onChange={(e) => setAnswer("height_cm", e.target.value ? Number(e.target.value) : undefined)}
              className="w-full rounded-xl border border-black/12 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink/30 focus:border-black focus:outline-none"
            />
          ) : (
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="5"
                min={4}
                max={7}
                value={heightFt ?? ""}
                onChange={(e) => {
                  const ft = Number(e.target.value);
                  const inches = heightIn ?? 0;
                  setAnswer("height_cm", feetInchesToCm(ft, inches));
                }}
                className="w-full rounded-xl border border-black/12 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink/30 focus:border-black focus:outline-none"
              />
              <span className="self-center text-sm text-ink/40">ft</span>
              <input
                type="number"
                placeholder="11"
                min={0}
                max={11}
                value={heightIn ?? ""}
                onChange={(e) => {
                  const inches = Number(e.target.value);
                  const ft = heightFt ?? 0;
                  setAnswer("height_cm", feetInchesToCm(ft, inches));
                }}
                className="w-full rounded-xl border border-black/12 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink/30 focus:border-black focus:outline-none"
              />
              <span className="self-center text-sm text-ink/40">in</span>
            </div>
          )}
        </Field>

        {/* Weight */}
        <Field label="What's your current weight?" required>
          <div className="flex items-center gap-2 mb-2">
            {(["kg", "lbs"] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setWeightUnit(u)}
                className={`rounded-full px-3 py-1 text-[12px] font-semibold transition ${
                  weightUnit === u ? "bg-black text-white" : "bg-black/8 text-ink/60 hover:bg-black/15"
                }`}
              >
                {u}
              </button>
            ))}
          </div>
          <input
            type="number"
            placeholder={weightUnit === "kg" ? "78" : "172"}
            min={weightUnit === "kg" ? 40 : 88}
            max={weightUnit === "kg" ? 200 : 440}
            value={weightUnit === "kg" ? (weightKg || "") : (weightKg ? kgToLbs(weightKg) : "")}
            onChange={(e) => {
              const val = Number(e.target.value);
              setAnswer("weight_kg", e.target.value ? (weightUnit === "kg" ? val : lbsToKg(val)) : undefined);
            }}
            className="w-full rounded-xl border border-black/12 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink/30 focus:border-black focus:outline-none"
          />
        </Field>

        {/* Weight trend */}
        <Field label="How has your weight changed over the last 6 months?" required>
          <CardSelect
            value={answers.weight_trend_6mo}
            onChange={(v) => setAnswer("weight_trend_6mo", v)}
            options={WEIGHT_TREND_OPTIONS}
          />
        </Field>

        {/* Waist */}
        <Field label="What's your waist circumference?" sublabel="Measure around your navel with a tape measure. Standing relaxed, not sucking in. Optional — but recommended for a more precise protocol.">
          <div className="flex items-center gap-2 mb-2">
            {(["cm", "in"] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setWaistUnit(u)}
                className={`rounded-full px-3 py-1 text-[12px] font-semibold transition ${
                  waistUnit === u ? "bg-black text-white" : "bg-black/8 text-ink/60 hover:bg-black/15"
                }`}
              >
                {u}
              </button>
            ))}
          </div>
          <input
            type="number"
            placeholder={waistUnit === "cm" ? "85" : "33"}
            min={waistUnit === "cm" ? 50 : 20}
            max={waistUnit === "cm" ? 160 : 63}
            value={waistUnit === "cm" ? (waistCm || "") : (waistCm ? cmToInches(waistCm) : "")}
            onChange={(e) => {
              const val = Number(e.target.value);
              setAnswer("waist_circumference_cm", e.target.value ? (waistUnit === "cm" ? val : inchesToCm(val)) : undefined);
            }}
            className="w-full rounded-xl border border-black/12 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink/30 focus:border-black focus:outline-none"
          />
        </Field>
      </div>

      <SectionFooter
        onNext={handleNext}
        onBack={onBack}
        saving={saving}
        error={error ?? serverError}
      />
    </div>
  );
}
