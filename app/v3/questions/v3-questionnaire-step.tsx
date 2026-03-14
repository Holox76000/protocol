"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { trackGa4Event } from "../../../lib/ga4Event";
import { getFunnelConfig } from "../../../lib/funnels";
import { getV3QuestionStepHref, QUESTIONS, QUESTION_COUNT } from "./questions";
import styles from "./v3-questionnaire-step.module.css";

const STORAGE_KEY = "protocol.v3.questionnaire";

export default function V3QuestionnaireStep({ step }: { step: number }) {
  const router = useRouter();
  const funnelConfig = getFunnelConfig("v3");
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, string>;
      setAnswers(parsed);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const currentQuestion = QUESTIONS[step - 1];
  const currentAnswer = answers[currentQuestion.id] ?? "";
  const answeredCount = useMemo(
    () => QUESTIONS.reduce((count, item) => count + (answers[item.id] ? 1 : 0), 0),
    [answers]
  );
  const progress = Math.round((step / QUESTION_COUNT) * 100);

  useEffect(() => {
    if (step === 1) {
      trackGa4Event("questionnaire_started", {
        funnel: "v3",
      });
    }

    trackGa4Event("question_viewed", {
      funnel: "v3",
      question_number: step,
      question_id: currentQuestion.id,
    });
  }, [currentQuestion.id, step]);

  const handleSelect = (option: string) => {
    const nextAnswers = { ...answers, [currentQuestion.id]: option };
    setAnswers(nextAnswers);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextAnswers));
    trackGa4Event("question_answered", {
      funnel: "v3",
      question_number: step,
      question_id: currentQuestion.id,
      answer_value: option,
    });
  };

  const handleNext = () => {
    if (!currentAnswer) return;

    if (step === QUESTION_COUNT) {
      trackGa4Event("questionnaire_completed", {
        funnel: "v3",
        question_count: QUESTION_COUNT,
      });
      trackGa4Event("checkout_clicked", {
        funnel: "v3",
        cta_location: "questionnaire",
        question_number: step,
        destination: funnelConfig.checkoutHref,
      });
      router.push(funnelConfig.checkoutHref);
      return;
    }

    router.push(getV3QuestionStepHref(step + 1));
  };

  const handleBack = () => {
    if (step === 1) {
      router.push(funnelConfig.visualizationHref);
      return;
    }

    router.push(getV3QuestionStepHref(step - 1));
  };

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.headerCard}>
          <div className={styles.progressHeader}>
            <p className={styles.eyebrow}>Questionnaire</p>
            <div className={styles.progressMeta}>
              <span>Question {step} of {QUESTION_COUNT}</span>
              <strong>{progress}%</strong>
            </div>
          </div>
          <div className={styles.progressTrack} aria-hidden="true">
            <span className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
          <div className={styles.headerTop}>
            <div>
              <h1 className={styles.title}>{currentQuestion.question}</h1>
              <p className={styles.subtitle}>{currentQuestion.helper}</p>
            </div>
          </div>
        </section>

        <section className={styles.questionCard}>
          <div className={styles.questionTop}>
            <span className={styles.questionNumber}>{String(step).padStart(2, "0")}</span>
            <div>
              <p className={styles.questionEyebrow}>{currentQuestion.eyebrow}</p>
              <h2 className={styles.questionTitle}>Choose the answer that fits you best</h2>
              <p className={styles.questionHelper}>You can change it later if needed.</p>
            </div>
          </div>

          <div className={styles.optionsGrid}>
            {currentQuestion.options.map((option) => {
              const selected = currentAnswer === option;

              return (
                <button
                  key={option}
                  type="button"
                  className={`${styles.optionButton} ${selected ? styles.optionButtonSelected : ""}`}
                  onClick={() => handleSelect(option)}
                >
                  {option}
                </button>
              );
            })}
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.secondaryButton} onClick={handleBack}>
              {step === 1 ? "Back to visualization" : "Previous question"}
            </button>
            <button type="button" className={styles.primaryButton} onClick={handleNext} disabled={!currentAnswer}>
              {step === QUESTION_COUNT ? "Continue to checkout" : "Next question"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
