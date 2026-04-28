"use client";

import { useState } from "react";
import type { NumericHeightSlide, NumericWeightSlide, Answers } from "../funnel-config";
import styles from "./slides.module.css";

// ── Height ────────────────────────────────────────────────

type HeightProps = {
  slide: NumericHeightSlide;
  answers: Answers;
  onAnswer: (updates: Record<string, string>) => void;
  onNext: () => void;
  onBack: () => void;
};

export function HeightSlide({ slide, answers, onAnswer, onNext, onBack }: HeightProps) {
  const [unit, setUnit] = useState<"cm" | "ft">((answers.height_unit as "cm" | "ft") ?? "cm");
  const [cm, setCmVal] = useState(Number(answers.height_cm) || 178);

  const ft = Math.floor(cm / 30.48);
  const inches = Math.round((cm / 2.54) - ft * 12);

  const updateCm = (v: number) => {
    const clamped = Math.max(140, Math.min(220, v));
    setCmVal(clamped);
    if (unit === "cm") {
      onAnswer({ height_unit: "cm", height_cm: String(clamped) });
    } else {
      const f = Math.floor(clamped / 30.48);
      const i = Math.round((clamped / 2.54) - f * 12);
      onAnswer({ height_unit: "ft", height_ft: String(f), height_in: String(i) });
    }
  };

  const switchUnit = (u: "cm" | "ft") => {
    setUnit(u);
    if (u === "cm") {
      onAnswer({ height_unit: "cm", height_cm: String(cm) });
    } else {
      onAnswer({ height_unit: "ft", height_ft: String(ft), height_in: String(inches) });
    }
  };

  const displayVal = unit === "cm" ? `${cm}` : `${ft}'${inches}"`;
  const displayUnit = unit === "cm" ? "cm" : "";

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <p className={styles.eyebrow}>09 · Structure</p>
        <h2 className={styles.question}>{slide.question}</h2>
        <p className={styles.subtext}>{slide.subtext}</p>
      </div>

      <div className={styles.unitToggle}>
        <button
          type="button"
          className={`${styles.unitBtn} ${unit === "cm" ? styles.unitBtnActive : ""}`}
          onClick={() => switchUnit("cm")}
        >
          cm
        </button>
        <button
          type="button"
          className={`${styles.unitBtn} ${unit === "ft" ? styles.unitBtnActive : ""}`}
          onClick={() => switchUnit("ft")}
        >
          ft / in
        </button>
      </div>

      <div className={styles.numBlock}>
        <div className={styles.numDisplay}>
          {displayVal}
          {displayUnit && <span className={styles.numDisplayUnit}>{displayUnit}</span>}
        </div>
        <div className={styles.numStepper}>
          <button type="button" className={styles.numStepBtn} onClick={() => updateCm(cm - 1)}>−</button>
          <button type="button" className={styles.numStepBtn} onClick={() => updateCm(cm + 1)}>+</button>
        </div>
        <input
          type="range"
          className={styles.numSlider}
          min={140}
          max={220}
          value={cm}
          onChange={(e) => updateCm(Number(e.target.value))}
        />
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.btnSecondary} onClick={onBack}>
          Back
        </button>
        <button type="button" className={styles.btnPrimary} onClick={onNext}>
          Continue →
        </button>
      </div>
    </div>
  );
}

// ── Weight ────────────────────────────────────────────────

type WeightProps = {
  slide: NumericWeightSlide;
  answers: Answers;
  onAnswer: (updates: Record<string, string>) => void;
  onNext: () => void;
  onBack: () => void;
};

export function WeightSlide({ slide, answers, onAnswer, onNext, onBack }: WeightProps) {
  const [unit, setUnit] = useState<"kg" | "lbs">((answers.weight_unit as "kg" | "lbs") ?? "kg");
  const [kg, setKgVal] = useState(Number(answers.weight_value) || 78);

  const lbs = Math.round(kg * 2.2046);

  const updateKg = (v: number) => {
    const clamped = Math.max(40, Math.min(200, v));
    setKgVal(clamped);
    const displayVal = unit === "kg" ? String(clamped) : String(Math.round(clamped * 2.2046));
    onAnswer({ weight_unit: unit, weight_value: displayVal, weight_kg: String(clamped) });
  };

  const switchUnit = (u: "kg" | "lbs") => {
    setUnit(u);
    const displayVal = u === "kg" ? String(kg) : String(lbs);
    onAnswer({ weight_unit: u, weight_value: displayVal, weight_kg: String(kg) });
  };

  const displayVal = unit === "kg" ? kg : lbs;

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <p className={styles.eyebrow}>10 · Composition baseline</p>
        <h2 className={styles.question}>{slide.question}</h2>
        <p className={styles.subtext}>{slide.subtext}</p>
      </div>

      <div className={styles.unitToggle}>
        <button
          type="button"
          className={`${styles.unitBtn} ${unit === "kg" ? styles.unitBtnActive : ""}`}
          onClick={() => switchUnit("kg")}
        >
          kg
        </button>
        <button
          type="button"
          className={`${styles.unitBtn} ${unit === "lbs" ? styles.unitBtnActive : ""}`}
          onClick={() => switchUnit("lbs")}
        >
          lbs
        </button>
      </div>

      <div className={styles.numBlock}>
        <div className={styles.numDisplay}>
          {displayVal}
          <span className={styles.numDisplayUnit}>{unit}</span>
        </div>
        <div className={styles.numStepper}>
          <button type="button" className={styles.numStepBtn} onClick={() => updateKg(kg - 1)}>−</button>
          <button type="button" className={styles.numStepBtn} onClick={() => updateKg(kg + 1)}>+</button>
        </div>
        <input
          type="range"
          className={styles.numSlider}
          min={40}
          max={200}
          value={kg}
          onChange={(e) => updateKg(Number(e.target.value))}
        />
      </div>

      <div className={styles.privacyBadge}>
        🔒 Never shared externally
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.btnSecondary} onClick={onBack}>
          Back
        </button>
        <button type="button" className={styles.btnPrimary} onClick={onNext}>
          Continue →
        </button>
      </div>
    </div>
  );
}
