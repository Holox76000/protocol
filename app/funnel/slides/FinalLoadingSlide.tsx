"use client";

import { useEffect, useState } from "react";
import type { Answers } from "../funnel-config";
import styles from "./slides.module.css";

const ITEMS = [
  "Analyzing your profile...",
  "Checking qualification criteria...",
  "Matching your ratios to our database...",
  "Verifying protocol availability...",
  "Qualification complete.",
];

type Props = {
  answers: Answers;
  onNext: () => void;
};

export function FinalLoadingSlide({ answers, onNext }: Props) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (active >= ITEMS.length) {
      const t = setTimeout(() => onNext(), 600);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setActive((a) => a + 1), 900);
    return () => clearTimeout(t);
  }, [active, onNext]);

  return (
    <div className={styles.card}>
      <div className={styles.spinnerInner}>
        <div className={styles.spinnerRing} />
        <h2 className={styles.spinnerTitle}>
          Qualifying your profile.
        </h2>
        <p className={styles.spinnerSubtext}>
          We are verifying that our Protocol is right for you.
        </p>
        <div className={styles.spinnerChecklist}>
          {ITEMS.map((item, i) => (
            <div
              key={item}
              className={`${styles.checkItem} ${
                i < active ? styles.checkItemDone : ""
              } ${i === active ? styles.checkItemActive : ""}`}
            >
              <span className={styles.checkItemDot} />
              {i < active ? item.replace("...", " ✓").replace(".", " ✓") : item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
