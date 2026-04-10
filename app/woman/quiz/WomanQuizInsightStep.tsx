"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { trackGa4Event } from "../../../lib/ga4Event";
import styles from "../../visualization/visualization.module.css";
import { STORAGE_KEY, WOMAN_QUIZ_QUESTIONS } from "./woman-quiz-data";

const CHECKOUT_HREF = "/checkout/hosted?funnel=woman";

type Insight = {
  label: string;
  kicker: string;
  surprise: string;
  surpriseBullets: string[];
  mistakeTitle: string;
  mistakeBullets: string[];
  summary: string;
};

const INSIGHTS: Record<string, Insight> = {
  "Morpho A": {
    label: "Morphotype A",
    kicker: "Surprising insight",
    surprise: "This is one of the most metabolically protective body types.",
    surpriseBullets: [
      "Fat stored more in the lower body is often less risky metabolically.",
      "It is frequently linked to a better insulin profile than central fat storage.",
    ],
    mistakeTitle: "Where most people get it wrong",
    mistakeBullets: [
      "People assume it is hard to transform. Usually the opposite is true.",
      "With upper-body muscle gain, the body can move toward an hourglass look very quickly.",
      "Because the waist is often already defined, the visual payoff can be dramatic.",
    ],
    summary: "This is often one of the strongest before/after body types once training becomes strategic.",
  },
  "Morpho V": {
    label: "Morphotype V",
    kicker: "Surprising insight",
    surprise: "This is the body type that can look the fittest even at a higher body-fat level.",
    surpriseBullets: [
      "Broader shoulders create an instant V-taper effect.",
      "That shape reads athletic and powerful very quickly.",
    ],
    mistakeTitle: "Hidden trap",
    mistakeBullets: [
      "If fat accumulates more in the upper body, the look can turn bulky fast.",
      "The wrong strategy is excessive upper-body work.",
      "The right strategy is often more lower-body focus plus waist tightening.",
    ],
    summary: "This body type can shift very fast from athletic to bulky depending on the strategy.",
  },
  "Morpho H": {
    label: "Morphotype H",
    kicker: "Surprising insight",
    surprise: "This is one of the most visually transformable body types.",
    surpriseBullets: [
      "The base is relatively neutral.",
      "There are fewer structural constraints than people think.",
    ],
    mistakeTitle: "Where people misread it",
    mistakeBullets: [
      "Many women think fewer curves means a harder starting point.",
      "In reality, targeted glute and shoulder work plus a slight fat loss can create shape very efficiently.",
      "It is one of the most hackable body types visually.",
    ],
    summary: "Small, precise changes can create a disproportionately strong transformation here.",
  },
  "Morpho X": {
    label: "Morphotype X",
    kicker: "Surprising insight",
    surprise: "This is the body type that loses its advantage the fastest when body fat rises.",
    surpriseBullets: [
      "The hourglass effect depends on a fine waist and strong contrast.",
      "As body fat increases, the waistline can disappear quickly.",
    ],
    mistakeTitle: "Important conclusion",
    mistakeBullets: [
      "This is not a permanently stable body type.",
      "It is closer to a state that depends heavily on body-fat management.",
    ],
    summary: "The upside is strong aesthetics. The challenge is maintaining enough contrast to preserve it.",
  },
  "Morpho O": {
    label: "Morphotype O",
    kicker: "Surprising insight",
    surprise: "This body type often creates the most dramatic before/afters.",
    surpriseBullets: [
      "Fat is concentrated more in the center, so losses become visually obvious fast.",
      "That makes changes feel especially spectacular once momentum starts.",
    ],
    mistakeTitle: "But here is the catch",
    mistakeBullets: [
      "It is often the most hormonally challenging pattern.",
      "It can also be the least stable if the routine is not sustainable.",
      "So the strategy has to be smart, not extreme.",
    ],
    summary: "This is one of the strongest transformation stories, but it needs the most stability to hold.",
  },
  "Morpho 8": {
    label: "Morphotype 8",
    kicker: "Surprising insight",
    surprise: "This is often the most aesthetically stable body type on average.",
    surpriseBullets: [
      "The waist is already marked and curves are naturally present.",
      "It can tolerate a bit more body fat without losing aesthetic balance.",
    ],
    mistakeTitle: "Critical point",
    mistakeBullets: [
      "It is still very sensitive to lower-body fat storage patterns.",
      "Without balance, it can drift toward an A shape over time.",
    ],
    summary: "It often has strong baseline perception, but balance and maintenance still matter.",
  },
};

export default function WomanQuizInsightStep() {
  const router = useRouter();
  const [bodyType, setBodyType] = useState<string>("");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        router.replace("/woman/quiz/1");
        return;
      }
      const parsed = JSON.parse(raw) as { body_type?: string };
      if (!parsed.body_type) {
        router.replace("/woman/quiz/1");
        return;
      }
      setBodyType(parsed.body_type);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
      router.replace("/woman/quiz/1");
    }
  }, [router]);

  const insight = useMemo(() => (bodyType ? INSIGHTS[bodyType] : null), [bodyType]);

  useEffect(() => {
    if (!bodyType) return;
    trackGa4Event("body_type_insight_viewed", {
      funnel: "woman",
      body_type: bodyType,
    });
  }, [bodyType]);

  if (!insight) {
    return null;
  }

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
                <div className={styles.quizProgressPill}>{insight.label}</div>
                <h1 className={styles.infoHeadline}>A useful insight about your shape</h1>
                <p className={styles.infoSubhead}>
                  Here&apos;s the interesting part: your body type gives us a very strong clue about what will look
                  visually impressive, and what most people get wrong.
                </p>
              </div>

              <div className={styles.insightCard}>
                <div className={styles.insightTop}>
                  <span className={styles.insightIcon}>💡</span>
                  <div>
                    <p className={styles.insightEyebrow}>{insight.kicker}</p>
                    <h2 className={styles.insightTitle}>{insight.surprise}</h2>
                  </div>
                </div>

                <div className={styles.insightList}>
                  {insight.surpriseBullets.map((item) => (
                    <p key={item}>{item}</p>
                  ))}
                </div>

                <div className={styles.insightDivider} />

                <div className={styles.insightWarning}>
                  <p className={styles.insightWarningTitle}>What most people miss</p>
                  <div className={styles.insightList}>
                    {insight.mistakeBullets.map((item) => (
                      <p key={item}>{item}</p>
                    ))}
                  </div>
                </div>

                <div className={styles.insightSummary}>{insight.summary}</div>
              </div>

              <div className={styles.quizActions}>
                <button
                  type="button"
                  className={styles.infoCta}
                  onClick={() => {
                    trackGa4Event("questionnaire_completed", {
                      funnel: "woman",
                      question_count: WOMAN_QUIZ_QUESTIONS.length,
                      body_type: bodyType,
                    });
                    trackGa4Event("checkout_clicked", {
                      funnel: "woman",
                      cta_location: "woman_quiz_insight",
                      destination: CHECKOUT_HREF,
                      body_type: bodyType,
                    });
                    router.push(CHECKOUT_HREF);
                  }}
                >
                  Continue to secure checkout
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <path d="M7 5L11.5 9L7 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button type="button" className={styles.secondaryButton} onClick={() => router.push("/woman/quiz/1")}>
                  Choose another body type
                </button>
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
