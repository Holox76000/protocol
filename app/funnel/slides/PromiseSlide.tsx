"use client";

import styles from "./slides.module.css";

type Props = {
  onNext: () => void;
  onBack: () => void;
};

function getDeadlineDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 84); // +12 weeks
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

const MILESTONES = [
  { week: 4, label: "Measurable ratio shifts begin" },
  { week: 8, label: "Visible structural changes" },
  { week: 12, label: "Full formula unlocked" },
];

export function PromiseSlide({ onNext, onBack }: Props) {
  const deadline = getDeadlineDate();

  return (
    <div className={styles.card}>
      <div className={styles.summaryHeader}>
        <span className={styles.bsTag}>Your 12-Week Outlook</span>
        <h2 className={styles.summaryTitle}>Your projected transformation.</h2>
      </div>

      <div className={styles.promiseTimeline}>
        <div className={styles.promiseRow}>
          <div className={styles.promiseDot} />
          <span className={styles.promiseWeek}>TODAY</span>
          <span className={styles.promiseMilestone}>Protocol begins</span>
        </div>

        {MILESTONES.map(({ week, label }, i) => (
          <div key={week} className={styles.promiseRow}>
            <div className={`${styles.promiseConnector}`} />
            <div className={`${styles.promiseDot} ${i === MILESTONES.length - 1 ? styles.promiseDotFinal : ""}`} />
            <span className={styles.promiseWeek}>Week {week}</span>
            <span className={styles.promiseMilestone}>{label}</span>
          </div>
        ))}

        <div className={styles.promiseRow}>
          <div className={styles.promiseConnector} />
          <div className={`${styles.promiseDot} ${styles.promiseDotDeadline}`} />
          <span className={`${styles.promiseWeek} ${styles.promiseDeadlineDate}`}>{deadline}</span>
          <span className={`${styles.promiseMilestone} ${styles.promiseFinalLabel}`}>
            Full formula active
          </span>
        </div>
      </div>

      <p className={styles.summaryCaption}>
        Based on your profile, this is the projected outcome of executing the Protocol for 12 weeks.
      </p>

      <div className={styles.actions}>
        <button type="button" className={styles.btnSecondary} onClick={onBack}>
          Back
        </button>
        <button type="button" className={styles.btnPrimary} onClick={onNext}>
          Continue →
        </button>
      </div>
    </div>
  );
}
