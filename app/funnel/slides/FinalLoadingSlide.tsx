"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Answers } from "../funnel-config";
import styles from "./slides.module.css";

const STEPS = [
  "Ratio formula calculated",
  "Training phases matched",
  "12-week plan generated",
];

const LABELS = [
  "Building your personalized Protocol...",
  "Finalizing your ratio targets...",
  "Protocol ready. Loading your results...",
];

type Props = {
  answers: Answers;
};

function buildRedirectUrl(answers: Answers): string {
  const params = new URLSearchParams();
  for (const [key, val] of Object.entries(answers)) {
    if (Array.isArray(val)) {
      params.set(key, val.join("|"));
    } else if (val) {
      params.set(key, val);
    }
  }
  params.set("funnel", "quiz");
  return `/f1/offer?${params.toString()}`;
}

export function FinalLoadingSlide({ answers }: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState(0);
  const [pct, setPct] = useState(80);

  useEffect(() => {
    // Already at 75% from yes-ladder; finish the remaining 25%
    const timeline = [
      { delay: 400,  pct: 88,  phase: 0 },
      { delay: 1000, pct: 94,  phase: 1 },
      { delay: 1800, pct: 100, phase: 2 },
    ];

    const timers = timeline.map(({ delay, pct: p, phase: ph }) =>
      setTimeout(() => {
        setPct(p);
        setPhase(ph);
      }, delay)
    );

    const redirectTimer = setTimeout(() => {
      router.push(buildRedirectUrl(answers));
    }, 3200);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(redirectTimer);
    };
  }, [answers, router]);

  return (
    <div className={styles.card}>
      <div className={styles.finalLoadingInner}>
        <div className={styles.finalLoaderTrack}>
          <div
            className={styles.finalLoaderFill}
            style={{ width: `${pct}%`, transition: "width 0.6s ease" }}
          />
        </div>
        <p className={styles.finalLoaderLabel}>{LABELS[phase]}</p>

        <div className={styles.finalChecklist}>
          {STEPS.map((step) => (
            <div key={step} className={`${styles.finalCheckItem} ${styles.finalCheckItemDone}`}>
              <span className={styles.finalCheckIcon}>✓</span>
              <span>{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
