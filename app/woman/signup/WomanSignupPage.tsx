"use client";

import { FormEvent, useEffect, useState } from "react";
import { trackGa4Event } from "../../../lib/ga4Event";
import styles from "../../visualization/visualization.module.css";
import { SIGNUP_STORAGE_KEY } from "../quiz/woman-quiz-data";

const QUIZ_HREF = "/woman/quiz/1?funnel=woman";

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
};

const INITIAL_FORM: FormState = {
  firstName: "",
  lastName: "",
  email: "",
};

export default function WomanSignupPage() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    trackGa4Event("view_signup", {
      funnel: "woman",
      page_path: "/woman/signup",
    });
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const email = form.email.trim();

    if (!firstName || !lastName || !email) {
      setError("Please complete your first name, last name, and email.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          answers: {
            first_name: firstName,
            last_name: lastName,
            funnel: "woman",
            source: "woman_signup",
          },
          segment: "woman_signup",
          completedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "We couldn't save your details right now.");
      }

      window.localStorage.setItem(
        SIGNUP_STORAGE_KEY,
        JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
        }),
      );

      trackGa4Event("signup_submitted", {
        funnel: "woman",
        destination: QUIZ_HREF,
      });

      window.location.assign(QUIZ_HREF);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Please try again.");
    } finally {
      setIsSubmitting(false);
    }
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
                <h1 className={styles.infoHeadline}>Create your private account</h1>
                <p className={styles.infoSubhead}>
                  Enter your details to continue. We’ll use your email to send your receipt, plan access, and
                  delivery updates.
                </p>
              </div>

              <div className={styles.signupShell}>
                <div className={styles.signupTrustRow}>
                  <span>Private by default</span>
                  <span className={styles.infoHeroMetaDot} />
                  <span>No subscription</span>
                  <span className={styles.infoHeroMetaDot} />
                  <span>14-day money-back guarantee</span>
                </div>

                <form className={styles.signupForm} onSubmit={handleSubmit}>
                  <div className={styles.signupGrid}>
                    <label className={styles.signupField}>
                      <span>First name</span>
                      <input
                        type="text"
                        name="firstName"
                        autoComplete="given-name"
                        value={form.firstName}
                        onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
                        placeholder="Sophia"
                      />
                    </label>

                    <label className={styles.signupField}>
                      <span>Last name</span>
                      <input
                        type="text"
                        name="lastName"
                        autoComplete="family-name"
                        value={form.lastName}
                        onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
                        placeholder="Taylor"
                      />
                    </label>
                  </div>

                  <label className={styles.signupField}>
                    <span>Email</span>
                    <input
                      type="email"
                      name="email"
                      autoComplete="email"
                      value={form.email}
                      onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                      placeholder="you@example.com"
                    />
                  </label>

                  <p className={styles.signupMeta}>
                    We only use this to deliver your plan, receipt, and support communications.
                  </p>

                  {error ? <p className={styles.error}>{error}</p> : null}

                  <button type="submit" className={styles.infoCta} disabled={isSubmitting}>
                    {isSubmitting ? "Saving your details..." : "Continue to secure checkout"}
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                      <path d="M7 5L11.5 9L7 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </form>
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
