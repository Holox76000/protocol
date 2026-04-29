"use client";

import { Fragment } from "react";
import styles from "./slides.module.css";

type Props = {
  onNext: () => void;
  onBack: () => void;
};

function getDeadlineDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 84);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const ROWS = [
  {
    when: "Today",
    title: "Protocol begins",
    desc: "Baseline locked. First 7-day routine deployed.",
    mod: "now",
  },
  {
    when: "Week 4",
    title: "You start seeing visible results",
    desc: "SWR, CWR, torso index move within research bands.",
    mod: "",
  },
  {
    when: "Week 8",
    title: "People start to treat you differently",
    desc: "Frame change perceptible to others, not just to you.",
    mod: "",
  },
  {
    when: "Week 12",
    title: "You start to feel like in a new body",
    desc: "Calibration complete. Routine becomes self-directed.",
    mod: "",
  },
];

export function PromiseSlide({ onNext, onBack }: Props) {
  const deadline = getDeadlineDate();

  return (
    <div className={styles.card}>
      <div className={styles.summaryHeader}>
        <span className={styles.bsTag}>Your 12-Week Outlook</span>
        <h2 className={styles.summaryTitle}>Your projected transformation.</h2>
      </div>

      <p className={styles.subtext}>
        This is the projected outcome of executing the Protocol for 12 weeks.
      </p>

      <div className={styles.timelineRich}>
        {ROWS.map((r, i) => (
          <Fragment key={r.when}>
            <div className={`${styles.tlRow} ${r.mod === "now" ? styles.tlRowNow : ""}`}>
              <span className={styles.tlDot} />
              <div>
                <div className={styles.tlWhen}>{r.when}</div>
                <div className={styles.tlTitle}>{r.title}</div>
                {r.desc && <div className={styles.tlDesc}>{r.desc}</div>}
              </div>
            </div>
            <div className={styles.tlArrow} />
          </Fragment>
        ))}
        <div className={`${styles.tlRow} ${styles.tlRowEnd}`}>
          <span className={styles.tlDot} />
          <div>
            <div className={styles.tlWhen}>{deadline}</div>
            <div className={styles.tlTitle}>You reach your peak potential</div>
            <div className={styles.tlDesc}>Maintenance mode. Long-form data review.</div>
          </div>
        </div>
      </div>

      <div className={styles.actionsFull}>
        <button type="button" className={styles.btnPrimary} onClick={onNext}>
          I'm ready to continue →
        </button>
      </div>
    </div>
  );
}
