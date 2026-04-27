"use client";

import type { Answers } from "../funnel-config";
import styles from "./slides.module.css";

type Props = {
  answers: Answers;
  onNext: () => void;
  onBack: () => void;
};

function computePotential(answers: Answers): { label: string; sublabel: string; pct: number; color: string } {
  const morphology = (answers.morphology as string) ?? "";
  const timeline = (answers.pain_timeline as string) ?? "";

  const isHighGap =
    morphology.includes("Skinny-fat") ||
    morphology.includes("Overweight");

  const isLongTimeline =
    timeline.includes("Over a year") ||
    timeline.includes("past year");

  if (isHighGap && isLongTimeline)
    return { label: "HIGH", sublabel: "Significant structural gap identified. Rapid gains expected.", pct: 88, color: "#c0392b" };
  if (isHighGap || isLongTimeline)
    return { label: "MEDIUM–HIGH", sublabel: "Clear structural levers available for improvement.", pct: 68, color: "#e67e22" };
  return { label: "MEDIUM", sublabel: "Solid baseline with targeted gains available.", pct: 48, color: "#27ae60" };
}

function formatHeight(answers: Answers): string {
  const unit = answers.height_unit as string;
  if (unit === "ft") {
    const ft = answers.height_ft as string;
    const inches = answers.height_in as string ?? "0";
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

function getPrimaryGoal(answers: Answers): string {
  const goals = answers.expected_results as string[];
  if (!goals || goals.length === 0) return "—";
  return goals[0];
}

export function SummarySlide({ answers, onNext, onBack }: Props) {
  const potential = computePotential(answers);
  const morphology = (answers.morphology as string) ?? "—";
  const environment = (answers.social_environment as string) ?? "—";
  const primaryGoal = getPrimaryGoal(answers);
  const weeklyTime = (answers.weekly_time as string) ?? "—";

  const stats: { icon: string; label: string; value: string }[] = [
    { icon: "◈", label: "Body type", value: morphology },
    { icon: "◎", label: "Room for improvement", value: potential.label },
    { icon: "◇", label: "Primary goal", value: primaryGoal },
    { icon: "◉", label: "Social context", value: environment },
  ];

  return (
    <div className={styles.card}>
      <div className={styles.summaryHeader}>
        <span className={styles.bsTag}>Your Attractiveness Profile</span>
        <h2 className={styles.summaryTitle}>Summary of your Physical Profile</h2>
      </div>

      {/* ── Identity chips ── */}
      <div className={styles.summaryMeta}>
        {[
          answers.age_bracket,
          answers.ethnicity,
          formatHeight(answers),
          formatWeight(answers),
        ]
          .filter((v) => v && v !== "—")
          .map((val, i) => (
            <span key={i} className={styles.summaryMetaItem}>
              {val as string}
            </span>
          ))}
      </div>

      {/* ── Potential gauge ── */}
      <div className={styles.summaryGaugeBlock}>
        <div className={styles.summaryGaugeHeader}>
          <span className={styles.summaryGaugeLabel}>Attractiveness potential</span>
          <span className={styles.summaryGaugeBadge} style={{ background: potential.color }}>
            {potential.label}
          </span>
        </div>

        <div className={styles.summaryGaugeTrack}>
          <div
            className={styles.summaryGaugeFill}
            style={{ width: `${potential.pct}%` }}
          />
          <div
            className={styles.summaryGaugeThumb}
            style={{ left: `${potential.pct}%` }}
          />
        </div>

        <div className={styles.summaryGaugeTicks}>
          <span>Low</span>
          <span>Medium</span>
          <span>High</span>
        </div>

        <div className={styles.summaryGaugeAlert}>
          <span className={styles.summaryGaugeAlertIcon} style={{ background: potential.color }}>!</span>
          <p className={styles.summaryGaugeAlertText}>
            <strong>{potential.label} potential —</strong> {potential.sublabel}
          </p>
        </div>
      </div>

      {/* ── Stat grid ── */}
      <div className={styles.summaryStatGrid}>
        {stats.map(({ icon, label, value }) => (
          <div key={label} className={styles.summaryStatCard}>
            <span className={styles.summaryStatCardIcon}>{icon}</span>
            <span className={styles.summaryStatCardLabel}>{label}</span>
            <span className={styles.summaryStatCardValue}>{value}</span>
          </div>
        ))}
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
