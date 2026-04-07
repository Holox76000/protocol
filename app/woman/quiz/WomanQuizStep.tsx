"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
const bodyTypesImage = { src: "/assets/body-types.png", width: 1536, height: 1024 };
import { trackGa4Event } from "../../../lib/ga4Event";
import styles from "../../visualization/visualization.module.css";
import { STORAGE_KEY, WOMAN_QUIZ_QUESTIONS } from "./woman-quiz-data";
import { persistWomanQuizLead } from "./persistWomanQuizLead";

export default function WomanQuizStep({ questionIndex, routeStep }: { questionIndex: number; routeStep: number }) {
  const router = useRouter();
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

  const currentQuestion = WOMAN_QUIZ_QUESTIONS[questionIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] ?? "" : "";

  useEffect(() => {
    if (!currentQuestion) return;

    if (questionIndex === 0) {
      trackGa4Event("questionnaire_started", {
        funnel: "woman",
      });
    }

    trackGa4Event("question_viewed", {
      funnel: "woman",
      question_number: questionIndex + 1,
      question_id: currentQuestion.id,
    });
  }, [currentQuestion, questionIndex]);

  const optionColumns = useMemo(() => {
    if (!currentQuestion) return 2;
    return currentQuestion.options.length >= 5 ? 3 : 2;
  }, [currentQuestion]);

  if (!currentQuestion) {
    return null;
  }

  const handleSelect = (option: string) => {
    const nextAnswers = { ...answers, [currentQuestion.id]: option };
    setAnswers(nextAnswers);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextAnswers));

    trackGa4Event("question_answered", {
      funnel: "woman",
      question_number: questionIndex + 1,
      question_id: currentQuestion.id,
      answer_value: option,
    });
  };

  const handleContinue = async () => {
    if (!currentAnswer) return;

    trackGa4Event("quiz_step_completed", {
      funnel: "woman",
      route_step: routeStep,
      question_number: questionIndex + 1,
      question_id: currentQuestion.id,
      answer_value: currentAnswer,
    });

    await persistWomanQuizLead({
      last_completed_question_id: currentQuestion.id,
      last_completed_question_number: String(questionIndex + 1),
    });

    router.push(`/woman/quiz/${routeStep + 1}`);
  };

  return (
    <main className={styles.page}>
      <div className={styles.flowShell}>
        <div className={`${styles.flowLayout} ${styles.flowLayoutSingle}`}>
          <section className={styles.workspace}>
            <div className={styles.flowCard}>
              <div className={styles.introBrandBar}>
                <img
                  src="/program/static/landing/images/shared/Prtcl.png"
                  alt="Protocol"
                  className={styles.introBrandLogo}
                />
                <span className={styles.introBrandLabel}>Women’s Transformation Plan</span>
              </div>

              <div className={styles.infoHeader}>
                <div className={styles.quizProgressPill}>
                  Question {questionIndex + 1} of {WOMAN_QUIZ_QUESTIONS.length}
                </div>
                <h1 className={styles.infoHeadline}>{currentQuestion.question}</h1>
                <p className={styles.infoSubhead}>{currentQuestion.helper}</p>
              </div>

              <div className={styles.quizShell}>
                {currentQuestion.image === "body-types" ? (
                  <div className={styles.quizImageFrame}>
                    <Image
                      src={bodyTypesImage}
                      alt="Body type guide showing Morpho A, 8, X, V, H, and O"
                      width={bodyTypesImage.width}
                      height={bodyTypesImage.height}
                      className={styles.quizImage}
                      priority
                    />
                  </div>
                ) : null}

                <div
                  className={styles.quizOptionsGrid}
                  style={{ gridTemplateColumns: `repeat(${optionColumns}, minmax(0, 1fr))` }}
                >
                  {currentQuestion.options.map((option) => {
                    const isSelected = currentAnswer === option;

                    return (
                      <button
                        key={option}
                        type="button"
                        className={`${styles.quizOption} ${isSelected ? styles.quizOptionSelected : ""}`}
                        onClick={() => handleSelect(option)}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>

                <div className={styles.quizActions}>
                  <button type="button" className={styles.infoCta} disabled={!currentAnswer} onClick={handleContinue}>
                    Continue
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                      <path d="M7 5L11.5 9L7 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <p className={styles.signupMeta}>We use this to make the plan feel more specific, relevant, and motivating.</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <footer className={styles.footer}>
          <span className={styles.footerCopy}>© {new Date().getFullYear()} Protocol. All rights reserved.</span>
        </footer>
      </div>
    </main>
  );
}
