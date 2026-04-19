"use client";

import { useState } from "react";
import styles from "../visualization/visualization.module.css";

const OBJECTIONS = [
  {
    question: "Is $19 really all I pay?",
    answer: "Yes. One payment, lifetime access. No subscription, no hidden fees, no upsells.",
  },
  {
    question: "What if it doesn't work for me?",
    answer: "You're covered by our 14-day no-questions-asked money-back guarantee. Zero risk.",
  },
  {
    question: "How long until I get my plan?",
    answer: "Up to 7 days. Our team personally reviews your photos, questionnaire, and body metrics before delivering your protocol.",
  },
  {
    question: "Is this just another generic fitness plan?",
    answer: "No. We analyze 100+ body composition metrics specific to your frame, fat distribution, and physique goals — backed by 2,000+ peer-reviewed studies.",
  },
] as const;

export default function OfferFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className={styles.infoFaq}>
      {OBJECTIONS.map((item, index) => (
        <div
          key={item.question}
          className={`${styles.infoFaqItem} ${openIndex === index ? styles.infoFaqItemOpen : ""}`}
        >
          <button
            type="button"
            className={styles.infoFaqTrigger}
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            aria-expanded={openIndex === index}
          >
            <span>{item.question}</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className={styles.infoFaqChevron}>
              <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className={styles.infoFaqAnswer}>
            <p>{item.answer}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
