"use client";

import type { YesLadderSlide as YesLadderConfig, Answers } from "../funnel-config";
import styles from "./slides.module.css";

const LOADER_LABELS = [
  "Calculating your ratio formula...",
  "Matching training phases...",
  "Generating your 12-week protocol...",
];

type Props = {
  slide: YesLadderConfig;
  answers: Answers;
  onAnswer: (key: string, value: string) => void;
  onNext: () => void;
  onBack: () => void;
};

export function YesLadderSlide({ slide, answers, onAnswer, onNext, onBack }: Props) {
  const selected = (answers[slide.stateKey] as string) ?? "";
  const loaderPct = (slide.loaderStep / 3) * 100;

  const handleSelect = (option: string) => {
    onAnswer(slide.stateKey, option);
    setTimeout(onNext, 150);
  };

  return (
    <div className={styles.card}>
      {/* Processing bar at top */}
      <div className={styles.loaderBar}>
        <div className={styles.loaderBarTrack}>
          <div className={styles.loaderBarFill} style={{ width: `${loaderPct}%` }} />
        </div>
        <p className={styles.loaderBarLabel}>{LOADER_LABELS[slide.loaderStep - 1]}</p>
      </div>

      <div className={styles.cardHeader}>
        <h2 className={styles.question}>{slide.question}</h2>
      </div>

      <div className={styles.optionsList}>
        {slide.options.map((option) => (
          <button
            key={option}
            type="button"
            className={`${styles.option} ${selected === option ? styles.optionSelected : ""}`}
            onClick={() => handleSelect(option)}
          >
            {option}
          </button>
        ))}
      </div>

    </div>
  );
}
