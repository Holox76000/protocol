"use client";

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
    title: "Measurable ratio shifts begin",
    desc: "SWR, CWR, torso index move within research bands.",
    mod: "",
  },
  {
    when: "Week 8",
    title: "Visible structural changes",
    desc: "Frame change perceptible to others, not just to you.",
    mod: "",
  },
  {
    when: "Week 12",
    title: "Full formula unlocked",
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
        Based on your profile, this is the projected outcome of executing the Protocol for 12 weeks.
      </p>

      <div className={styles.timelineRich}>
        {ROWS.map((r) => (
          <div
            key={r.when}
            className={`${styles.tlRow} ${r.mod === "now" ? styles.tlRowNow : ""}`}
          >
            <span className={styles.tlDot} />
            <div>
              <div className={styles.tlWhen}>{r.when}</div>
              <div className={styles.tlTitle}>{r.title}</div>
              <div className={styles.tlDesc}>{r.desc}</div>
            </div>
          </div>
        ))}
        <div className={`${styles.tlRow} ${styles.tlRowEnd}`}>
          <span className={styles.tlDot} />
          <div>
            <div className={styles.tlWhen}>{deadline}</div>
            <div className={styles.tlTitle}>Full formula active</div>
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
