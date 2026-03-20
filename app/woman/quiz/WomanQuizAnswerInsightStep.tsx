"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { trackGa4Event } from "../../../lib/ga4Event";
import styles from "../../visualization/visualization.module.css";
import { STORAGE_KEY, WOMAN_QUIZ_QUESTIONS } from "./woman-quiz-data";

export default function WomanQuizAnswerInsightStep({
  questionIndex,
  routeStep,
}: {
  questionIndex: number;
  routeStep: number;
}) {
  const router = useRouter();
  const [answer, setAnswer] = useState("");

  const question = WOMAN_QUIZ_QUESTIONS[questionIndex];
  const insight = useMemo(() => {
    if (!question || !answer) return "";
    return question.insights?.[answer] ?? "";
  }, [answer, question]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        router.replace(`/woman/quiz/${Math.max(1, routeStep - 1)}`);
        return;
      }

      const parsed = JSON.parse(raw) as Record<string, string>;
      const selected = parsed[question.id];

      if (!selected) {
        router.replace(`/woman/quiz/${Math.max(1, routeStep - 1)}`);
        return;
      }

      setAnswer(selected);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
      router.replace("/woman/quiz/1");
    }
  }, [question.id, routeStep, router]);

  useEffect(() => {
    if (!answer || !question) return;

    trackGa4Event("question_insight_viewed", {
      funnel: "woman",
      question_number: questionIndex + 1,
      question_id: question.id,
      answer_value: answer,
    });
  }, [answer, question, questionIndex]);

  if (!question || !answer || !insight) {
    return null;
  }

  const nextHref = `/woman/quiz/${routeStep + 1}`;

  return (
    <main className={styles.page}>
      <div className={`${styles.flowShell} ${styles.quizEditorialShell}`}>
        <div className={`${styles.flowLayout} ${styles.flowLayoutSingle}`}>
          <section className={`${styles.workspace} ${styles.quizEditorialWorkspace}`}>
            <div className={`${styles.flowCard} ${styles.quizEditorialCard}`}>
              <div className={styles.introBrandBar}>
                <img
                  src="/program/static/landing/images/shared/Prtcl.png"
                  alt="Protocol"
                  className={styles.introBrandLogo}
                />
                <span className={styles.introBrandLabel}>Women’s Transformation Plan</span>
              </div>

              <div className={styles.quizEditorialBody}>
                <div className={`${styles.infoHeader} ${styles.quizEditorialHeader}`}>
                  <div className={styles.quizProgressPill}>Quick insight</div>
                  <h1 className={styles.infoHeadline}>That answer tells us something important.</h1>
                  <p className={styles.infoSubhead}>
                    We use this to make the plan feel specific to your body, your starting point, and what will motivate
                    you most.
                  </p>
                </div>

                <div className={styles.answerInsightStage}>
                  <div className={`${styles.insightCard} ${styles.answerInsightCard}`}>
                    <div className={styles.answerInsightHeader}>
                      <span className={styles.insightIcon}>💡</span>
                      <div className={styles.answerInsightCopy}>
                        <p className={styles.insightEyebrow}>{question.question}</p>
                        <div className={styles.answerInsightChoice}>{answer}</div>
                      </div>
                    </div>

                    <p className={styles.answerInsightText}>{insight}</p>
                  </div>

                  <div className={`${styles.quizActions} ${styles.answerInsightActions}`}>
                    <button type="button" className={styles.infoCta} onClick={() => router.push(nextHref)}>
                      Continue
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                        <path d="M7 5L11.5 9L7 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <p className={styles.signupMeta}>Small details like this help make the final plan feel much more relevant.</p>
                  </div>
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
