"use client";

import { useState } from "react";
import type { DreamOutcomeSlide as DreamOutcomeConfig, Answers } from "../funnel-config";
import styles from "./slides.module.css";

type Props = {
  slide: DreamOutcomeConfig;
  answers: Answers;
  onAnswer: (key: string, value: string) => void;
  onNext: () => void;
  onBack: () => void;
};

export function DreamOutcomeSlide({ slide, answers, onAnswer, onNext, onBack }: Props) {
  const initial = (answers[slide.stateKey] as string | undefined) ?? "";
  const [value, setValue] = useState(initial);

  const trimmed = value.trim();
  const canContinue = trimmed.length >= slide.minChars;

  const handleNext = () => {
    if (!canContinue) return;
    onAnswer(slide.stateKey, trimmed);
    onNext();
  };

  return (
    <div className={styles.card}>
      <div className={styles.dreamInner}>
        <h2 className={styles.dreamHeadline}>{slide.headline}</h2>
        <p className={styles.dreamSubtext}>{slide.subtext}</p>

        <textarea
          className={styles.dreamTextarea}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={slide.placeholder}
          rows={6}
          maxLength={800}
          autoFocus
        />

        <div className={styles.dreamMeta}>
          {trimmed.length === 0 ? (
            <span>Take your time. Honest beats clever.</span>
          ) : trimmed.length < slide.minChars ? (
            <span>{slide.minChars - trimmed.length} more characters to continue.</span>
          ) : (
            <span>{trimmed.length} characters · ready</span>
          )}
        </div>
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.btnSecondary} onClick={onBack}>
          ← Back
        </button>
        <button
          type="button"
          className={styles.btnPrimary}
          onClick={handleNext}
          disabled={!canContinue}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
