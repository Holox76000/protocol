"use client";

import styles from "./slides.module.css";

type Props = {
  onNext: () => void;
};

export function IntroSlide({ onNext }: Props) {
  return (
    <div className={styles.card}>
      <div className={styles.introInner}>
        <p className={styles.eyebrow}>Attractiveness Diagnostic</p>
        <h1 className={styles.introTitle}>
          Find out exactly where you stand.
        </h1>
        <p className={styles.introBody}>
          A 3-minute science-based assessment that maps your appearance across 18 data points — and tells you what to fix first.
        </p>
        <div className={styles.introStats}>
          <div className={styles.introStatItem}>
            <span className={styles.introStatValue}>2,500+</span>
            <span className={styles.introStatLabel}>men assessed</span>
          </div>
          <div className={styles.introStatDivider} />
          <div className={styles.introStatItem}>
            <span className={styles.introStatValue}>4 yrs</span>
            <span className={styles.introStatLabel}>of R&D</span>
          </div>
          <div className={styles.introStatDivider} />
          <div className={styles.introStatItem}>
            <span className={styles.introStatValue}>100+</span>
            <span className={styles.introStatLabel}>data points</span>
          </div>
        </div>
      </div>

      <div className={styles.actionsFull}>
        <button type="button" className={styles.btnPrimary} onClick={onNext}>
          Start the assessment →
        </button>
      </div>
    </div>
  );
}
