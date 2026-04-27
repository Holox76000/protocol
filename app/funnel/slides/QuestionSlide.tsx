"use client";

import Image from "next/image";
import type { SingleSlide, MultiSlide, Answers } from "../funnel-config";
import styles from "./slides.module.css";

// ── Single Select ─────────────────────────────────────────

type SingleProps = {
  slide: SingleSlide;
  answers: Answers;
  onAnswer: (key: string, value: string) => void;
  onNext: () => void;
  onBack: () => void;
};

export function SingleQuestion({ slide, answers, onAnswer, onNext, onBack }: SingleProps) {
  const selected = (answers[slide.stateKey] as string) ?? "";

  const handleSelect = (option: string) => {
    onAnswer(slide.stateKey, option);
    setTimeout(onNext, 150);
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.question}>{slide.question}</h2>
        {slide.subtext && <p className={styles.subtext}>{slide.subtext}</p>}
      </div>

      {slide.images ? (
        <div className={styles.imageGrid}>
          {slide.options.map((option, i) => {
            const isSelected = selected === option;
            return (
              <button
                key={option}
                type="button"
                className={`${styles.imageCard} ${isSelected ? styles.imageCardSelected : ""}`}
                onClick={() => handleSelect(option)}
              >
                <Image
                  src={slide.images![i]}
                  alt={option}
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 720px) 50vw, 25vw"
                />
                <div className={styles.imageCardGradient} />
                <span className={styles.imageCardLabel}>{option}</span>
                <span className={styles.imageCardCheck}>✓</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className={styles.optionsList}>
          {slide.options.map((option) => (
            <button
              key={option}
              type="button"
              className={`${styles.option} ${selected === option ? styles.optionSelected : ""}`}
              onClick={() => handleSelect(option)}
            >
              {option}
            </button>
          ))}
        </div>
      )}

      {slide.whyWeAsk && (
        <aside className={styles.whyWeAsk}>
          <p className={styles.whyWeAskLabel}>Why we ask</p>
          <p className={styles.whyWeAskText}>{slide.whyWeAsk}</p>
        </aside>
      )}

    </div>
  );
}

// ── Multi Select ──────────────────────────────────────────

type MultiProps = {
  slide: MultiSlide;
  answers: Answers;
  onAnswer: (key: string, value: string[]) => void;
  onNext: () => void;
  onBack: () => void;
};

export function MultiQuestion({ slide, answers, onAnswer, onNext, onBack }: MultiProps) {
  const selected = (answers[slide.stateKey] as string[]) ?? [];
  const canAdvance = selected.length > 0;

  const toggle = (option: string) => {
    const next = selected.includes(option)
      ? selected.filter((o) => o !== option)
      : [...selected, option];
    onAnswer(slide.stateKey, next);
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.question}>{slide.question}</h2>
        {slide.subtext && <p className={styles.subtext}>{slide.subtext}</p>}
      </div>

      <div className={styles.optionsList}>
        {slide.options.map((option) => (
          <button
            key={option}
            type="button"
            className={`${styles.option} ${selected.includes(option) ? styles.optionSelected : ""}`}
            onClick={() => toggle(option)}
          >
            <span className={`${styles.optionCheck} ${selected.includes(option) ? styles.optionCheckActive : ""}`} aria-hidden="true" />
            {option}
          </button>
        ))}
      </div>

      {slide.whyWeAsk && (
        <aside className={styles.whyWeAsk}>
          <p className={styles.whyWeAskLabel}>Why we ask</p>
          <p className={styles.whyWeAskText}>{slide.whyWeAsk}</p>
        </aside>
      )}

      <div className={styles.actions}>
        <button type="button" className={styles.btnSecondary} onClick={onBack}>
          Back
        </button>
        <button
          type="button"
          className={styles.btnPrimary}
          onClick={onNext}
          disabled={!canAdvance}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
