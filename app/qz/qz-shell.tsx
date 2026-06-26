"use client";

import { useEffect, useRef, useState } from "react";
import {
  SLIDES,
  TOTAL_QUESTIONS,
  questionsAnsweredUpTo,
  type Answers,
  type SlideConfig,
} from "../funnel/funnel-config";
import { SingleQuestion, MultiQuestion } from "../funnel/slides/QuestionSlide";
import { HeightSlide, WeightSlide } from "../funnel/slides/NumericSlide";
import { BeliefSlide } from "../funnel/slides/BeliefSlide";
import { InfoSlide } from "../funnel/slides/InfoSlide";
import { StatSlide } from "../funnel/slides/StatSlide";
import { SummarySlide } from "../funnel/slides/SummarySlide";
import { PromiseSlide } from "../funnel/slides/PromiseSlide";
import { YesLadderSlide } from "../funnel/slides/YesLadderSlide";
import { FinalLoadingSlide } from "../funnel/slides/FinalLoadingSlide";
import { ProtocolReadySlide } from "../funnel/slides/ProtocolReadySlide";
import { PhotoUploadSlide } from "../funnel/slides/PhotoUploadSlide";
import { IntroSlide } from "../funnel/slides/IntroSlide";
import styles from "../funnel/funnel.module.css";
import { trackFunnelPageView, trackFunnelAnswer } from "../../lib/funnel-analytics";

const STORAGE_KEY = "protocol.qz.v1";
const BASE_PATH = "/qz";

export default function QzShell() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncToDb = (data: Answers) => {
    const sessionId = data._session_id as string | undefined;
    if (!sessionId) return;
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      fetch("/api/funnel/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, answers: data }),
      }).catch(() => {});
    }, 1500);
  };

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      let parsed: Answers = raw ? (JSON.parse(raw) as Answers) : {};
      if (!parsed._session_id) {
        parsed = { ...parsed, _session_id: crypto.randomUUID() };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
      setAnswers(parsed);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    trackFunnelPageView(SLIDES[step].id, BASE_PATH);
  }, [step]);

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
    syncToDb(next);
  };

  const handleAnswer = (key: string, value: string | string[]) => {
    saveAnswer({ [key]: value });
    const currentSlide = SLIDES[step];
    if (currentSlide.type === "single" || currentSlide.type === "yes-ladder") {
      trackFunnelAnswer(currentSlide.id, value, BASE_PATH);
    }
  };

  const handleAnswerMulti = (updates: Record<string, string>) => {
    saveAnswer(updates);
  };

  const handleNext = () => {
    if (step < SLIDES.length - 1) {
      const currentSlide = SLIDES[step];
      if (currentSlide.type === "multi" && "stateKey" in currentSlide) {
        const val = answers[currentSlide.stateKey];
        if (val && typeof val !== "number") trackFunnelAnswer(currentSlide.id, val, BASE_PATH);
      } else if (currentSlide.type === "numeric-height") {
        const unit = answers.height_unit as string | undefined;
        const val = unit === "cm"
          ? `${answers.height_cm ?? ""} cm`
          : `${answers.height_ft ?? ""}ft ${answers.height_in ?? ""}in`;
        trackFunnelAnswer(currentSlide.id, val, BASE_PATH);
      } else if (currentSlide.type === "numeric-weight") {
        trackFunnelAnswer(currentSlide.id, `${answers.weight_value ?? ""} ${answers.weight_unit ?? ""}`, BASE_PATH);
      }
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  return (
    <main className={styles.page}>
      <div className={styles.screen}>
        <header className={styles.header}>
          <button
            className={styles.backBtn}
            onClick={handleBack}
            disabled={step === 0}
            aria-label="Back"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M11 14L6 9l5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {!isSection7 && (
            <div className={styles.headerProgress}>
              <div className={styles.progressTrack}>
                <span
                  className={styles.progressFill}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
          {isSection7 && (
            <span className={styles.headerProcessing}>Processing…</span>
          )}
        </header>

        <div className={styles.shell}>
          {renderSlide(slide, answers, handleAnswer, handleAnswerMulti, handleNext, handleBack)}
        </div>
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
    case "intro":
      return <IntroSlide onNext={onNext} />;

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
      return <BeliefSlide slide={slide} onNext={onNext} onBack={onBack} />;

    case "info":
      return <InfoSlide slide={slide} answers={answers} onNext={onNext} onBack={onBack} />;

    case "stat":
      return <StatSlide slide={slide} answers={answers} onNext={onNext} onBack={onBack} />;

    case "summary":
      return <SummarySlide answers={answers} onNext={onNext} onBack={onBack} />;

    case "promise":
      return <PromiseSlide onNext={onNext} onBack={onBack} />;

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

    case "photo-upload":
      return (
        <PhotoUploadSlide
          answers={answers}
          onAnswer={onAnswer}
          onNext={onNext}
          onBack={onBack}
        />
      );

    case "protocol-ready":
      return <ProtocolReadySlide answers={answers} source="qz" />;

    case "final-loading":
      return <FinalLoadingSlide answers={answers} onNext={onNext} />;
  }
}
