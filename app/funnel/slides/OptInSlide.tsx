"use client";

import { useState } from "react";
import styles from "./slides.module.css";

type Props = {
  onSubmit: (firstName: string, email: string) => Promise<void>;
};

export function OptInSlide({ onSubmit }: Props) {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = firstName.trim();
    const mail = email.trim();

    if (!name) {
      setError("Please enter your first name.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(mail)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    await onSubmit(name, mail);
  };

  return (
    <div className={styles.card}>
      <div className={styles.prReadyInner}>
        <div className={styles.prQualBadge}>Analysis ready</div>

        <h2 className={styles.prReadyTitle}>
          Where should we send your analysis?
        </h2>

        <p className={styles.prReadySubtext}>
          Your personalized analysis is ready. Enter your details to receive it by email.
        </p>
      </div>

      <form className={styles.optinForm} onSubmit={handleSubmit}>
        <label className={styles.optinLabel}>
          <span className={styles.optinLabelText}>First name</span>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Alex"
            autoComplete="given-name"
            className={styles.optinInput}
            disabled={isSubmitting}
          />
        </label>

        <label className={styles.optinLabel}>
          <span className={styles.optinLabelText}>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className={styles.optinInput}
            disabled={isSubmitting}
          />
        </label>

        {error && <p className={styles.optinError}>{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className={styles.btnPrimary}
        >
          {isSubmitting ? "Sending…" : "Get My Analysis →"}
        </button>
      </form>

      <p className={styles.prReadyPrivacy}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <rect x="1" y="5" width="10" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
          <path d="M3.5 5V3.5a2.5 2.5 0 0 1 5 0V5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
        No spam. Unsubscribe anytime.
      </p>
    </div>
  );
}
