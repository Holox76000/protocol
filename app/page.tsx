"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { QuizShell } from "../components/QuizShell";
import { QuestionCard } from "../components/QuestionCard";
import { OptInForm } from "../components/OptInForm";
import { ResultView } from "../components/ResultView";
import { quizQuestions, COPY } from "../lib/quizConfig";
import { trackEvent } from "../lib/analytics";
import { getScoringResult } from "../lib/scoring";
import { getUtmParams } from "../lib/utm";
import { clearQuizState, loadQuizState, saveQuizState } from "../lib/storage";
import type { AnswerMap } from "../lib/scoring";

const TOTAL_QUESTIONS = quizQuestions.length;

export default function HomePage() {
  const [step, setStep] = useState<number>(-1);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [email, setEmail] = useState<string | undefined>(undefined);
  const [startedAt, setStartedAt] = useState<string | undefined>(undefined);
  const [utm, setUtm] = useState<Record<string, string | undefined>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const optinTracked = useRef(false);
  const resultTracked = useRef(false);

  useEffect(() => {
    const saved = loadQuizState();
    if (saved && saved.step <= TOTAL_QUESTIONS) {
      setStep(saved.step ?? -1);
      setAnswers(saved.answers ?? {});
      setEmail(saved.email);
      setStartedAt(saved.startedAt);
      setUtm(saved.utm ?? {});
    } else {
      if (saved && saved.step > TOTAL_QUESTIONS) {
        clearQuizState();
      }
      setUtm(getUtmParams());
    }
  }, []);

  useEffect(() => {
    if (step > TOTAL_QUESTIONS) {
      clearQuizState();
      return;
    }
    saveQuizState({ step, answers, email, startedAt, utm });
  }, [step, answers, email, startedAt, utm]);

  useEffect(() => {
    if (step === TOTAL_QUESTIONS && !optinTracked.current) {
      trackEvent("optin_viewed");
      optinTracked.current = true;
    }
  }, [step]);

  const result = useMemo(() => {
    if (step < TOTAL_QUESTIONS + 1) return null;
    return getScoringResult(answers);
  }, [answers, step]);

  useEffect(() => {
    if (result && !resultTracked.current) {
      trackEvent("result_viewed", {
        segment: result.segment,
        score: result.score,
        blocker: result.blocker
      });
      resultTracked.current = true;
    }
  }, [result]);

  const startQuiz = () => {
    const now = new Date().toISOString();
    setStartedAt(now);
    setUtm(getUtmParams());
    setStep(0);
    trackEvent("quiz_started");
  };

  const handleSelect = (optionId: string) => {
    const question = quizQuestions[step];
    if (!question) return;

    setAnswers((prev) => ({
      ...prev,
      [question.id]: optionId
    }));

    trackEvent("question_answered", {
      questionId: question.id,
      answer: optionId,
      step: step + 1
    });

    if (step === TOTAL_QUESTIONS - 1) {
      setStep(TOTAL_QUESTIONS);
    } else {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step <= 0) return;
    setStep(step - 1);
  };

  const handleOptIn = async (emailValue: string) => {
    setIsSubmitting(true);
    const resultData = getScoringResult(answers);
    const payload = {
      email: emailValue,
      answers,
      startedAt,
      completedAt: new Date().toISOString(),
      utm,
      score: resultData.score,
      segment: resultData.segment,
      blocker: resultData.blocker,
      userAgent: typeof window !== "undefined" ? window.navigator.userAgent : undefined
    };

    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Lead submission failed");
      }

      setEmail(emailValue);
      trackEvent("lead_submitted", {
        segment: resultData.segment,
        score: resultData.score,
        blocker: resultData.blocker
      });

      setStep(TOTAL_QUESTIONS + 1);
    } catch (error) {
      console.error(error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    if (step === -1) {
      return (
        <div className="flex flex-col gap-6">
          <div className="card-raise rounded-3xl border border-black/60 bg-white p-6 shadow-hard">
            <p className="text-[11px] uppercase tracking-[0.4em] text-black/60">
              60-Second Assessment
            </p>
            <h1 className="mt-3 text-3xl font-display font-semibold uppercase tracking-[0.12em] text-black">
              {COPY.landing.headline}
            </h1>
            <p className="mt-3 text-base text-black/85">{COPY.landing.sub}</p>
            <button
              type="button"
              onClick={startQuiz}
              className="mt-6 w-full rounded-2xl border border-black bg-black px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white shadow-hard ring-2 ring-black/70 ring-offset-2 ring-offset-white transition hover:bg-white hover:text-black"
            >
              {COPY.landing.cta}
            </button>
          </div>

          <div className="grid gap-3 text-sm text-black/85">
            <div className="card-raise rounded-2xl border border-black/40 bg-white px-4 py-3 shadow-soft">
              Built for men who train but still feel soft.
            </div>
            <div className="card-raise rounded-2xl border border-black/40 bg-white px-4 py-3 shadow-soft">
              Get a clear next step without 100 tabs open.
            </div>
          </div>
        </div>
      );
    }

    if (step >= 0 && step < TOTAL_QUESTIONS) {
      const question = quizQuestions[step];
      return (
        <div className="flex flex-col gap-4">
          <QuestionCard
            question={question}
            selected={answers[question.id]}
            onSelect={handleSelect}
          />
          <p className="text-xs uppercase tracking-[0.3em] text-black/50">
            You can go back, but changing answers may change your result.
          </p>
        </div>
      );
    }

    if (step === TOTAL_QUESTIONS) {
      return <OptInForm onSubmit={handleOptIn} isSubmitting={isSubmitting} />;
    }

    if (result) {
      return (
        <ResultView
          result={result}
          onCtaClick={() =>
            trackEvent("cta_clicked", {
              ctaLocation: "quiz_result",
              destination: "program_page",
              segment: result.segment,
              score: result.score,
              blocker: result.blocker
            })
          }
        />
      );
    }

    return null;
  };

  return (
    <QuizShell
      showProgress={step >= 0 && step < TOTAL_QUESTIONS}
      currentStep={Math.min(step + 1, TOTAL_QUESTIONS)}
      totalSteps={TOTAL_QUESTIONS}
      onBack={step > 0 && step <= TOTAL_QUESTIONS ? handleBack : undefined}
      backDisabled={step <= 0}
    >
      {renderContent()}
    </QuizShell>
  );
}
