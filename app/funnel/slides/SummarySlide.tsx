"use client";

import Image from "next/image";
import { useState } from "react";
import type { Answers } from "../funnel-config";
import styles from "./slides.module.css";

const AGE_KEY: Record<string, string> = {
  "20–29": "20-29", "30–39": "30-39", "40–49": "40-49", "50+": "50plus",
};
const ETH_KEY: Record<string, string> = {
  "Caucasian": "caucasian", "Black": "black", "Asian (East / SE)": "asian-east-se",
  "South Asian": "south-asian", "Hispanic-Latino": "hispanic-latino", "MENA": "mena",
};
const MORPH_KEY: Record<string, string> = {
  "Skinny": "skinny", "Skinny-fat": "skinny-fat", "Overweight": "overweight", "Average": "average",
};

type Props = {
  answers: Answers;
  onNext: () => void;
  onBack: () => void;
};

function computePotential(answers: Answers): { label: string; caption: string; pct: number; levelClass: string; fillClass: string } {
  const morphology = (answers.morphology as string) ?? "";
  const timeline = (answers.pain_timeline as string) ?? "";
  const isHighGap = morphology.includes("Skinny-fat") || morphology.includes("Overweight");
  const isLongTimeline = timeline.includes("Over a year") || timeline.includes("past year");

  if (isHighGap && isLongTimeline)
    return { label: "HIGH", caption: "Significant structural gap identified. Rapid gains expected.", pct: 82, levelClass: styles.gaugeLevelHigh, fillClass: styles.gaugeFillHigh };
  if (isHighGap || isLongTimeline)
    return { label: "MEDIUM–HIGH", caption: "Clear structural levers available for improvement.", pct: 64, levelClass: styles.gaugeLevelMed, fillClass: styles.gaugeFillMed };
  return { label: "MEDIUM", caption: "Solid baseline with targeted gains available.", pct: 48, levelClass: styles.gaugeLevelLow, fillClass: styles.gaugeFillLow };
}

function formatHeight(answers: Answers): string {
  const unit = answers.height_unit as string;
  if (unit === "ft") {
    const ft = answers.height_ft as string;
    const inches = (answers.height_in as string) ?? "0";
    return ft ? `${ft}'${inches}"` : "—";
  }
  const cm = answers.height_cm as string;
  return cm ? `${cm} cm` : "—";
}

function formatWeight(answers: Answers): string {
  const val = answers.weight_value as string;
  const unit = (answers.weight_unit as string) ?? "kg";
  return val ? `${val} ${unit}` : "—";
}

const ROOM: Record<string, string> = {
  Skinny: "Build mass",
  "Skinny-fat": "Recomposition",
  Overweight: "Body composition",
  Average: "Symmetry & posture",
};

export function SummarySlide({ answers, onNext, onBack }: Props) {
  const potential = computePotential(answers);
  const morphology = (answers.morphology as string) ?? "—";
  const environment = (answers.social_environment as string) ?? "—";

  const age = AGE_KEY[answers.age_bracket as string] ?? "20-29";
  const eth = ETH_KEY[answers.ethnicity as string] ?? "caucasian";
  const morph = MORPH_KEY[morphology] ?? "average";
  const morphologySrc = `/assets/funnel/morphology/${age}-${eth}-${morph}.png`;
  const photoPath = answers._photo_path as string | undefined;
  const beforeUrl = photoPath ? (answers._before_url as string | undefined) : undefined;
  const [imgSrc, setImgSrc] = useState(beforeUrl ?? morphologySrc);
  const dreamGoals = answers.dream_outcome as string | undefined;
  const primaryGoal = dreamGoals && dreamGoals.trim().length > 0
    ? (dreamGoals.length > 60 ? `${dreamGoals.slice(0, 57)}...` : dreamGoals)
    : "Recomposition";

  const chips = [
    { label: "Age", value: answers.age_bracket as string },
    { label: "Ethnicity", value: answers.ethnicity as string },
    { label: "Height", value: formatHeight(answers) },
    { label: "Weight", value: formatWeight(answers) },
  ].filter(c => c.value && c.value !== "—");

  const stats = [
    { label: "Body type", value: morphology },
    { label: "Room for improvement", value: ROOM[morphology] ?? "Recomposition" },
    { label: "Primary goal", value: primaryGoal },
    { label: "Social context", value: environment },
  ];

  return (
    <div className={styles.card}>
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <div className={styles.summaryHeader} style={{ flex: 1 }}>
          <p className={styles.eyebrow}>15 · Diagnostic</p>
          <h2 className={styles.summaryTitle}>Summary of your Physical Profile.</h2>
        </div>
        <div className={styles.summaryPhotoWrap}>
          <Image
            src={imgSrc}
            alt={morphology}
            fill
            className="object-cover object-top"
            sizes="120px"
            onError={() => { if (imgSrc !== morphologySrc) setImgSrc(morphologySrc); }}
          />
        </div>
      </div>

      {/* Chips */}
      <div className={styles.recapChips}>
        {chips.map(c => (
          <span key={c.label} className={styles.recapChip}>
            <span className={styles.recapChipLabel}>{c.label}</span>
            <strong>{c.value}</strong>
          </span>
        ))}
      </div>

      {/* Gauge */}
      <div className={styles.gaugeBlock}>
        <div className={styles.gaugeHead}>
          <span className={styles.gaugeLabel}>Attractiveness potential</span>
          <span className={`${styles.gaugeLevel} ${potential.levelClass}`}>{potential.label}</span>
        </div>
        <div className={styles.gaugeBar}>
          <div className={`${styles.gaugeBarFill} ${potential.fillClass}`} style={{ width: `${potential.pct}%` }} />
        </div>
        <p className={styles.gaugeCaption}>{potential.caption}</p>
      </div>

      {/* 2×2 stat grid */}
      <div className={styles.recapStatGrid}>
        {stats.map(s => (
          <div key={s.label} className={styles.recapStatCell}>
            <div className={styles.recapStatLabel}>{s.label}</div>
            <div className={styles.recapStatValue}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.btnSecondary} onClick={onBack}>Back</button>
        <button type="button" className={styles.btnPrimary} onClick={onNext}>See my Protocol method →</button>
      </div>
    </div>
  );
}
