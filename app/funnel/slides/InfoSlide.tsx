"use client";

import type { InfoSlide as InfoSlideConfig, Answers } from "../funnel-config";
import styles from "./slides.module.css";

const AVATARS = Array.from({ length: 7 });

type Props = {
  slide: InfoSlideConfig;
  answers: Answers;
  onNext: () => void;
  onBack: () => void;
};

type OrientationKey = "Gay" | "Bisexual" | "Straight" | "Prefer not to say";

export function InfoSlide({ slide, answers, onNext, onBack }: Props) {
  const isSocialProof = slide.variant === "social-proof";
  const isObjection = slide.variant === "objection";

  const orientation = answers.sexual_orientation as OrientationKey | undefined;
  const override = orientation && slide.byOrientation ? slide.byOrientation[orientation] : undefined;
  const headline = override?.headline ?? slide.headline;
  const body = override?.body ?? slide.body;

  return (
    <div className={styles.card}>
      <div className={styles.infoInner}>
        {isSocialProof && (
          <>
            <div className={styles.infoStat}>
              <span className={styles.infoStatNumber}>2,500+</span>
              <span className={styles.infoStatLabel}>men assessed</span>
            </div>
            <div className={styles.infoAvatarRow}>
              {AVATARS.map((_, i) => (
                <span key={i} className={styles.infoAvatar}
                  style={{ background: ['#cdd9d8','#dfe4e6','#9eb1b8','#7f949b','#cdd9d8','#dfe4e6','#9eb1b8'][i] }}
                />
              ))}
              <span className={styles.infoAvatarMore}>···</span>
            </div>
          </>
        )}

        {isObjection && (
          <div className={styles.infoObjBadge}>
            <span className={styles.infoObjCheck}>✓</span>
          </div>
        )}

        <h2 className={styles.infoHeadline}>{headline}</h2>
        <p className={styles.infoBody}>
          {body.split("\n").map((line, i, arr) => (
            <span key={i}>
              {line}
              {i < arr.length - 1 && <br />}
            </span>
          ))}
        </p>

        {isSocialProof && (
          <div className={styles.infoProof}>
            <span>4 years of R&D</span>
            <span className={styles.infoProofDot} />
            <span>2,500+ measured men</span>
          </div>
        )}
      </div>

      <div className={styles.actionsFull}>
        <button type="button" className={styles.btnPrimary} onClick={onNext}>
          Continue →
        </button>
      </div>
    </div>
  );
}
