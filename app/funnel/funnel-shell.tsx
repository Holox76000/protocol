"use client";

import { useEffect, useState } from "react";
import {
  SLIDES,
  TOTAL_QUESTIONS,
  questionsAnsweredUpTo,
  type Answers,
  type SlideConfig,
} from "./funnel-config";
import { SingleQuestion, MultiQuestion } from "./slides/QuestionSlide";
import { HeightSlide, WeightSlide } from "./slides/NumericSlide";
import { BeliefSlide } from "./slides/BeliefSlide";
import { InfoSlide } from "./slides/InfoSlide";
import { SummarySlide } from "./slides/SummarySlide";
import { PromiseSlide } from "./slides/PromiseSlide";
import { YesLadderSlide } from "./slides/YesLadderSlide";
import { FinalLoadingSlide } from "./slides/FinalLoadingSlide";
import { ProtocolReadySlide } from "./slides/ProtocolReadySlide";
import styles from "./funnel.module.css";

const STORAGE_KEY = "protocol.funnel.v26";

export default function FunnelShell() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Answers;
      setAnswers(parsed);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const slide = SLIDES[step];
  const qCount = questionsAnsweredUpTo(SLIDES, step);
  const progress = Math.round((qCount / TOTAL_QUESTIONS) * 100);
  const isSection7 =
    slide.type === "yes-ladder" ||
    slide.type === "protocol-ready" ||
    slide.type === "final-loading";

  const saveAnswer = (updates: Answers) => {
    const next = { ...answers, ...updates };
    setAnswers(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };

  const handleAnswer = (key: string, value: string | string[]) => {
    saveAnswer({ [key]: value });
  };

  const handleAnswerMulti = (updates: Record<string, string>) => {
    saveAnswer(updates);
  };

  const handleNext = () => {
    if (step < SLIDES.length - 1) setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  return (
    <main className={styles.page}>
      {/* ── Header ─────────────────────────────────────────── */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <img
            src="/assets/Prtcl.png"
            alt="Protocol Club"
            className={styles.logo}
            width={28}
            height={28}
          />
          {!isSection7 && (
            <div className={styles.headerProgress}>
              <div className={styles.progressTrack}>
                <span
                  className={styles.progressFill}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className={styles.progressLabel}>
                {Math.max(0, qCount)} / {TOTAL_QUESTIONS}
              </span>
            </div>
          )}
          {isSection7 && (
            <span className={styles.headerProcessing}>Processing…</span>
          )}
        </div>
        <p className={styles.tagline}>
          Clinical assessment based on 3,000+ peer-reviewed studies on male physical attractiveness.
        </p>
      </header>

      {/* ── Slide ──────────────────────────────────────────── */}
      <div className={styles.shell}>
        {renderSlide(slide, answers, handleAnswer, handleAnswerMulti, handleNext, handleBack)}
      </div>
    </main>
  );
}

function renderSlide(
  slide: SlideConfig,
  answers: Answers,
  onAnswer: (key: string, value: string | string[]) => void,
  onAnswerMulti: (updates: Record<string, string>) => void,
  onNext: () => void,
  onBack: () => void
) {
  switch (slide.type) {
    case "single":
      return (
        <SingleQuestion
          slide={slide}
          answers={answers}
          onAnswer={onAnswer}
          onNext={onNext}
          onBack={onBack}
        />
      );

    case "multi":
      return (
        <MultiQuestion
          slide={slide}
          answers={answers}
          onAnswer={onAnswer}
          onNext={onNext}
          onBack={onBack}
        />
      );

    case "numeric-height":
      return (
        <HeightSlide
          slide={slide}
          answers={answers}
          onAnswer={onAnswerMulti}
          onNext={onNext}
          onBack={onBack}
        />
      );

    case "numeric-weight":
      return (
        <WeightSlide
          slide={slide}
          answers={answers}
          onAnswer={onAnswerMulti}
          onNext={onNext}
          onBack={onBack}
        />
      );

    case "belief":
      return (
        <BeliefSlide
          slide={slide}
          onNext={onNext}
          onBack={onBack}
        />
      );

    case "info":
      return (
        <InfoSlide
          slide={slide}
          onNext={onNext}
          onBack={onBack}
        />
      );

    case "summary":
      return (
        <SummarySlide
          answers={answers}
          onNext={onNext}
          onBack={onBack}
        />
      );

    case "promise":
      return (
        <PromiseSlide
          onNext={onNext}
          onBack={onBack}
        />
      );

    case "yes-ladder":
      return (
        <YesLadderSlide
          slide={slide}
          answers={answers}
          onAnswer={onAnswer}
          onNext={onNext}
          onBack={onBack}
        />
      );

    case "protocol-ready":
      return <ProtocolReadySlide onNext={onNext} />;

    case "final-loading":
      return <FinalLoadingSlide answers={answers} />;
  }
}
