"use client";

import type { StatSlide as StatSlideConfig, Answers } from "../funnel-config";
import styles from "./slides.module.css";

type Props = {
  slide: StatSlideConfig;
  answers: Answers;
  onNext: () => void;
  onBack: () => void;
};

export function StatSlide({ slide, answers, onNext, onBack }: Props) {
  const age = (answers.age_bracket as string) ?? "";

  return (
    <div className={styles.card}>
      <div className={styles.statGiant}>
        <span className={styles.statGiantCaption}>Reference data</span>
        <p className={styles.statGiantNumber}>{slide.stat}</p>
        <span style={{
          fontFamily: '"JetBrains Mono", "SF Mono", ui-monospace, monospace',
          fontSize: 11,
          letterSpacing: '0.08em',
          textTransform: 'uppercase' as const,
          color: 'var(--q-soft)',
        }}>
          of men aged{" "}
          <strong style={{ color: 'var(--q-strong)', fontWeight: 500 }}>
            {age || slide.statLabel}
          </strong>
        </span>
        <h2 className={styles.statGiantHeadline}>{slide.headline}</h2>
        {slide.source && (
          <p className={styles.statGiantSource}>{slide.source}</p>
        )}
      </div>

      <div className={styles.actionsInline}>
        <button type="button" className={styles.btnPrimary} onClick={onNext}>
          I see myself in this →
        </button>
      </div>
    </div>
  );
}
