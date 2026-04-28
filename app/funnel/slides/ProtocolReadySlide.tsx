"use client";

import { useEffect, useState, useRef } from "react";
import type { Answers } from "../funnel-config";
import styles from "./slides.module.css";

type Props = {
  answers: Answers;
  onNext: () => void;
};

const MORPHOLOGY_LABELS: Record<string, string> = {
  Skinny: "Skinny",
  "Skinny-fat": "Skinny-fat",
  Overweight: "Overweight",
  Muscular: "Muscular",
};

const ENV_LABELS: Record<string, string> = {
  Corporate: "Corporate",
  "Entrepreneur / Startup": "Entrepreneur",
  "Manual / Trade work": "Manual / Trade",
  Student: "Student",
  "Creative / Freelance": "Creative",
  "Medical / Healthcare": "Medical",
  Other: "Other",
};

export function ProtocolReadySlide({ answers, onNext }: Props) {
  const [ready, setReady] = useState(false);
  const idRef = useRef(`PRTCL-${Math.floor(Math.random() * 9000 + 1000)}`);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 1600);
    return () => clearTimeout(t);
  }, []);

  const morphology = (answers.morphology as string) ?? "";
  const social = (answers.social_environment as string) ?? "";

  return (
    <div className={styles.card}>
      <div className={styles.prReadyInner}>
        <div className={styles.eyebrow}>21 · Ready</div>
        <div className={styles.prSeal}>PC</div>
        <h2 className={styles.prReadyTitle}>Your Protocol is ready.</h2>

        {(morphology || social) && (
          <div className={styles.prReadyMeta}>
            {morphology && (
              <span>
                Calibrated to your{" "}
                <strong>{MORPHOLOGY_LABELS[morphology] ?? morphology}</strong> frame
              </span>
            )}
            {social && (
              <span>
                Tuned for <strong>{ENV_LABELS[social] ?? social}</strong> context
              </span>
            )}
          </div>
        )}

        <div className={styles.prReadyDetails}>
          <div className={styles.prReadyRow}>
            <span className={styles.prReadyRowLabel}>Profile ID</span>
            <span className={styles.prReadyRowValue}>{idRef.current}</span>
          </div>
          <div className={styles.prReadyRow}>
            <span className={styles.prReadyRowLabel}>Slot reserved</span>
            <span className={styles.prReadyRowValue}>15 min</span>
          </div>
          <div className={styles.prReadyRow}>
            <span className={styles.prReadyRowLabel}>Status</span>
            <span className={`${styles.prReadyRowValue} ${styles.prReadyActive}`}>● Active</span>
          </div>
        </div>

        <div className={styles.prReadyPrivacy}>
          🔒 Encrypted · never shared
        </div>
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.btnPrimary}
          onClick={onNext}
          disabled={!ready}
        >
          Reveal my Protocol →
        </button>
      </div>
      {!ready && (
        <p style={{ textAlign: 'center', fontSize: 10, color: 'var(--q-soft)', fontFamily: '"JetBrains Mono", monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: -12 }}>
          Final step · 30 seconds
        </p>
      )}
    </div>
  );
}
