"use client";

import { useEffect, useState } from "react";
import TrackedLink from "../../tracked-link";
import { trackGa4Event } from "../../../lib/ga4Event";
import styles from "../../visualization/visualization.module.css";

const VALUE_ITEMS = [
  {
    icon: "scan",
    title: "Complete body composition analysis",
    description: "100+ metrics across waist, glutes, posture, shoulders, lower belly, and overall proportions.",
    anchor: "$150+ at clinics",
  },
  {
    icon: "plan",
    title: "12-week transformation protocol",
    description: "Training, nutrition, and recovery guidance shaped around your body, goals, and lifestyle.",
    anchor: "$300/mo with a coach",
  },
  {
    icon: "eye",
    title: "Realistic body visualization",
    description: "A preview of your stronger, leaner body based on your actual frame and starting point.",
    anchor: null,
  },
  {
    icon: "team",
    title: "Specialist + AI review",
    description: "Your photos and questionnaire are reviewed personally by our team within 7 days.",
    anchor: null,
  },
  {
    icon: "chat",
    title: "Direct access to our team",
    description: "Ask questions and get adjustments if something does not fit your routine or preferences.",
    anchor: null,
  },
  {
    icon: "track",
    title: "Lifetime progress tracking",
    description: "Come back and remeasure your progress whenever you want a new checkpoint.",
    anchor: null,
  },
] as const;

const OBJECTIONS = [
  {
    question: "Is $19 really all I pay?",
    answer: "Yes. One payment, lifetime access. No subscription, no hidden fees, no upsells.",
  },
  {
    question: "What if I’m not satisfied?",
    answer: "You’re covered by our 14-day money-back guarantee. Zero risk.",
  },
  {
    question: "How long until I get my plan?",
    answer: "Up to 7 days. Our team personally reviews your photos, questionnaire, and body metrics before delivering your protocol.",
  },
  {
    question: "Is this another generic fitness plan?",
    answer: "No. We analyze 100+ body-composition metrics specific to your frame, proportions, and goals before building your plan.",
  },
] as const;

const SIGNUP_HREF = "/woman/signup?funnel=woman";

export default function WomanOfferPage() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    trackGa4Event("view_offer", {
      funnel: "woman",
      offer_variant: "woman",
      page_path: "/woman/offer",
    });
  }, []);

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
                <h1 className={styles.infoHeadline}>Make this body yours</h1>
                <p className={styles.infoSubhead}>
                  Get the exact protocol to move from your current shape toward a leaner, stronger, more sculpted body
                  reviewed by specialists and grounded in research.
                </p>
              </div>

              <div className={styles.infoHeroCta}>
                <TrackedLink
                  href={SIGNUP_HREF}
                  className={styles.infoCta}
                  eventName="signup_cta_clicked"
                  eventParams={{
                    funnel: "woman",
                    cta_label: "Get my transformation plan — $19",
                    cta_location: "woman_offer_hero",
                    destination: SIGNUP_HREF,
                  }}
                >
                  Get my transformation plan — $19
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <path d="M7 5L11.5 9L7 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </TrackedLink>
                <div className={styles.infoHeroMeta}>
                  <span>One-time payment</span>
                  <span className={styles.infoHeroMetaDot} />
                  <span>14-day money-back guarantee</span>
                </div>
              </div>

              <div className={styles.infoValueStack}>
                <div className={styles.infoValueLabel}>Everything included</div>
                {VALUE_ITEMS.map((item) => (
                  <div key={item.title} className={styles.infoValueItem}>
                    <div className={styles.infoValueIcon}>
                      {item.icon === "scan" && <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.3" /><path d="M2 10h16M7 2v16M13 2v16" stroke="currentColor" strokeWidth="1.3" opacity="0.4" /></svg>}
                      {item.icon === "plan" && <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 3h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.3" /><path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>}
                      {item.icon === "eye" && <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z" stroke="currentColor" strokeWidth="1.3" /><circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.3" /></svg>}
                      {item.icon === "team" && <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.3" /><circle cx="13" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.3" /><path d="M1 16c0-2.5 2.5-4.5 6-4.5.5 0 1 .04 1.5.12M13 11.5c3.5 0 6 2 6 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>}
                      {item.icon === "chat" && <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 4h14a1 1 0 011 1v8a1 1 0 01-1 1h-4l-3 3-3-3H3a1 1 0 01-1-1V5a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.3" /><path d="M7 8h6M7 11h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>}
                      {item.icon === "track" && <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 15l4-5 3 3 4-6 3 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /><circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.3" /></svg>}
                    </div>
                    <div className={styles.infoValueCopy}>
                      <strong>{item.title}</strong>
                      <span>{item.description}</span>
                    </div>
                    {item.anchor ? <span className={styles.infoValueAnchor}>{item.anchor}</span> : null}
                  </div>
                ))}
              </div>

              <div className={styles.infoProcess}>
                <div className={styles.infoProcessStep}>
                  <span className={styles.infoProcessNum}>1</span>
                  <div>
                    <strong>Complete your assessment</strong>
                    <span>Detailed questions about your goals, lifestyle, training, and recovery</span>
                  </div>
                </div>
                <div className={styles.infoProcessDivider} />
                <div className={styles.infoProcessStep}>
                  <span className={styles.infoProcessNum}>2</span>
                  <div>
                    <strong>Upload your photos</strong>
                    <span>So we can read your proportions, posture, and body-composition pattern accurately</span>
                  </div>
                </div>
                <div className={styles.infoProcessDivider} />
                <div className={styles.infoProcessStep}>
                  <span className={styles.infoProcessNum}>3</span>
                  <div>
                    <strong>Receive your full plan</strong>
                    <span>Your personalized protocol arrives after specialist + AI review</span>
                  </div>
                </div>
              </div>

              <div className={styles.infoPriceBlock}>
                <div className={styles.infoPriceRow}>
                  <div className={styles.infoPriceAmount}>
                    <span className={styles.infoPriceDollar}>$</span>
                    <span className={styles.infoPriceNumber}>19</span>
                    <span className={styles.infoPriceOnce}>one-time</span>
                  </div>
                  <div className={styles.infoPriceAnchorLine}>
                    What personalized coaching often charges <strong>$300/month</strong> for
                  </div>
                </div>

                <TrackedLink
                  href={SIGNUP_HREF}
                  className={styles.infoCta}
                  eventName="signup_cta_clicked"
                  eventParams={{
                    funnel: "woman",
                    cta_label: "Get my transformation plan — $19",
                    cta_location: "woman_offer_primary",
                    destination: SIGNUP_HREF,
                  }}
                >
                  Get my transformation plan — $19
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <path d="M7 5L11.5 9L7 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </TrackedLink>
              </div>

              <div className={styles.infoFaq}>
                {OBJECTIONS.map((item, index) => (
                  <div key={item.question} className={`${styles.infoFaqItem} ${openFaqIndex === index ? styles.infoFaqItemOpen : ""}`}>
                    <button
                      type="button"
                      className={styles.infoFaqTrigger}
                      onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                      aria-expanded={openFaqIndex === index}
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

              <div className={styles.infoFinalCta}>
                <p className={styles.infoFinalText}>Start your transformation — risk-free</p>
                <TrackedLink
                  href={SIGNUP_HREF}
                  className={styles.infoCta}
                  eventName="signup_cta_clicked"
                  eventParams={{
                    funnel: "woman",
                    cta_label: "Get my transformation plan — $19",
                    cta_location: "woman_offer_final",
                    destination: SIGNUP_HREF,
                  }}
                >
                  Get my transformation plan — $19
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <path d="M7 5L11.5 9L7 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </TrackedLink>
                <p className={styles.infoFinalGuarantee}>14-day money-back guarantee. No questions asked.</p>
              </div>
            </div>
          </section>
        </div>

        <footer className={styles.footer}>
          <span className={styles.footerCopy}>© {currentYear} Protocol. All rights reserved.</span>
        </footer>
      </div>
    </main>
  );
}
