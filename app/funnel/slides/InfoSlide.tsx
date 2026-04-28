"use client";

import type { InfoSlide as InfoSlideConfig } from "../funnel-config";
import styles from "./slides.module.css";

const AVATARS = Array.from({ length: 7 });

type Props = {
  slide: InfoSlideConfig;
  onNext: () => void;
  onBack: () => void;
};

export function InfoSlide({ slide, onNext, onBack }: Props) {
  const isSocialProof = slide.variant === "social-proof";
  const isObjection = slide.variant === "objection";

  return (
    <div className={styles.card}>
      <div className={styles.infoInner}>
        {isSocialProof && (
          <>
            <div className={styles.infoStat}>
              <span className={styles.infoStatNumber}>10,000+</span>
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

        <h2 className={styles.infoHeadline}>{slide.headline}</h2>
        <p className={styles.infoBody}>
          {slide.body.split("\n").map((line, i, arr) => (
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
