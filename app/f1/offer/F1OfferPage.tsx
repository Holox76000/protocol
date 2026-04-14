"use client";

import Image from "next/image";
import AestheticTestsSection from "../../program/AestheticTestsSection";
import PersonalizedSection from "../../program/PersonalizedSection";
import InformativeSection from "../../program/InformativeSection";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { trackGa4Event } from "../../../lib/ga4Event";
import { trackEvent } from "../../../lib/analytics";
import { getUtmParams, persistUtmParams, appendUtmToPath } from "../../../lib/utm";
import TrackedLink from "../../tracked-link";
import "../../program/program.css";
import "../f1.css";
import "./f1-offer.css";

const BeforeAfterSlider = dynamic(() => import("../../program/BeforeAfterSlider"), { ssr: false });

/* ─── Icons ──────────────────────────────────────────────────────────────── */

function ArrowIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M3 9L7.5 13.5L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M16 3L5 7.5V15C5 21.075 9.85 26.77 16 28.5C22.15 26.77 27 21.075 27 15V7.5L16 3Z" stroke="#253239" strokeWidth="1.5" fill="none"/>
      <path d="M11 16L14.5 19.5L21 12" stroke="#253239" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/* ─── Payment logos ──────────────────────────────────────────────────────── */

function PaymentLogos() {
  return (
    <div className="f1-offer-price__payment-logos">
      {/* Visa */}
      <svg width="52" height="32" viewBox="0 0 52 32" aria-label="Visa" role="img">
        <rect width="52" height="32" rx="4" fill="#fff" stroke="#e2e8f0" strokeWidth="1"/>
        <text x="26" y="22" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="15" fontWeight="700" fill="#1a1f71" letterSpacing="-0.5">VISA</text>
      </svg>
      {/* Mastercard */}
      <svg width="52" height="32" viewBox="0 0 52 32" aria-label="Mastercard" role="img">
        <rect width="52" height="32" rx="4" fill="#fff" stroke="#e2e8f0" strokeWidth="1"/>
        <circle cx="20" cy="16" r="9" fill="#EB001B" opacity="0.95"/>
        <circle cx="32" cy="16" r="9" fill="#F79E1B" opacity="0.85"/>
      </svg>
      {/* Amex */}
      <svg width="52" height="32" viewBox="0 0 52 32" aria-label="American Express" role="img">
        <rect width="52" height="32" rx="4" fill="#2557D6"/>
        <text x="26" y="22" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="700" fill="#fff" letterSpacing="0.8">AMEX</text>
      </svg>
      {/* Apple Pay */}
      <svg width="64" height="32" viewBox="0 0 64 32" aria-label="Apple Pay" role="img">
        <rect width="64" height="32" rx="4" fill="#fff" stroke="#e2e8f0" strokeWidth="1"/>
        <text x="32" y="21" textAnchor="middle" fontFamily="-apple-system, BlinkMacSystemFont, Arial, sans-serif" fontSize="11" fontWeight="500" fill="#000">Apple Pay</text>
      </svg>
      {/* Google Pay */}
      <svg width="64" height="32" viewBox="0 0 64 32" aria-label="Google Pay" role="img">
        <rect width="64" height="32" rx="4" fill="#fff" stroke="#e2e8f0" strokeWidth="1"/>
        <text x="32" y="21" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="500" fill="#3c4043">G Pay</text>
      </svg>
    </div>
  );
}

/* ─── CTA button with loading state ─────────────────────────────────────── */

function CtaButton({ label, className, location, href }: { label: string; className?: string; location?: string; href: string }) {
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(() => {
    setLoading(true);
    trackGa4Event("f1_offer_cta_clicked", { funnel: "f1", cta_location: location ?? "unknown", cta_label: label });
  }, [label, location]);

  return (
    <a
      href={href}
      onClick={handleClick}
      className={`f1-offer-cta ${className ?? ""} ${loading ? "f1-offer-cta--loading" : ""}`}
      aria-disabled={loading}
    >
      {loading ? (
        <span className="f1-offer-cta__spinner" aria-hidden="true" />
      ) : (
        <>
          <span>{label}</span>
          <ArrowIcon />
        </>
      )}
    </a>
  );
}

/* ─── Data ───────────────────────────────────────────────────────────────── */

/* ─── What's Inside data ─────────────────────────────────────────────────── */

const INSIDE_STEPS = [
  {
    num: "01",
    step: "STEP ONE",
    title: "Upload 3 photos",
    desc: "Front, side, and back. 60 seconds. Photos stay private.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <rect x="2" y="5" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="11" cy="11.5" r="3" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M8 5L9.5 3H12.5L14 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    num: "02",
    step: "STEP TWO",
    title: "We analyse",
    desc: "15+ body proportions, goals & lifestyle, reviewed by your coach.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="11" cy="11" r="3" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M11 3V5M11 17V19M3 11H5M17 11H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    num: "03",
    step: "STEP THREE",
    title: "Get your protocol",
    desc: "A personalised 12-week plan in your inbox within 24 hours.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <rect x="4" y="2" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M7 7H15M7 11H15M7 15H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
];

const INSIDE_LEFT = [
  {
    label: "BODY SCORE",
    title: "15+ proportions analysed",
    desc: "Zone-by-zone breakdown with your strengths and top levers.",
  },
  {
    label: "TRAINING PROTOCOL",
    title: "Built for your ratios",
    desc: "Sessions designed to move your weakest variables. Nothing generic.",
  },
  {
    label: "COACH'S LETTER",
    title: "Your personalised note",
    desc: "Protocol, progress observations & recommendations with scientific context.",
  },
  {
    label: "LIFESTYLE PROTOCOL",
    title: "Nutrition & recovery",
    desc: "Targeted at improving your proportions and physical appearance.",
  },
];

const INSIDE_RIGHT = [
  {
    label: "ACTION PLAN",
    title: "Ranked by ROI",
    desc: "Steps prioritised by impact — not complexity. Start with what matters most.",
  },
  {
    label: "ASSESSMENT INTAKE",
    title: "Adapted to your goals",
    desc: "Long-form intake covering your body, lifestyle, and objectives.",
  },
  {
    label: "BEFORE/AFTER SIMULATION",
    title: "See your potential result",
    desc: "Visual projection of your progress at 6 weeks and 12 weeks.",
  },
  {
    label: "WHATSAPP COACHING",
    title: "Ask us anything",
    desc: "Direct access to your coach for 12 weeks. Responses within 24 hours.",
  },
];

const DELIVERABLES = [
  {
    num: "01",
    title: "Your body analysis report",
    description:
      "A full breakdown of your proportions — shoulder-to-waist ratio, chest-to-waist ratio, torso index, and perception score. Each variable benchmarked against the published research. You see exactly where you stand and what's holding your score back.",
  },
  {
    num: "02",
    title: "Your assessment intake",
    description:
      "A long-form questionnaire covering your body, lifestyle, social context, and goals. Not a quiz. The answers feed directly into your protocol — so nothing is generic, and nothing is guessed.",
  },
  {
    num: "03",
    title: "Your attractiveness dashboard",
    description:
      "Access to your personal Protocol platform — proportion scores, targets, and your 12-week training plan in one place. Every session built to move your weakest variables. You track your ratios as you progress.",
  },
  {
    num: "04",
    title: "3 months of WhatsApp coaching access",
    description:
      "A direct line to your coach for the full duration. Weekly ratio check-ins, form feedback, protocol adjustments. Not a ticketing system. A person who has your numbers and tracks them.",
  },
];

const STEPS = [
  {
    step: "1",
    title: "Day 1 — Upload and answer",
    description: "You submit your photos and complete the intake questionnaire. Takes about 20 minutes. This is the only input we need to build your protocol.",
  },
  {
    step: "2",
    title: "Day 2 — Your protocol lands",
    description: "Within 24 hours, your coach sends your body analysis report and your 12-week protocol. You read it once and know exactly what to do for the next 3 months.",
  },
  {
    step: "3",
    title: "Weeks 1–12 — You train. We track.",
    description: "You execute the sessions. Each week you send your measurements on WhatsApp. Your coach checks your ratios, flags what's moving, and adjusts where needed. By week 12, the numbers don't lie.",
  },
];

const FAQS = [
  {
    q: "Will this work for my body type?",
    a: "Yes — the analysis is built around your specific proportions, not a generic template. The science behind this applies to all body types. What changes is the target and the path to get there.",
  },
  {
    q: "How is this different from a personal trainer?",
    a: "A personal trainer optimizes for muscle mass and performance. This optimizes for how people perceive you — a different goal, a different measurement, a different protocol. Most trainers are not trained in aesthetic medicine or attractiveness research.",
  },
  {
    q: "What does WhatsApp coaching actually look like?",
    a: "Weekly check-in messages with ratio measurements, form feedback when you send videos, and protocol adjustments. You have a direct line. Responses within 24 hours on weekdays.",
  },
  {
    q: "Is the AI analysis actually accurate?",
    a: "The analysis benchmarks your proportions against published research in aesthetic medicine and evolutionary psychology. These are the same measurements used in clinical settings. The AI extracts them from photos at a precision that would take a human practitioner 45 minutes per session.",
  },
];

const TESTIMONIALS = [
  {
    obj: "13 weeks. People started noticing.",
    quote:
      "I always assumed I\u2019d be the skinny guy. Turns out my frame had more potential than I thought. 13 weeks in, people started noticing.",
    name: "Ryan, 27",
    detail: "Ectomorph build \u00b7 SWR 1.29 \u2192 1.44",
    before: "/assets/5-before.png",
    after: "/assets/5-after.png",
  },
  {
    obj: "Different goal. Different result.",
    quote:
      "I\u2019ve followed PPL splits, 5x5, online coaching. They build muscle. This builds the right shape for you. Different goal, different results.",
    name: "Jake, 34",
    detail: "Mesomorph build \u00b7 SWR 1.33 \u2192 1.47",
    before: "/assets/2-before.png",
    after: "/assets/2-after.png",
  },
  {
    obj: "I didn\u2019t lose weight. I changed shape.",
    quote:
      "Same weight at the end as when I started. But my waist is smaller, my shoulders look wider, and my girlfriend noticed before I told her about the protocol.",
    name: "Tyler, 32",
    detail: "Average build \u00b7 SWR 1.31 \u2192 1.45",
    before: "/assets/1-before.png",
    after: "/assets/1-after.png",
  },
  {
    obj: "Finally something that explained why.",
    quote:
      "I\u2019ve been training for 6 years. Good shape by any standard. But I never understood why certain guys looked more attractive without being bigger. The analysis explained it in 10 minutes.",
    name: "Connor, 31",
    detail: "Athletic build \u00b7 SWR 1.27 \u2192 1.46",
    before: "/assets/14-before.png",
    after: "/assets/14-after.png",
  },
  {
    obj: "The waist was the variable I was missing.",
    quote:
      "I was already lifting heavy, already had broad shoulders. The analysis flagged that my waist wasn\u2019t narrowing. One protocol adjustment changed everything in 8 weeks.",
    name: "Ethan, 26",
    detail: "Mesomorph build \u00b7 TI 3.8 \u2192 5.1",
    before: "/assets/8-before.png",
    after: "/assets/8-after.png",
  },
];

/* ─── Component ──────────────────────────────────────────────────────────── */

const REPORT_SLIDES = [
  { src: "/assets/analysis-screen1.jpeg", alt: "Protocol analysis report — screen 1" },
  { src: "/assets/analysis-screen2.jpeg", alt: "Protocol analysis report — screen 2" },
  { src: "/assets/analysis-screen3.jpeg", alt: "Protocol analysis report — screen 3" },
  { src: "/assets/analysis-screen4.jpeg", alt: "Protocol analysis report — screen 4" },
  { src: "/assets/analysis-screen5.jpeg", alt: "Protocol analysis report — screen 5" },
  { src: "/assets/analysis-screen6.jpeg", alt: "Protocol analysis report — screen 6" },
];

function ReportSlider() {
  const [active, setActive] = useState(0);
  const prev = () => setActive((i) => (i - 1 + REPORT_SLIDES.length) % REPORT_SLIDES.length);
  const next = () => setActive((i) => (i + 1) % REPORT_SLIDES.length);

  return (
    <div className="f1-report-slider">
      <div className="f1-report-slider__track">
        <Image
          src={REPORT_SLIDES[active].src}
          alt={REPORT_SLIDES[active].alt}
          width={1568}
          height={1580}
          sizes="(max-width: 900px) 100vw, 520px"
          style={{ width: "100%", height: "auto", display: "block" }}
          priority={active === 0}
        />
      </div>
      <div className="f1-report-slider__controls">
        <button className="f1-report-slider__arrow" onClick={prev} aria-label="Previous">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M13 4L7 10L13 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div className="f1-report-slider__dots">
          {REPORT_SLIDES.map((_, i) => (
            <button
              key={i}
              className={`f1-report-slider__dot ${i === active ? "f1-report-slider__dot--active" : ""}`}
              onClick={() => setActive(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
        <button className="f1-report-slider__arrow" onClick={next} aria-label="Next">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M7 4L13 10L7 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
      <p className="f1-report-slider__caption">Sample report — actual analysis depends on your photos and profile.</p>
    </div>
  );
}

export default function F1OfferPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [signupHref, setSignupHref] = useState("/register");
  const testimonialsRef = useRef<HTMLDivElement>(null);
  const scrollTestimonials = useCallback((dir: "left" | "right") => {
    if (!testimonialsRef.current) return;
    testimonialsRef.current.scrollBy({ left: dir === "left" ? -340 : 340, behavior: "smooth" });
  }, []);

  useEffect(() => {
    trackGa4Event("view_offer", { funnel: "f1", page_path: "/f1/offer" });
    trackEvent("view_offer", { funnel: "f1", page_path: "/f1/offer" });

    const utm = getUtmParams();
    persistUtmParams(utm);
    setSignupHref(appendUtmToPath("/register", utm));
  }, []);

  return (
    <div className="program-page program-page--theme-test f1-page f1-offer-page">

      {/* ═══ NAV ═══ */}
      <header className="program-nav f1-offer-nav">
        <div className="program-nav__inner">
          <a href="/f1" className="program-nav__logo" aria-label="Back to advertorial">
            <Image
              src="/program/static/landing/images/shared/Prtcl.png"
              alt="Protocol"
              width={44}
              height={44}
              className="program-nav__logo-image"
            />
          </a>
          <nav className="program-nav__links f1-offer-nav__links" aria-label="Page sections">
            <a href="#what-you-get">What you get</a>
            <a href="#results">Results</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className="program-nav__actions">
            <CtaButton label="Start — $49" className="f1-offer-nav__cta" location="nav" href={signupHref} />
          </div>
        </div>
      </header>

      {/* ═══ HERO ═══ */}
      <section className="f1-offer-hero f1-section">
        <div style={{ maxWidth: "900px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "12px" }}>
          <h1 className="f1-offer-hero__title" style={{ margin: 0, textAlign: "center" }}>
            Here&apos;s what your Attractiveness Protocol looks like.
          </h1>
          <Image
            src="/assets/connor-protocol.png"
            alt="Connor's Protocol"
            width={1200}
            height={900}
            style={{ width: "100%", height: "auto", display: "block", borderRadius: "12px" }}
            priority
          />
          <CtaButton label="Start your Protocol — $49" className="f1-offer-cta--large" location="hero" href={signupHref} />
          <div className="f1-offer-hero__proof" role="img" aria-label="Rated 4.9 out of 5 based on 847 reviews">
            <span className="f1-offer-hero__proof-stars" aria-hidden="true">★★★★★</span>
            <span className="f1-offer-hero__proof-score" aria-hidden="true">4.9</span>
            <span className="f1-offer-hero__proof-sep" aria-hidden="true">/5</span>
            <span className="f1-offer-hero__proof-count" aria-hidden="true">· 847 reviews</span>
          </div>
          <p className="f1-offer-hero__sub">90-day guarantee. One-time payment.</p>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="program-advice" aria-labelledby="offer-advice-title" style={{ borderTop: "none" }}>
        <div className="program-advice__inner">
          <header className="program-advice__header">
            <p className="program-advice__eyebrow">Expert Advice Enhanced by Technology</p>
            <h2 id="offer-advice-title" className="program-advice__title">
              Three steps. <span>Then it runs.</span>
            </h2>
          </header>

          <div className="program-advice__steps-shell">
            <div className="program-advice__steps">
              {[
                { number: "01 /", title: "Upload and answer" },
                { number: "02 /", title: "Your protocol lands" },
                { number: "03 /", title: "You execute. We track." },
                { number: "04 /", title: "Track your progress and\nsee dramatic results" },
              ].map((step, index, arr) => (
                <div key={step.number} className="program-advice__step-wrap">
                  <article className="program-advice__step" style={{ alignItems: "center", textAlign: "center", justifyContent: "center", gap: "2.4rem" }}>
                    <p className="program-advice__step-number">{step.number}</p>
                    <p className="program-advice__step-title" style={{ whiteSpace: "pre-line" }}>{step.title}</p>
                  </article>
                  {index < arr.length - 1 ? (
                    <div className="program-advice__step-arrow" aria-hidden="true">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PERSONALIZED ═══ */}
      <PersonalizedSection />

      {/* ═══ INFORMATIVE ═══ */}
      <InformativeSection />

      {/* ═══ AESTHETIC TESTS ═══ */}
      <AestheticTestsSection />

      {/* ═══ NOT A PDF ═══ */}
      <section className="f1-offer-notpdf f1-section">
        <div className="f1-offer-notpdf__inner">
          <div className="f1-section__header">
            <p className="f1-section__eyebrow">What you actually receive</p>
            <h2 className="f1-offer-notpdf__title">
              Simply Follow Your Plan<br /><em>See Your Attractiveness Transform</em>
            </h2>
            <p className="f1-offer-notpdf__sub">
              We provide you with a detailed transformation plan, giving you the exact steps to improve your appearance without any surgeries.
            </p>
          </div>
          <div className="f1-offer-notpdf__img-wrap">
            <Image
              src="/assets/connor-protocol.png"
              alt="Connor's Protocol"
              width={1200}
              height={900}
              style={{ width: "100%", height: "auto", display: "block", borderRadius: "16px" }}
            />
          </div>
        </div>
      </section>

      {/* ═══ SOCIAL PROOF ═══ */}
      <section id="results" className="f1-offer-proof f1-section">
        <div className="f1-offer-proof__inner">
          <div className="f1-section__header">
            <p className="f1-section__eyebrow">Results</p>
            <h2 className="f1-section__title f1-section__title--sm">
              What changes<br />
              <span>when the goal changes.</span>
            </h2>
          </div>

          <div className="f1-offer-proof__stat">
            <span className="f1-offer-proof__stat-num">2,500+</span>
            <span className="f1-offer-proof__stat-label">men analyzed</span>
          </div>

          <div className="f1-testimonials-carousel">
            <div className="f1-testimonials-carousel__controls">
              <button className="f1-testimonials-carousel__arrow" onClick={() => scrollTestimonials("left")} aria-label="Previous">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M13 4L7 10L13 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <button className="f1-testimonials-carousel__arrow" onClick={() => scrollTestimonials("right")} aria-label="Next">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M7 4L13 10L7 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
            <div className="f1-testimonial-grid" ref={testimonialsRef}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="f1-testimonial-card">
                <div className="f1-testimonial-card__images">
                  <div className="f1-testimonial-card__img-wrap">
                    <Image src={t.before} alt="Before" fill sizes="160px" />
                    <span className="f1-testimonial-card__img-label">Before</span>
                  </div>
                  <div className="f1-testimonial-card__img-wrap">
                    <Image src={t.after} alt="After" fill sizes="160px" />
                    <span className="f1-testimonial-card__img-label">After</span>
                  </div>
                </div>
                <p className="f1-testimonial-card__obj">{t.obj}</p>
                <p className="f1-testimonial-card__quote">&ldquo;{t.quote}&rdquo;</p>
                <p className="f1-testimonial-card__name">{t.name}</p>
                <p className="f1-testimonial-card__detail">{t.detail}</p>
              </div>
            ))}
            </div>
          </div>
          <div className="f1-offer-section-cta">
            <CtaButton label="Start your Protocol — $49" className="f1-offer-cta--large" location="proof" href={signupHref} />
          </div>
        </div>
      </section>

      {/* ═══ METHODOLOGY ═══ */}
      <section className="f1-offer-method f1-section">
        <div className="f1-offer-method__inner">
          <div className="f1-offer-method__images">
            <div className="f1-offer-method__img-wrap">
              <Image src="/assets/14-before.png" alt="Before the protocol" fill sizes="(max-width: 900px) 40vw, 260px" style={{ objectFit: "cover", objectPosition: "top" }} />
              <span className="f1-offer-method__img-label">Before</span>
            </div>
            <div className="f1-offer-method__img-wrap">
              <Image src="/assets/14-after.png" alt="After the protocol" fill sizes="(max-width: 900px) 40vw, 260px" style={{ objectFit: "cover", objectPosition: "top" }} />
              <span className="f1-offer-method__img-label f1-offer-method__img-label--after">After</span>
            </div>
          </div>
          <div className="f1-offer-method__copy">
            <p className="f1-section__eyebrow">The methodology</p>
            <h2 className="f1-section__title f1-section__title--sm">
              Every result starts with<br />
              <span>the right measurement.</span>
            </h2>
            <ul className="f1-offer-method__list">
              {[
                { title: "15+ structural variables", desc: "Measured from your photos — shoulder width, waist circumference, torso index, and more. Not guessed." },
                { title: "Benchmarked against research", desc: "Each variable compared against published data in aesthetic medicine and evolutionary psychology." },
                { title: "Protocol built around your gap", desc: "The 12-week plan targets only what's holding your score back. No filler, no generic programming." },
                { title: "Tracked weekly by your coach", desc: "Your ratios measured every week on WhatsApp. If something's not moving, the protocol adjusts." },
              ].map((item) => (
                <li key={item.title} className="f1-offer-method__item">
                  <span className="f1-offer-method__check"><CheckIcon /></span>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>




      {/* ═══ PRESS LOGOS ═══ */}
      <div className="program-hero__logos" style={{ justifyContent: "center", padding: "48px 24px" }} data-offer-logos>
        <p className="program-hero__logos-label">As seen in</p>
        {[
          { src: "/program/static/landing/images/home/logo/usa-today.webp", alt: "USA Today" },
          { src: "/program/static/landing/images/home/logo/the-guardian.webp", alt: "The Guardian" },
          { src: "/program/static/landing/images/home/logo/daily-mail.webp", alt: "Daily Mail" },
          { src: "/program/static/landing/images/home/logo/business-insider.webp", alt: "Business Insider" },
          { src: "/program/static/landing/images/home/logo/the-sun.webp", alt: "The Sun" },
          { src: "/program/static/landing/images/home/logo/cosmopolitan.webp", alt: "Cosmopolitan" },
          { src: "/program/static/landing/images/home/logo/mit-technology-review.webp", alt: "MIT Technology Review" },
          { src: "/program/static/landing/images/home/logo/gq.webp", alt: "GQ" },
          { src: "/program/static/landing/images/home/logo/wired.webp", alt: "Wired" },
          { src: "/program/static/landing/images/home/logo/new-york-post.webp", alt: "New York Post" },
        ].map((logo) => (
          <div key={logo.alt} className="program-hero__logo">
            <Image src={logo.src} alt={logo.alt} width={140} height={44} />
          </div>
        ))}
      </div>

      {/* ═══ PRICE BLOCK ═══ */}
      <section id="pricing" className="f1-offer-price f1-section">
        <div className="f1-offer-price__inner">
          <div className="f1-section__header">
            <p className="f1-section__eyebrow">Pricing</p>
            <h2 className="f1-section__title f1-section__title--sm">One price.<br /><span>Everything included.</span></h2>
          </div>

          <div className="f1-offer-price__card">

            <div className="f1-offer-price__amount">$49</div>
            <div className="f1-offer-price__period">one-time payment</div>

            <ul className="f1-offer-price__includes">
              {[
                "AI body analysis (proportions, ratios, perception score)",
                "Deep assessment questionnaire",
                "Personalized 3-month training protocol",
                "WhatsApp coaching for 3 months",
                "Lifetime access to your analysis and protocol",
              ].map((item) => (
                <li key={item}>
                  <span className="f1-offer-price__check"><CheckIcon /></span>
                  {item}
                </li>
              ))}
            </ul>

            <CtaButton label="Start your Protocol — $49" className="f1-offer-cta--large f1-offer-cta--full" location="pricing" href={signupHref} />

            <PaymentLogos />

            <div className="f1-offer-price__guarantee">
              <ShieldIcon />
              <div>
                <strong>90-day guarantee</strong>
                <p>Follow the protocol for 90 days. Measure your proportions. If the data hasn&apos;t moved, full refund. No conditions.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section id="faq" className="f1-offer-faq f1-section">
        <div className="f1-offer-faq__inner">
          <div className="f1-section__header">
            <p className="f1-section__eyebrow">Questions</p>
            <h2 className="f1-section__title f1-section__title--sm">
              If you&apos;re wondering<br />
              <span>about any of this.</span>
            </h2>
          </div>
          <div className="f1-offer-faq__list">
            {FAQS.map((faq, i) => (
              <div key={i} className={`f1-offer-faq__item ${openFaq === i ? "f1-offer-faq__item--open" : ""}`}>
                <button
                  className="f1-offer-faq__q"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                >
                  <span>{faq.q}</span>
                  <span className="f1-offer-faq__chevron" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                </button>
                {openFaq === i && (
                  <p className="f1-offer-faq__a">{faq.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="f1-offer-final f1-section">
        <div className="f1-offer-final__inner">
          <h2 className="f1-offer-final__title">
            You&apos;ve seen what drives perception.<br />
            <span>Now change yours.</span>
          </h2>
          <p className="f1-offer-final__sub">
            AI body analysis. 3-month protocol. WhatsApp coaching. $49 one-time.
          </p>
          <CtaButton label="Start your Protocol — $49" className="f1-offer-cta--large" location="final" href={signupHref} />
          <div className="f1-offer-final__risk">
            <ShieldIcon />
            <span>90-day guarantee — if your proportions don&apos;t move, full refund</span>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="f1-footer">
        <p>© {new Date().getFullYear()} Protocol. All rights reserved.</p>
        <nav className="f1-footer__links">
          <a href="/privacy-policy">Privacy Policy</a>
          <a href="/terms-of-service">Terms of Service</a>
          <a href="/refund-policy">Refund Policy</a>
          <a href="/medical-disclaimer">Medical Disclaimer</a>
          <a href="/contact">Contact</a>
        </nav>
        <p className="f1-footer__disclaimer">
          * Results may vary. Protocol is not a licensed medical provider. The content on this site is for informational purposes only and does not constitute medical advice. Always consult a qualified healthcare professional before beginning any new training or nutrition program. These statements have not been evaluated by the Food and Drug Administration.
        </p>
      </footer>

    </div>
  );
}
