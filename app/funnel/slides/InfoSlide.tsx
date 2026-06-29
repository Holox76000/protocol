"use client";

import { useEffect, useState } from "react";
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

type Bar = { label: string; pct: number };

const MORPHOLOGY_PCTS: Record<string, [number, number, number]> = {
  "Skinny":     [87, 81, 76],
  "Skinny-fat": [89, 84, 78],
  "Overweight": [86, 80, 75],
  "Average":    [91, 86, 80],
};
const FALLBACK_PCTS: [number, number, number] = [89, 84, 78];

const DREAM_BAR1_LABEL: Record<string, string> = {
  "Feel confident and desirable to others":
    "More confident and desirable in social settings",
  "A specific physical transformation (less fat, more muscle, defined shape)":
    "Achieved the physique they were aiming for",
  "Inner peace, confidence and self-respect":
    "Steadier self-respect and inner calm",
};
const DREAM_FALLBACK = "Made measurable progress on their #1 goal";

const BAR2_LABEL = "Comfortable going shirtless at the beach or pool";
const BAR3_LABEL = "Wearing what they want — speedo, tank, crop top — no shame";

function getResultsBars(answers: Answers): Bar[] {
  const morph = typeof answers.morphology === "string" ? answers.morphology : "";
  const [p1, p2, p3] = MORPHOLOGY_PCTS[morph] ?? FALLBACK_PCTS;

  const dream = typeof answers.dream_outcome === "string" ? answers.dream_outcome : "";
  const bar1Label = DREAM_BAR1_LABEL[dream] ?? DREAM_FALLBACK;

  return [
    { label: bar1Label, pct: p1 },
    { label: BAR2_LABEL, pct: p2 },
    { label: BAR3_LABEL, pct: p3 },
  ];
}

export function InfoSlide({ slide, answers, onNext, onBack }: Props) {
  const isSocialProof = slide.variant === "social-proof";
  const isObjection = slide.variant === "objection";
  const isResultsBars = slide.variant === "results-bars";

  const orientation = answers.sexual_orientation as OrientationKey | undefined;
  const override = orientation && slide.byOrientation ? slide.byOrientation[orientation] : undefined;
  const headline = override?.headline ?? slide.headline;
  const body = override?.body ?? slide.body;

  const bars = isResultsBars ? getResultsBars(answers) : null;
  const [fills, setFills] = useState<number[]>(() => (bars ? bars.map(() => 0) : []));

  useEffect(() => {
    if (!bars) return;
    const timers: number[] = [];
    bars.forEach((bar, i) => {
      const t = window.setTimeout(() => {
        requestAnimationFrame(() => {
          setFills((prev) => {
            const next = prev.slice();
            next[i] = bar.pct;
            return next;
          });
        });
      }, 120 + i * 180);
      timers.push(t);
    });
    return () => timers.forEach((t) => window.clearTimeout(t));
    // bars depend only on answers; computed fresh per render but stable per session
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.card}>
      <div className={styles.infoInner}>
        {isSocialProof && (
          <>
            <div className={styles.infoStat}>
              <span className={styles.infoStatNumber}>2,500+</span>
              <span className={styles.infoStatLabel}>
                {orientation === "Gay" ? "gay men assessed"
                  : orientation === "Bisexual" ? "bisexual men assessed"
                  : "men assessed"}
              </span>
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

        {isResultsBars ? (
          <>
            <p className={styles.resultsSubtext}>{body}</p>
            <div className={styles.resultsBars}>
              {bars!.map((bar, i) => (
                <div key={i} className={styles.resultsBar}>
                  <div className={styles.resultsBarHead}>
                    <span className={styles.resultsBarLabel}>{bar.label}</span>
                    <span className={styles.resultsBarPct}>{bar.pct}%</span>
                  </div>
                  <div className={styles.resultsBarTrack}>
                    <span
                      className={styles.resultsBarFill}
                      style={{ width: `${fills[i] ?? 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className={styles.infoBody}>
            {body.split("\n").map((line, i, arr) => (
              <span key={i}>
                {line}
                {i < arr.length - 1 && <br />}
              </span>
            ))}
          </p>
        )}

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
