"use client";

import type { YesLadderSlide as YesLadderConfig, Answers } from "../funnel-config";
import styles from "./slides.module.css";

type Props = {
  slide: YesLadderConfig;
  answers: Answers;
  onAnswer: (key: string, value: string) => void;
  onNext: () => void;
  onBack: () => void;
};

export function YesLadderSlide({ slide, answers, onAnswer, onNext, onBack }: Props) {
  const pct = (slide.loaderStep / 3) * 100;

  const handleSelect = (option: string) => {
    onAnswer(slide.stateKey, option);
    setTimeout(onNext, 200);
  };

  return (
    <div className={styles.card}>
      <div className={styles.ladderLoadbar}>
        <div className={styles.ladderLoadbarHead}>
          <span>{slide.loaderLabel}</span>
          <span className={styles.ladderLoadbarPct}>{Math.round(pct)}%</span>
        </div>
        <div className={styles.ladderLoadbarTrack}>
          <div className={styles.ladderLoadbarFill} style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
        <h2 className={styles.question} style={{ textAlign: 'center', fontSize: 'clamp(22px, 4vw, 28px)' }}>
          {slide.question}
        </h2>
      </div>

      <div className={styles.ynGrid}>
        {slide.options.map((option) => (
          <button
            key={option}
            type="button"
            className={styles.ynBtn}
            onClick={() => handleSelect(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
