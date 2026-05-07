"use client";

import type { AdVariant } from "../../../lib/ad-variants";
import { DEFAULT_VARIANT } from "../../../lib/ad-variants";
import styles from "./slides.module.css";

type Props = {
  onNext: () => void;
  variant?: AdVariant;
};

export function IntroSlide({ onNext, variant }: Props) {
  const v = variant ?? DEFAULT_VARIANT;
  return (
    <div className={styles.card}>
      <div className={styles.introInner}>
        {v.badge && <p className={styles.eyebrow}>{v.badge}</p>}
        <h1 className={styles.introTitle}>{v.headline}</h1>
        <p className={styles.introBody}>{v.subtext}</p>
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
          {v.cta ?? "Start the assessment →"}
        </button>
      </div>
    </div>
  );
}
