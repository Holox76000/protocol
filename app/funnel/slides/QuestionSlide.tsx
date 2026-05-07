"use client";

import React from "react";
import Image from "next/image";
import type { SingleSlide, MultiSlide, Answers } from "../funnel-config";
import styles from "./slides.module.css";

function parseEm(text: string): React.ReactNode {
  const parts = text.split(/(\*[^*]+\*)/g);
  return parts.map((part, i) =>
    part.startsWith("*") && part.endsWith("*")
      ? <em key={i} style={{ fontStyle: "italic", color: "var(--q-soft)" }}>{part.slice(1, -1)}</em>
      : part
  );
}

// ── Single Select ─────────────────────────────────────────

type SingleProps = {
  slide: SingleSlide;
  answers: Answers;
  onAnswer: (key: string, value: string) => void;
  onNext: () => void;
  onBack: () => void;
};

const EYEBROWS: Record<string, string> = {
  age_bracket: "01 · Profile",
  ethnicity: "02 · Reference points",
  morphology: "03 · Composition",
  shape_impact: "04 · Impact",
  pain_timeline: "05 · Duration",
  weekly_time: "07 · Schedule",
  social_environment: "08 · Context",
};

export function SingleQuestion({ slide, answers, onAnswer, onNext, onBack }: SingleProps) {
  const selected = (answers[slide.stateKey] as string) ?? "";

  const handleSelect = (option: string) => {
    onAnswer(slide.stateKey, option);
    setTimeout(onNext, 150);
  };

  const eyebrow = EYEBROWS[slide.stateKey];
  const resolvedImages = typeof slide.images === "function"
    ? slide.images(answers)
    : slide.images;
  const isYesNo = !resolvedImages && slide.options.length === 2;

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
        <h2 className={styles.question}>{parseEm(slide.question)}</h2>
        {slide.subtext && <p className={styles.subtext}>{slide.subtext}</p>}
      </div>

      {resolvedImages ? (
        <div className={styles.imageGrid} data-count={slide.options.length}>
          {slide.options.map((option, i) => {
            const isSelected = selected === option;
            return (
              <button
                key={option}
                type="button"
                className={`${styles.imageCard} ${isSelected ? styles.imageCardSelected : ""} ${!resolvedImages[i] ? styles.imageCardText : ""}`}
                onClick={() => handleSelect(option)}
              >
                {resolvedImages[i] ? (
                  <>
                    <Image
                      src={resolvedImages[i]}
                      alt={option}
                      fill
                      className="object-cover object-top"
                      sizes="(max-width: 720px) 50vw, 25vw"
                    />
                    <div className={styles.imageCardGradient} />
                  </>
                ) : null}
                <span className={styles.imageCardLabel}>{option}</span>
                <span className={styles.imageCardCheck}>✓</span>
              </button>
            );
          })}
        </div>
      ) : isYesNo ? (
        <div className={styles.ynGrid}>
          {slide.options.map((option) => (
            <button
              key={option}
              type="button"
              className={styles.ynBtn}
              onClick={() => handleSelect(option)}
            >
              {option}
            </button>
          ))}
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
        <aside className={styles.contextNote}>
          <div>
            <p className={styles.contextNoteLabel}>Why we ask</p>
            <p style={{ margin: 0 }}>{slide.whyWeAsk}</p>
          </div>
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

const MULTI_EYEBROWS: Record<string, string> = {
  expected_results: "06 · Targets",
  past_solutions: "14 · Background",
};

export function MultiQuestion({ slide, answers, onAnswer, onNext, onBack }: MultiProps) {
  const selected = (answers[slide.stateKey] as string[]) ?? [];
  const canAdvance = selected.length > 0;
  const eyebrow = MULTI_EYEBROWS[slide.stateKey];

  const toggle = (option: string) => {
    const next = selected.includes(option)
      ? selected.filter((o) => o !== option)
      : [...selected, option];
    onAnswer(slide.stateKey, next);
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
        <h2 className={styles.question}>{parseEm(slide.question)}</h2>
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
            {option}
            <span className={`${styles.optionCheck} ${selected.includes(option) ? styles.optionCheckActive : ""}`} aria-hidden="true" />
          </button>
        ))}
      </div>

      <p className={styles.multiCounter}>
        <strong>{selected.length}</strong> selected · pick at least 1
      </p>

      {slide.whyWeAsk && (
        <aside className={styles.contextNote}>
          <div>
            <p className={styles.contextNoteLabel}>Category note</p>
            <p style={{ margin: 0 }}>{slide.whyWeAsk}</p>
          </div>
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
          Continue →
        </button>
      </div>
    </div>
  );
}
