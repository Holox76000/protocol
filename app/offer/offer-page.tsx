"use client";

import { useEffect, useState } from "react";
import TrackedLink from "../tracked-link";
import { getFunnelConfig } from "../../lib/funnels";
import { trackGa4Event } from "../../lib/ga4Event";
import styles from "../visualization/visualization.module.css";

const VALUE_ITEMS = [
  {
    icon: "scan",
    title: "Complete body composition analysis",
    description: "100+ metrics across chest, waist, shoulders, belly, posture, and fat distribution.",
    anchor: "$150+ at clinics",
  },
  {
    icon: "plan",
    title: "12-week transformation protocol",
    description: "Training, nutrition, and supplements — built for your specific body type and goals.",
    anchor: "$300/mo with a trainer",
  },
  {
    icon: "eye",
    title: "Realistic body visualization",
    description: "Your target physique based on your actual frame, proportions, and genetics.",
    anchor: null,
  },
  {
    icon: "team",
    title: "Specialist + AI review",
    description: "Your photos and questionnaire analyzed personally by our team within 7 days.",
    anchor: null,
  },
  {
    icon: "chat",
    title: "Direct access to our team",
    description: "Ask questions, get adjustments. We adapt if something doesn't fit your lifestyle.",
    anchor: null,
  },
  {
    icon: "track",
    title: "Lifetime progress tracking",
    description: "Rebook your analysis anytime to measure results and adjust your protocol.",
    anchor: null,
  },
] as const;

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

export default function OfferPage() {
  const funnelConfig = getFunnelConfig("main");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    trackGa4Event("view_offer", {
      funnel: "main",
      offer_variant: "main",
      page_path: "/offer",
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
                <span className={styles.introBrandLabel}>Transformation Plan</span>
              </div>

              <div className={styles.infoHeader}>
                <h1 className={styles.infoHeadline}>Make this body yours</h1>
                <p className={styles.infoSubhead}>
                  Get the exact protocol to move from your current physique toward a leaner, stronger body — reviewed by specialists using 2,000+ peer-reviewed studies.
                </p>
              </div>

              <div className={styles.infoHeroCta}>
                <TrackedLink
                  href={funnelConfig.checkoutHref}
                  className={styles.infoCta}
                  eventName="checkout_clicked"
                  eventParams={{
                    funnel: "main",
                    cta_label: "Get my transformation plan — $19",
                    cta_location: "offer_hero",
                    destination: funnelConfig.checkoutHref,
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
                      {item.icon === "scan" && (
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.3" /><path d="M2 10h16M7 2v16M13 2v16" stroke="currentColor" strokeWidth="1.3" opacity="0.4" /></svg>
                      )}
                      {item.icon === "plan" && (
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 3h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.3" /><path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
                      )}
                      {item.icon === "eye" && (
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z" stroke="currentColor" strokeWidth="1.3" /><circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.3" /></svg>
                      )}
                      {item.icon === "team" && (
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.3" /><circle cx="13" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.3" /><path d="M1 16c0-2.5 2.5-4.5 6-4.5.5 0 1 .04 1.5.12M13 11.5c3.5 0 6 2 6 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
                      )}
                      {item.icon === "chat" && (
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 4h14a1 1 0 011 1v8a1 1 0 01-1 1h-4l-3 3-3-3H3a1 1 0 01-1-1V5a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.3" /><path d="M7 8h6M7 11h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
                      )}
                      {item.icon === "track" && (
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 15l4-5 3 3 4-6 3 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /><circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.3" /></svg>
                      )}
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
                    <span>~10 min questionnaire about your habits, goals, and lifestyle</span>
                  </div>
                </div>
                <div className={styles.infoProcessDivider} />
                <div className={styles.infoProcessStep}>
                  <span className={styles.infoProcessNum}>2</span>
                  <div>
                    <strong>We personally build your protocol</strong>
                    <span>Our team + AI reviews your case individually — not an automated template. Delivered within 7 days.</span>
                  </div>
                </div>
                <div className={styles.infoProcessDivider} />
                <div className={styles.infoProcessStep}>
                  <span className={styles.infoProcessNum}>3</span>
                  <div>
                    <strong>Follow your plan, track your progress</strong>
                    <span>Personalized protocol, lifetime access, team support. You&apos;ll receive a confirmation email immediately.</span>
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
                    What personal trainers charge <strong>$300/month</strong> for
                  </div>
                </div>

                <TrackedLink
                  href={funnelConfig.checkoutHref}
                  className={styles.infoCta}
                  eventName="checkout_clicked"
                  eventParams={{
                    funnel: "main",
                    cta_label: "Get my transformation plan — $19",
                    cta_location: "offer_primary",
                    destination: funnelConfig.checkoutHref,
                  }}
                >
                  Get my transformation plan — $19
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <path d="M7 5L11.5 9L7 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </TrackedLink>

                <div className={styles.infoTrustRow}>
                  <span className={styles.infoTrustItem}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="3" y="7.5" width="10" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" /><path d="M5 7.5V5C5 2.79086 6.79086 1 9 1V1C11.2091 1 13 2.79086 13 5V7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /><circle cx="8" cy="10.75" r="1" fill="currentColor" /></svg>
                    Secure payment
                  </span>
                  <span className={styles.infoTrustItem}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    14-day money-back guarantee
                  </span>
                  <span className={styles.infoTrustItem}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    No subscription
                  </span>
                </div>

                <div className={styles.infoPayments}>
                  <img src="/program/static/landing/images/home/pricing/visa.webp" alt="Visa" width="60" height="20" />
                  <img src="/program/static/landing/images/home/pricing/mastercard.webp" alt="Mastercard" width="42" height="20" />
                  <img src="/program/static/landing/images/home/pricing/stripe.webp" alt="Stripe" width="52" height="20" />
                  <img src="/program/static/landing/images/home/pricing/paypal.webp" alt="PayPal" width="22" height="20" />
                  <img src="/program/static/landing/images/home/pricing/applepay.webp" alt="Apple Pay" width="20" height="20" />
                </div>
              </div>

              <div className={styles.infoSocialProof}>
                <div className={styles.infoSocialStat}>
                  <strong>25,000+</strong> men have started their transformation
                </div>

                <div className={styles.infoTestimonials}>
                  <div className={styles.infoTestimonial}>
                    <div className={styles.infoTestimonialStars}>
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} width="14" height="14" viewBox="0 0 14 14" fill="#e8a438"><path d="M7 1l1.76 3.57 3.94.57-2.85 2.78.67 3.93L7 10.07l-3.52 1.78.67-3.93L1.3 5.14l3.94-.57L7 1z" /></svg>
                      ))}
                    </div>
                    <p>&ldquo;I was skeptical about $19 but the analysis was more detailed than the $200 nutrition coach I used before. Actually specific to my body, not a template.&rdquo;</p>
                    <cite>— Marcus, 28</cite>
                  </div>
                  <div className={styles.infoTestimonial}>
                    <div className={styles.infoTestimonialStars}>
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} width="14" height="14" viewBox="0 0 14 14" fill="#e8a438"><path d="M7 1l1.76 3.57 3.94.57-2.85 2.78.67 3.93L7 10.07l-3.52 1.78.67-3.93L1.3 5.14l3.94-.57L7 1z" /></svg>
                      ))}
                    </div>
                    <p>&ldquo;The protocol is what actually changed my body. Down 14lbs in 10 weeks and I look completely different.&rdquo;</p>
                    <cite>— Jake, 31</cite>
                  </div>
                </div>

                <blockquote className={styles.infoQuote}>
                  <p>&ldquo;Protocol gives men a science-backed roadmap that replaces guesswork with precision. I recommend it.&rdquo;</p>
                  <cite>— Jonathan Zelken, MD — Board-Certified Plastic Surgeon</cite>
                </blockquote>
                <div className={styles.infoFeaturedIn}>
                  <span>Featured in</span>
                  <div className={styles.infoLogos}>
                    <img src="/program/static/landing/images/home/logo/usa-today.webp" alt="USA Today" />
                    <img src="/program/static/landing/images/home/logo/gq.webp" alt="GQ" />
                    <img src="/program/static/landing/images/home/logo/business-insider.webp" alt="Business Insider" />
                  </div>
                </div>
              </div>

              <div className={styles.infoFaq}>
                {OBJECTIONS.map((item, index) => (
                  <div
                    key={item.question}
                    className={`${styles.infoFaqItem} ${openFaqIndex === index ? styles.infoFaqItemOpen : ""}`}
                  >
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
                  href={funnelConfig.checkoutHref}
                  className={styles.infoCta}
                  eventName="checkout_clicked"
                  eventParams={{
                    funnel: "main",
                    cta_label: "Get my transformation plan — $19",
                    cta_location: "offer_final",
                    destination: funnelConfig.checkoutHref,
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
