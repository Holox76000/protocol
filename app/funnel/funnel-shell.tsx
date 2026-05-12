"use client";

import { useEffect, useRef, useState } from "react";
import {
  SLIDES,
  TOTAL_QUESTIONS,
  questionsAnsweredUpTo,
  type Answers,
  type SlideConfig,
} from "./funnel-config";
import dynamic from "next/dynamic";
import { IntroSlide } from "./slides/IntroSlide";

const SingleQuestion   = dynamic(() => import("./slides/QuestionSlide").then(m => ({ default: m.SingleQuestion })));
const MultiQuestion    = dynamic(() => import("./slides/QuestionSlide").then(m => ({ default: m.MultiQuestion })));
const HeightSlide      = dynamic(() => import("./slides/NumericSlide").then(m => ({ default: m.HeightSlide })));
const WeightSlide      = dynamic(() => import("./slides/NumericSlide").then(m => ({ default: m.WeightSlide })));
const BeliefSlide      = dynamic(() => import("./slides/BeliefSlide").then(m => ({ default: m.BeliefSlide })));
const InfoSlide        = dynamic(() => import("./slides/InfoSlide").then(m => ({ default: m.InfoSlide })));
const StatSlide        = dynamic(() => import("./slides/StatSlide").then(m => ({ default: m.StatSlide })));
const SummarySlide     = dynamic(() => import("./slides/SummarySlide").then(m => ({ default: m.SummarySlide })));
const PromiseSlide     = dynamic(() => import("./slides/PromiseSlide").then(m => ({ default: m.PromiseSlide })));
const YesLadderSlide   = dynamic(() => import("./slides/YesLadderSlide").then(m => ({ default: m.YesLadderSlide })));
const FinalLoadingSlide = dynamic(() => import("./slides/FinalLoadingSlide").then(m => ({ default: m.FinalLoadingSlide })));
const ProtocolReadySlide = dynamic(() => import("./slides/ProtocolReadySlide").then(m => ({ default: m.ProtocolReadySlide })));
const PhotoUploadSlide = dynamic(() => import("./slides/PhotoUploadSlide").then(m => ({ default: m.PhotoUploadSlide })));
const MultiPhotoUploadSlide = dynamic(() => import("./slides/MultiPhotoUploadSlide").then(m => ({ default: m.MultiPhotoUploadSlide })));
import styles from "./funnel.module.css";
import { trackFunnelPageView, trackFunnelAnswer } from "../../lib/funnel-analytics";
import { getAdVariant, type AdVariant } from "../../lib/ad-variants";
import { getUtmParams, persistUtmParams, getPersistedUtmParams } from "../../lib/utm";

const STORAGE_KEY = "protocol.funnel.v26";

export default function FunnelShell() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [adVariant, setAdVariant] = useState<AdVariant | undefined>();
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
    // Persist UTMs from URL (so they survive internal navigation) and resolve ad variant
    const urlUtms = getUtmParams();
    if (Object.keys(urlUtms).length > 0) persistUtmParams(urlUtms);
    const utms = { ...getPersistedUtmParams(), ...urlUtms };
    const adId = utms.utm_ad ?? utms.utm_content ?? undefined;
    if (adId) setAdVariant(getAdVariant(adId));

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      let parsed: Answers = raw ? (JSON.parse(raw) as Answers) : {};
      if (!parsed._session_id) {
        parsed = {
          ...parsed,
          _session_id: crypto.randomUUID(),
          _max_step: 0,
          ...(utms.utm_source   && { _utm_source:   utms.utm_source }),
          ...(utms.utm_campaign && { _utm_campaign: utms.utm_campaign }),
          ...(utms.utm_ad       && { _utm_ad:       utms.utm_ad }),
          ...(utms.utm_content  && { _utm_content:  utms.utm_content }),
        };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
      setAnswers(parsed);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    trackFunnelPageView(SLIDES[step].id);
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
      trackFunnelAnswer(currentSlide.id, value);
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
        if (val && typeof val !== "number") trackFunnelAnswer(currentSlide.id, val);
      } else if (currentSlide.type === "numeric-height") {
        const unit = answers.height_unit as string | undefined;
        const val = unit === "cm"
          ? `${answers.height_cm ?? ""} cm`
          : `${answers.height_ft ?? ""}ft ${answers.height_in ?? ""}in`;
        trackFunnelAnswer(currentSlide.id, val);
      } else if (currentSlide.type === "numeric-weight") {
        trackFunnelAnswer(currentSlide.id, `${answers.weight_value ?? ""} ${answers.weight_unit ?? ""}`);
      }
      const nextStep = step + 1;
      const prevMax = (answers._max_step as number | undefined) ?? 0;
      if (nextStep > prevMax) saveAnswer({ _max_step: nextStep });
      setStep(nextStep);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  return (
    <main className={styles.page}>
      <div className={styles.screen}>
        {/* ── Header ───────────────────────────────────────── */}
        <header className={styles.header} style={step === 0 ? { display: "none" } : undefined}>
          <button
            className={styles.backBtn}
            onClick={handleBack}
            disabled={step === 0}
            aria-label="Back"
            style={step === 0 ? { visibility: "hidden" } : undefined}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M11 14L6 9l5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {!isSection7 && step > 0 && (
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

        {/* ── Slide ──────────────────────────────────────────── */}
        <div className={styles.shell}>
          {renderSlide(slide, answers, handleAnswer, handleAnswerMulti, handleNext, handleBack, adVariant)}
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
  onBack: () => void,
  adVariant?: AdVariant
) {
  switch (slide.type) {
    case "intro":
      return <IntroSlide onNext={onNext} variant={adVariant} />;

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

    case "stat":
      return (
        <StatSlide
          slide={slide}
          answers={answers}
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

    case "photo-upload": {
      const photoSlide = slide as import("./funnel-config").PhotoUploadSlide;
      if (photoSlide.photoTypes && photoSlide.photoTypes.length > 1) {
        return (
          <MultiPhotoUploadSlide
            photoTypes={photoSlide.photoTypes}
            answers={answers}
            onAnswer={onAnswer}
            onNext={onNext}
            onBack={onBack}
          />
        );
      }
      return (
        <PhotoUploadSlide
          answers={answers}
          onAnswer={onAnswer}
          onNext={onNext}
          onBack={onBack}
          photoType={photoSlide.photoType}
        />
      );
    }

    case "protocol-ready":
      return (
        <ProtocolReadySlide
          answers={answers}
        />
      );

    case "final-loading":
      return <FinalLoadingSlide answers={answers} onNext={onNext} />;
  }
}
