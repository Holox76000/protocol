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
  const [cm, setCm] = useState((answers.height_cm as string) ?? "");
  const [ft, setFt] = useState((answers.height_ft as string) ?? "");
  const [inches, setInches] = useState((answers.height_in as string) ?? "");

  const canAdvance = unit === "cm" ? cm !== "" : ft !== "";

  const commit = () => {
    if (unit === "cm") {
      onAnswer({ height_unit: "cm", height_cm: cm });
    } else {
      onAnswer({ height_unit: "ft", height_ft: ft, height_in: inches || "0" });
    }
    onNext();
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.question}>{slide.question}</h2>
        <p className={styles.subtext}>{slide.subtext}</p>
      </div>

      <div className={styles.unitToggle}>
        <button
          type="button"
          className={`${styles.unitBtn} ${unit === "cm" ? styles.unitBtnActive : ""}`}
          onClick={() => setUnit("cm")}
        >
          cm
        </button>
        <button
          type="button"
          className={`${styles.unitBtn} ${unit === "ft" ? styles.unitBtnActive : ""}`}
          onClick={() => setUnit("ft")}
        >
          ft / in
        </button>
      </div>

      {unit === "cm" ? (
        <div className={styles.numericRow}>
          <input
            type="number"
            className={styles.numericInput}
            placeholder="e.g. 180"
            min={100}
            max={250}
            value={cm}
            onChange={(e) => {
              setCm(e.target.value);
              onAnswer({ height_unit: "cm", height_cm: e.target.value });
            }}
          />
          <span className={styles.numericUnit}>cm</span>
        </div>
      ) : (
        <div className={styles.numericRow}>
          <input
            type="number"
            className={`${styles.numericInput} ${styles.numericInputShort}`}
            placeholder="5"
            min={3}
            max={8}
            value={ft}
            onChange={(e) => {
              setFt(e.target.value);
              onAnswer({ height_unit: "ft", height_ft: e.target.value, height_in: inches || "0" });
            }}
          />
          <span className={styles.numericUnit}>ft</span>
          <input
            type="number"
            className={`${styles.numericInput} ${styles.numericInputShort}`}
            placeholder="11"
            min={0}
            max={11}
            value={inches}
            onChange={(e) => {
              setInches(e.target.value);
              onAnswer({ height_unit: "ft", height_ft: ft, height_in: e.target.value });
            }}
          />
          <span className={styles.numericUnit}>in</span>
        </div>
      )}

      <div className={styles.actions}>
        <button type="button" className={styles.btnSecondary} onClick={onBack}>
          Back
        </button>
        <button
          type="button"
          className={styles.btnPrimary}
          onClick={commit}
          disabled={!canAdvance}
        >
          Continue
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
  const [value, setValue] = useState((answers.weight_value as string) ?? "");

  const canAdvance = value !== "";

  const commit = () => {
    onAnswer({ weight_unit: unit, weight_value: value });
    onNext();
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.question}>{slide.question}</h2>
        <p className={styles.subtext}>{slide.subtext}</p>
      </div>

      <div className={styles.unitToggle}>
        <button
          type="button"
          className={`${styles.unitBtn} ${unit === "kg" ? styles.unitBtnActive : ""}`}
          onClick={() => setUnit("kg")}
        >
          kg
        </button>
        <button
          type="button"
          className={`${styles.unitBtn} ${unit === "lbs" ? styles.unitBtnActive : ""}`}
          onClick={() => setUnit("lbs")}
        >
          lbs
        </button>
      </div>

      <div className={styles.numericRow}>
        <input
          type="number"
          className={styles.numericInput}
          placeholder={unit === "kg" ? "e.g. 80" : "e.g. 176"}
          min={unit === "kg" ? 30 : 66}
          max={unit === "kg" ? 300 : 660}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            onAnswer({ weight_unit: unit, weight_value: e.target.value });
          }}
        />
        <span className={styles.numericUnit}>{unit}</span>
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.btnSecondary} onClick={onBack}>
          Back
        </button>
        <button
          type="button"
          className={styles.btnPrimary}
          onClick={commit}
          disabled={!canAdvance}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
