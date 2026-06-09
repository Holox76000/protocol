"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Answers } from "../funnel-config";
import styles from "./slides.module.css";

function buildRedirectUrl(answers: Answers, source?: string): string {
  const params = new URLSearchParams();
  for (const [key, val] of Object.entries(answers)) {
    if (key.startsWith("_")) continue;
    if (Array.isArray(val)) {
      params.set(key, val.join("|"));
    } else if (val) {
      params.set(key, String(val));
    }
  }
  params.set("funnel", "quiz");
  if (source) params.set("from", source);
  const sessionId = answers._session_id as string | undefined;
  const photoPath = answers._photo_path as string | undefined;
  if (sessionId && photoPath) {
    params.set("funnel_sid", sessionId);
  }
  return `/f1/vsl?${params.toString()}`;
}

const MORPHOLOGY_LABELS: Record<string, string> = {
  Skinny: "Skinny",
  "Skinny-fat": "Skinny-fat",
  Overweight: "Overweight",
  Average: "Average",
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

const QUALIFIERS = [
  "Body type assessed",
  "Goals identified",
  "Social context matched",
  "Protocol available",
];

export function ProtocolReadySlide({ answers, source }: { answers: Answers; source?: string }) {
  const router = useRouter();
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
        <div className={styles.prQualBadge}>Qualified</div>

        <h2 className={styles.prReadyTitle}>Your profile matches our Protocol.</h2>

        <p className={styles.prReadySubtext}>
          Based on your answers, we can help you. Your profile gives us everything we need to build
          a protocol that works specifically for you.
        </p>

        <div className={styles.prQualGrid}>
          {QUALIFIERS.map((q) => (
            <div key={q} className={styles.prQualItem}>
              <span className={styles.prQualCheck}>✓</span>
              <span>{q}</span>
            </div>
          ))}
        </div>

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

        <div className={styles.prReadyRow}>
          <span className={styles.prReadyRowLabel}>Profile ID</span>
          <span className={styles.prReadyRowValue}>{idRef.current}</span>
        </div>
      </div>

      <div className={styles.actionsFull}>
        <button
          type="button"
          className={styles.btnPrimary}
          onClick={() => router.push(buildRedirectUrl(answers, source))}
          disabled={!ready}
        >
          See my Protocol →
        </button>
        {!ready && (
          <p className={styles.prReadyHint}>Finalizing your profile…</p>
        )}
      </div>
    </div>
  );
}
