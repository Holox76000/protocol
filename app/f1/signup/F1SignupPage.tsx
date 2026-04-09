"use client";

import { FormEvent, useEffect, useState } from "react";
import { trackGa4Event } from "../../../lib/ga4Event";
import { trackEvent } from "../../../lib/analytics";
import {
  getUtmParams,
  getPersistedUtmParams,
  persistUtmParams,
  appendUtmToPath,
} from "../../../lib/utm";
import styles from "../../visualization/visualization.module.css";

export const F1_SIGNUP_STORAGE_KEY = "f1_signup";

export default function F1SignupPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutBase, setCheckoutBase] = useState("/checkout?funnel=f1");

  useEffect(() => {
    trackGa4Event("view_signup", { funnel: "f1", page_path: "/f1/signup" });

    // Merge UTM from current URL (short funnel: ad → /f1/signup) with any
    // already-persisted params (long funnel: persisted from /f1).
    const fromUrl = getUtmParams();
    const persisted = getPersistedUtmParams();
    const merged = { ...persisted, ...fromUrl }; // URL params win
    if (Object.keys(fromUrl).length > 0) persistUtmParams(fromUrl);

    // Detect funnel type: if F1Landing set params in sessionStorage → long
    const funnelType = persisted.utm_source && !fromUrl.utm_source ? "long" : "short";
    const landingPage = funnelType === "long" ? "/f1" : "/f1/offer"; // actual entry page

    let base = `/checkout?funnel=f1&funnel_type=${funnelType}&landing_page=${encodeURIComponent(landingPage)}`;
    if (merged.utm_source) base += `&utm_source=${encodeURIComponent(merged.utm_source)}`;
    if (merged.utm_medium) base += `&utm_medium=${encodeURIComponent(merged.utm_medium)}`;
    if (merged.utm_campaign) base += `&utm_campaign=${encodeURIComponent(merged.utm_campaign)}`;
    if (merged.utm_content) base += `&utm_content=${encodeURIComponent(merged.utm_content)}`;
    if (merged.utm_term) base += `&utm_term=${encodeURIComponent(merged.utm_term)}`;
    if (merged.utm_id) base += `&utm_id=${encodeURIComponent(merged.utm_id)}`;
    if (merged.fbclid) base += `&fbclid=${encodeURIComponent(merged.fbclid)}`;

    setCheckoutBase(base);
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    const name = (data.get("firstName") as string ?? "").trim();
    const mail = (data.get("email") as string ?? "").trim();

    if (!name || !mail) {
      setError("Please fill in your first name and email.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const utm = getPersistedUtmParams();

    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: mail,
          answers: { first_name: name, funnel: "f1", source: "f1_signup" },
          segment: "f1_signup",
          completedAt: new Date().toISOString(),
          utm,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Something went wrong. Please try again.");
      }

      window.localStorage.setItem(
        F1_SIGNUP_STORAGE_KEY,
        JSON.stringify({ first_name: name, email: mail }),
      );

      // ✅ Lead fires HERE — after server confirmed the submission, not on page view.
      // Client-side pixel for browser attribution.
      const sessionId = window.localStorage.getItem("sf_quiz_session_id") ?? `lead-${Date.now()}`;
      const eventId = `${sessionId}:lead:${Date.now()}`;
      try {
        (window as Window & { fbq?: Function }).fbq?.("track", "Lead", {
          content_name: "Attractiveness Protocol",
          value: 49,
          currency: "USD",
        }, { eventID: eventId });
      } catch {
        // Ignore pixel errors — CAPI in /api/lead is the source of truth.
      }

      const checkoutHref = `${checkoutBase}&customer_email=${encodeURIComponent(mail)}`;
      trackGa4Event("signup_submitted", { funnel: "f1", destination: checkoutHref });

      window.location.assign(checkoutHref);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Please try again.");
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
                <span className={styles.introBrandLabel}>Attractiveness Protocol</span>
              </div>

              <div className={styles.infoHeader}>
                <h1 className={styles.infoHeadline}>One last step before your analysis.</h1>
                <p className={styles.infoSubhead}>
                  We&apos;ll use your email to send your protocol access.
                </p>
              </div>

              <div className={styles.signupShell}>
                <div className={styles.signupTrustRow}>
                  <span>Secure payment</span>
                  <span className={styles.infoHeroMetaDot} />
                  <span>One-time payment</span>
                  <span className={styles.infoHeroMetaDot} />
                  <span>90-day guarantee</span>
                </div>

                <form className={styles.signupForm} onSubmit={handleSubmit}>
                  <div className={styles.signupField}>
                    <label htmlFor="f1-firstName"><span>First name</span></label>
                    <input
                      id="f1-firstName"
                      type="text"
                      name="firstName"
                      autoComplete="given-name"
                      placeholder="Thomas"
                      required
                    />
                  </div>

                  <div className={styles.signupField}>
                    <label htmlFor="f1-email"><span>Email</span></label>
                    <input
                      id="f1-email"
                      type="email"
                      name="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      required
                    />
                  </div>

                  <p className={styles.signupMeta}>
                    Used only to deliver your protocol and support communications.
                  </p>

                  {error && <p className={styles.error}>{error}</p>}

                  <button type="submit" className={styles.infoCta} disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Start my protocol"}
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
