"use client";

import type { BeliefSlide as BeliefSlideConfig } from "../funnel-config";
import styles from "./slides.module.css";

const BS_VISUAL: Record<number, React.ReactNode> = {
  1: (
    <div className={styles.bsVisual1}>
      <div className={styles.bsClock}>
        <span className={styles.bsClockValue}>0.100</span>
        <span className={styles.bsClockUnit}>seconds</span>
      </div>
      <p className={styles.bsVisualCaption}>The average social judgment window</p>
    </div>
  ),
  2: (
    <div className={styles.bsVisual2}>
      <div className={styles.bsBodyZone}>
        <div className={styles.bsBodyFirst}>
          <span className={styles.bsBodyLabel}>1st</span>
          <span className={styles.bsBodySub}>Silhouette</span>
        </div>
        <div className={styles.bsBodyArrow}>→</div>
        <div className={styles.bsBodySecond}>
          <span className={styles.bsBodyLabel}>2nd</span>
          <span className={styles.bsBodySub}>Face</span>
        </div>
      </div>
      <p className={styles.bsVisualCaption}>Eye-tracking study sequence</p>
    </div>
  ),
  3: (
    <div className={styles.bsVisual3}>
      <div className={styles.bsPanel}>
        <span className={styles.bsPanelIcon}>♂</span>
        <span className={styles.bsPanelLabel}>MASS</span>
        <span className={styles.bsPanelSub}>How men read men</span>
      </div>
      <div className={styles.bsPanelDivider} />
      <div className={styles.bsPanel}>
        <span className={styles.bsPanelIcon}>♀</span>
        <span className={styles.bsPanelLabel}>RATIOS</span>
        <span className={styles.bsPanelSub}>How women read men</span>
      </div>
    </div>
  ),
  4: (
    <div className={styles.bsVisual4}>
      <div className={styles.bsRatioList}>
        {["Shoulder / Waist", "Chest / Waist", "Waist / Hip", "Upper arm / Forearm", "Leg / Torso"].map(
          (r) => (
            <div key={r} className={styles.bsRatioItem}>
              <span className={styles.bsRatioDot} />
              <span>{r}</span>
            </div>
          )
        )}
      </div>
      <div className={styles.bsRatioEq}>
        <span>= YOUR FORMULA</span>
      </div>
    </div>
  ),
};

type Props = {
  slide: BeliefSlideConfig;
  onNext: () => void;
  onBack: () => void;
};

export function BeliefSlide({ slide, onNext, onBack }: Props) {
  return (
    <div className={styles.card}>
      <div className={styles.bsHeader}>
        <span className={styles.bsTag}>Research Insight · {slide.bsNumber} of 4</span>
      </div>

      <h2 className={styles.bsHeadline}>
        {slide.headline.split("\n").map((line, i, arr) => (
          <span key={i}>
            {line}
            {i < arr.length - 1 && <br />}
          </span>
        ))}
      </h2>

      {BS_VISUAL[slide.bsNumber]}

      <p className={styles.bsParagraph}>{slide.paragraph}</p>

      {slide.bsNumber === 4 && (
        <div className={styles.bsProofBlock}>
          <p className={styles.bsProofTitle}>THE PROTOCOL — 4 YEARS OF R&amp;D</p>
          <ul className={styles.bsProofList}>
            <li>3,000+ peer-reviewed studies analyzed</li>
            <li>Team of aesthetics experts and scientists</li>
            <li>Dataset of 2,500+ fully measured men</li>
            <li>Personalized ratio formula per individual</li>
          </ul>
        </div>
      )}

      <div className={styles.bsFooter}>
        <p className={styles.bsFooterText}>{slide.footer}</p>
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
