"use client";

import { useEffect, useState } from "react";
import styles from "./slides.module.css";

type Props = {
  onNext: () => void;
};

const ITEMS = [
  "Your Goals",
  "Your Physical Profile",
  "Your Attractiveness Protocol",
];

export function ProtocolReadySlide({ onNext }: Props) {
  const [filled, setFilled] = useState(0);

  useEffect(() => {
    if (filled >= ITEMS.length) return;
    const t = setTimeout(() => setFilled((f) => f + 1), 600);
    return () => clearTimeout(t);
  }, [filled]);

  return (
    <div className={styles.card}>
      <div className={styles.prHeader}>
        <h2 className={styles.prTitle}>Your Protocol is ready.</h2>
        <p className={styles.prSubtitle}>
          Based on your answers, we've built your personalized Attractiveness Protocol.
        </p>
      </div>

      <div className={styles.prItems}>
        {ITEMS.map((label, i) => {
          const done = filled > i;
          return (
            <div key={label} className={styles.prItem}>
              <div className={styles.prItemHeader}>
                <span className={styles.prItemLabel}>{label}</span>
                {done && <span className={styles.prItemCheck}>✓</span>}
              </div>
              <div className={styles.prBarTrack}>
                <div
                  className={styles.prBarFill}
                  style={{ width: done ? "100%" : "0%" }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className={styles.btnPrimary}
        onClick={onNext}
        disabled={filled < ITEMS.length}
      >
        Get my Protocol →
      </button>
    </div>
  );
}
