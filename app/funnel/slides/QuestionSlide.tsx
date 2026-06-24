"use client";

import React, { useRef, useState } from "react";
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
  pain_timeline: "04 · Duration",
  weekly_time: "06 · Schedule",
  social_environment: "07 · Context",
};

const CUSTOM_SENTINEL = "__custom__";

export function SingleQuestion({ slide, answers, onAnswer, onNext, onBack }: SingleProps) {
  const selected = (answers[slide.stateKey] as string) ?? "";
  const isCustomSelected = slide.allowCustom && selected !== "" && !slide.options.includes(selected);
  const [customText, setCustomText] = useState(isCustomSelected ? selected : "");
  const [showCustom, setShowCustom] = useState(isCustomSelected);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSelect = (option: string) => {
    if (option === CUSTOM_SENTINEL) {
      setShowCustom(true);
      setTimeout(() => inputRef.current?.focus(), 50);
      return;
    }
    setShowCustom(false);
    onAnswer(slide.stateKey, option);
    setTimeout(onNext, 150);
  };

  const handleCustomContinue = () => {
    const trimmed = customText.trim();
    if (!trimmed) return;
    onAnswer(slide.stateKey, trimmed);
    setTimeout(onNext, 150);
  };

  const effectiveSelected = showCustom ? CUSTOM_SENTINEL : selected;

  const eyebrow = EYEBROWS[slide.stateKey];
  const resolvedImages = typeof slide.images === "function"
    ? slide.images(answers)
    : slide.images;
  const isYesNo = !resolvedImages && slide.options.length === 2 && !slide.allowCustom;

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
              className={`${styles.option} ${effectiveSelected === option ? styles.optionSelected : ""}`}
              onClick={() => handleSelect(option)}
            >
              {option}
            </button>
          ))}
          {slide.allowCustom && (
            <button
              type="button"
              className={`${styles.option} ${effectiveSelected === CUSTOM_SENTINEL ? styles.optionSelected : ""}`}
              onClick={() => handleSelect(CUSTOM_SENTINEL)}
            >
              Other — write yours
            </button>
          )}
        </div>
      )}

      {showCustom && (
        <div className={styles.customInputWrap}>
          <textarea
            ref={inputRef}
            className={styles.customInput}
            placeholder="Describe your context…"
            value={customText}
            rows={3}
            onChange={(e) => setCustomText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleCustomContinue();
              }
            }}
          />
          <div className={styles.actions}>
            <button type="button" className={styles.btnSecondary} onClick={onBack}>Back</button>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={handleCustomContinue}
              disabled={!customText.trim()}
            >
              Continue →
            </button>
          </div>
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
  // Detect if a previously-saved custom value exists (not in the fixed options list)
  const savedCustom = selected.find((s) => !slide.options.includes(s)) ?? "";
  const [showCustom, setShowCustom] = useState(savedCustom !== "");
  const [customText, setCustomText] = useState(savedCustom);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // The fixed options that are selected (excludes any custom value)
  const fixedSelected = selected.filter((s) => slide.options.includes(s));
  const customIsActive = showCustom && customText.trim() !== "";
  const totalCount = fixedSelected.length + (customIsActive ? 1 : 0);
  const canAdvance = totalCount > 0;
  const eyebrow = MULTI_EYEBROWS[slide.stateKey];

  const toggle = (option: string) => {
    const next = fixedSelected.includes(option)
      ? fixedSelected.filter((o) => o !== option)
      : [...fixedSelected, option];
    onAnswer(slide.stateKey, customIsActive ? [...next, customText.trim()] : next);
  };

  const toggleCustom = () => {
    if (showCustom) {
      // Deselect: remove custom value from answers
      setShowCustom(false);
      setCustomText("");
      onAnswer(slide.stateKey, fixedSelected);
    } else {
      setShowCustom(true);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleCustomChange = (text: string) => {
    setCustomText(text);
    onAnswer(slide.stateKey, text.trim() ? [...fixedSelected, text.trim()] : fixedSelected);
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
            className={`${styles.option} ${fixedSelected.includes(option) ? styles.optionSelected : ""}`}
            onClick={() => toggle(option)}
          >
            {option}
            <span className={`${styles.optionCheck} ${fixedSelected.includes(option) ? styles.optionCheckActive : ""}`} aria-hidden="true" />
          </button>
        ))}
        {slide.allowCustom && (
          <button
            type="button"
            className={`${styles.option} ${showCustom ? styles.optionSelected : ""}`}
            onClick={toggleCustom}
          >
            Other — write yours
            <span className={`${styles.optionCheck} ${showCustom ? styles.optionCheckActive : ""}`} aria-hidden="true" />
          </button>
        )}
      </div>

      {showCustom && (
        <div className={styles.customInputWrap}>
          <textarea
            ref={inputRef}
            className={styles.customInput}
            placeholder="Describe the image you want to project…"
            value={customText}
            rows={3}
            onChange={(e) => handleCustomChange(e.target.value)}
          />
        </div>
      )}

      <p className={styles.multiCounter}>
        <strong>{totalCount}</strong> selected · pick at least 1
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
