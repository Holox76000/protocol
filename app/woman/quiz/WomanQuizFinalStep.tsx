"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { trackGa4Event } from "../../../lib/ga4Event";
import styles from "../../visualization/visualization.module.css";
import { SIGNUP_STORAGE_KEY, STORAGE_KEY, WOMAN_QUIZ_QUESTIONS } from "./woman-quiz-data";
import { persistWomanQuizLead } from "./persistWomanQuizLead";

const CHECKOUT_HREF = "/checkout/hosted?funnel=woman";

export default function WomanQuizFinalStep() {
  const router = useRouter();
  const [isContinuing, setIsContinuing] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        router.replace("/woman/quiz/1");
        return;
      }

      const parsed = JSON.parse(raw) as Record<string, string>;
      const isComplete = WOMAN_QUIZ_QUESTIONS.every((question) => Boolean(parsed[question.id]));

      if (!isComplete) {
        router.replace("/woman/quiz/1");
        return;
      }

      trackGa4Event("questionnaire_completed", {
        funnel: "woman",
        question_count: WOMAN_QUIZ_QUESTIONS.length,
      });
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
      router.replace("/woman/quiz/1");
    }
  }, [router]);

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
                  <div className={styles.quizProgressPill}>Your plan is ready</div>
                  <h1 className={styles.infoHeadline}>We've mapped the direction your body is most likely to respond to.</h1>
                  <p className={styles.infoSubhead}>
                    Based on your answers, your body responds best to a specific type of approach. We&apos;ve prepared a
                    personalized transformation plan for you.
                  </p>
                </div>

                <div className={`${styles.insightCard} ${styles.finalQuizCard}`}>
                  <div className={styles.finalQuizLine}>
                    Your answers gave us a much clearer view of what you want to change, where your frustration comes
                    from, and how quickly you want results.
                  </div>
                  <div className={styles.finalQuizLine}>
                    The next step is unlocking the personalized plan built around that profile.
                  </div>
                </div>

                <div className={`${styles.quizActions} ${styles.answerInsightActions}`}>
                  <button
                    type="button"
                    className={styles.infoCta}
                    disabled={isContinuing}
                    onClick={async () => {
                      if (isContinuing) return;
                      setIsContinuing(true);

                      await persistWomanQuizLead({
                        quiz_completed: "true",
                      }, {
                        source: "woman_quiz_completed",
                        segment: "woman_quiz_completed",
                      });

                      try {
                        window.localStorage.removeItem(STORAGE_KEY);
                      } catch {}

                      try {
                        window.localStorage.removeItem(SIGNUP_STORAGE_KEY);
                      } catch {}

                      trackGa4Event("checkout_clicked", {
                        funnel: "woman",
                        cta_location: "woman_quiz_final",
                        destination: CHECKOUT_HREF,
                      });
                      router.push(CHECKOUT_HREF);
                    }}
                  >
                    {isContinuing ? "Preparing your plan..." : "Unlock My Personalized Plan"}
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                      <path d="M7 5L11.5 9L7 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <p className={styles.signupMeta}>You’re one step away from seeing the personalized recommendation we prepared.</p>
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
