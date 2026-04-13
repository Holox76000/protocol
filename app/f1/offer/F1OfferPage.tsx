"use client";

import Image from "next/image";
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
        <div className="f1-offer-hero__inner">
          <div className="f1-offer-hero__copy">
            <h1 className="f1-offer-hero__title">
              Turn 5 years of research into your Attractiveness Protocol.
            </h1>
            <p className="f1-offer-hero__subtitle">
              Not your weight. Not your muscle mass. Your proportions, measured against the research. Then a 3-month Protocol to close the gap.
            </p>
            <CtaButton label="Start your Protocol — $49" className="f1-offer-cta--large" location="hero" href={signupHref} />
            <div className="f1-offer-hero__proof" role="img" aria-label="Rated 4.9 out of 5 based on 847 reviews">
              <span className="f1-offer-hero__proof-stars" aria-hidden="true">★★★★★</span>
              <span className="f1-offer-hero__proof-score" aria-hidden="true">4.9</span>
              <span className="f1-offer-hero__proof-sep" aria-hidden="true">/5</span>
              <span className="f1-offer-hero__proof-count" aria-hidden="true">· 847 reviews</span>
            </div>
            <p className="f1-offer-hero__sub">90-day guarantee. One-time payment.</p>
          </div>
          <div className="f1-offer-hero__visual">
            <div className="f1-offer-hero__img-wrap">
              <BeforeAfterSlider
                beforeSrc="/assets/scan-pc-before.png"
                afterSrc="/assets/scan-pc-after.png"
                beforeAlt="Before the protocol"
                afterAlt="After the protocol"
                subject="David"
              />
            </div>

          </div>
        </div>
      </section>

      {/* ═══ WHAT'S INSIDE ═══ */}
      <section className="f1-offer-inside f1-section">
        <div className="f1-offer-inside__inner">
          <div className="f1-section__header">
            <p className="f1-section__eyebrow">What&rsquo;s inside</p>
            <h2 className="f1-section__title f1-section__title--sm">
              Here&rsquo;s what you receive.
            </h2>
            <p className="f1-offer-inside__sub">A complete breakdown of your physique — and the exact steps to change it.</p>
          </div>

          {/* 3 step cards */}
          <div className="f1-offer-inside__steps">
            {INSIDE_STEPS.map((s) => (
              <div key={s.num} className="f1-offer-inside-step">
                <div className="f1-offer-inside-step__top">
                  <div className="f1-offer-inside-step__icon">{s.icon}</div>
                  <span className="f1-offer-inside-step__num">{s.num}</span>
                </div>
                <p className="f1-offer-inside-step__label">{s.step}</p>
                <h3 className="f1-offer-inside-step__title">{s.title}</h3>
                <p className="f1-offer-inside-step__desc">{s.desc}</p>
              </div>
            ))}
          </div>

          {/* Bento grid */}
          <div className="f1-offer-inside__bento">
            {/* Left column */}
            <div className="f1-offer-inside__col">
              {INSIDE_LEFT.map((item) => (
                <div key={item.label} className="f1-offer-inside-card">
                  <p className="f1-offer-inside-card__label">{item.label}</p>
                  <h4 className="f1-offer-inside-card__title">{item.title}</h4>
                  <p className="f1-offer-inside-card__desc">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Center — photo + score badge */}
            <div className="f1-offer-inside__center">
              <div className="f1-offer-inside__photo-wrap">
                <Image
                  src="/assets/8-after.png"
                  alt="Protocol result — physique transformation"
                  fill
                  sizes="(max-width: 900px) 80vw, 320px"
                  style={{ objectFit: "cover", objectPosition: "top" }}
                />
                <div className="f1-offer-inside__score-badge">
                  <span className="f1-offer-inside__score-value">61 <span className="f1-offer-inside__score-arrow">→</span> 84</span>
                  <span className="f1-offer-inside__score-delta">+23 pts</span>
                  <span className="f1-offer-inside__score-label">ATTRACTIVENESS SCORE</span>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="f1-offer-inside__col">
              {INSIDE_RIGHT.map((item) => (
                <div key={item.label} className="f1-offer-inside-card">
                  <p className="f1-offer-inside-card__label">{item.label}</p>
                  <h4 className="f1-offer-inside-card__title">{item.title}</h4>
                  <p className="f1-offer-inside-card__desc">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ WHAT YOU GET ═══ */}
      <section id="what-you-get" className="f1-offer-deliverables f1-section">
        <div className="f1-offer-deliverables__inner">
          <div className="f1-section__header">
            <p className="f1-section__eyebrow">What you receive</p>
            <h2 className="f1-section__title f1-section__title--sm">
              Four deliverables.<br />
              <span>One outcome.</span>
            </h2>
          </div>
          <div className="f1-offer-deliverables__list">
            {DELIVERABLES.map((d) => (
              <div key={d.num} className="f1-offer-deliverable-item">
                <div className="f1-offer-deliverable-item__num">{d.num}</div>
                <div className="f1-offer-deliverable-item__body">
                  <h3 className="f1-offer-deliverable-item__title">{d.title}</h3>
                  <p className="f1-offer-deliverable-item__desc">{d.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="f1-offer-section-cta">
            <CtaButton label="Start your Protocol — $49" className="f1-offer-cta--large" location="deliverables" href={signupHref} />
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

      {/* ═══ REPORT PREVIEW ═══ */}
      <section className="f1-offer-report f1-section">
        <div className="f1-offer-report__inner">
          <div className="f1-offer-report__copy">
            <p className="f1-section__eyebrow">Your analysis</p>
            <h2 className="f1-section__title f1-section__title--sm">
              Every variable that drives perception,<br />
              <span>measured and benchmarked.</span>
            </h2>
            <p className="f1-body">
              Your protocol starts with a complete analysis of your structural variables — shoulder-to-waist ratio, chest-to-waist ratio, taper index, and more. Each one measured from your photos, compared against the research, and given a target specific to your profile.
            </p>
            <p className="f1-body">
              You see exactly where you stand. You see exactly where you need to be. And you see why each variable matters.
            </p>
            <p className="f1-body">
              This is the foundation of your protocol. Without it, training is guesswork.
            </p>
          </div>
          <ReportSlider />
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="f1-offer-steps f1-section">
        <div className="f1-offer-steps__inner">
          <div className="f1-section__header">
            <p className="f1-section__eyebrow">After purchase</p>
            <h2 className="f1-section__title f1-section__title--sm">
              Three steps.<br />
              <span>Then it runs.</span>
            </h2>
          </div>

          <div className="f1-offer-steps__timeline">
            {STEPS.map((s, i) => (
              <div key={s.step} className={`f1-offer-step-item${i === STEPS.length - 1 ? " f1-offer-step-item--last" : ""}`}>
                <div className="f1-offer-step-item__track">
                  <div className="f1-offer-step-item__dot" />
                  <div className="f1-offer-step-item__line" />
                </div>
                <div className="f1-offer-step-item__body">
                  <h3 className="f1-offer-step-item__title">{s.title}</h3>
                  <p className="f1-offer-step-item__desc">{s.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="f1-offer-steps__whatsapp">
            <div className="f1-offer-steps__whatsapp-img">
              <Image
                src="/assets/f1/whatsapp-coaching-mock.svg"
                alt="Example WhatsApp coaching exchange"
                fill
                sizes="(max-width: 900px) 100vw, 420px"
                style={{ objectFit: "contain" }}
              />
            </div>
            <div className="f1-offer-steps__whatsapp-copy">
              <p className="f1-section__eyebrow" style={{ marginBottom: "16px" }}>WhatsApp coaching</p>
              <p className="f1-body">
                Not a ticketing system. A direct line to your coach. You send your weekly measurements, they track your ratios, they tell you what to adjust.
              </p>
              <p className="f1-body">
                A personal trainer costs $300 per month. Your Attractiveness Protocol includes this level of attention for $49 total.
              </p>
            </div>
          </div>
          <div className="f1-offer-section-cta">
            <CtaButton label="Start your Protocol — $49" className="f1-offer-cta--large" location="steps" href={signupHref} />
          </div>
        </div>
      </section>

      {/* ═══ NOT A PDF ═══ */}
      <section className="f1-offer-notpdf f1-section">
        <div className="f1-offer-notpdf__inner">

          <div className="f1-section__header">
            <p className="f1-section__eyebrow">What you actually receive</p>
            <h2 className="f1-offer-notpdf__title">
              Not a PDF. <em>A complete protocol.</em>
            </h2>
            <p className="f1-offer-notpdf__sub">
              Your personal body dashboard — proportions, scores, action plan, 12-week training. Built for your ratios, delivered in 24h.
            </p>
          </div>

          {/* Mobile image replacement */}
          <div className="f1-offer-notpdf__mobile-img">
            <div className="f1-offer-notpdf__mobile-scroll">
              <Image
                src="/assets/not-a-pdf.png"
                alt="Protocol dashboard"
                width={800}
                height={600}
                style={{ height: "auto", display: "block", borderRadius: "12px" }}
              />
            </div>
            <p className="f1-offer-notpdf__mobile-hint">← Scroll to explore →</p>
          </div>

          <div className="f1-offer-notpdf__mockup">

            {/* App shell */}
            <div className="f1-offer-notpdf__app">

              {/* App header */}
              <div className="f1-offer-notpdf__app-hd">
                <div className="f1-offer-notpdf__app-brand">P</div>
                <div className="f1-offer-notpdf__app-hd-center">
                  <span className="f1-offer-notpdf__app-name">Tyler&rsquo;s <em>Protocol</em></span>
                  <span className="f1-offer-notpdf__app-tagline">Here&rsquo;s the best version of your physique.</span>
                </div>
                <div className="f1-offer-notpdf__app-profile">
                  <span>32 yo · 80 kg · 5&apos;11</span>
                  <span>Goal: Athletic V-taper</span>
                </div>
              </div>

              {/* App body: sidebar | center | scores */}
              <div className="f1-offer-notpdf__app-body">

                {/* Sidebar nav */}
                <nav className="f1-offer-notpdf__sidebar">
                  <div className="f1-offer-notpdf__sidebar-item">
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true"><rect x="1" y="1" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M3.5 4.5H9.5M3.5 6.5H9.5M3.5 8.5H7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                    Summary Report
                  </div>
                  <div className="f1-offer-notpdf__sidebar-item f1-offer-notpdf__sidebar-item--active">
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true"><path d="M1 6.5H12M1 6.5L5 2.5M1 6.5L5 10.5M12 6.5L8 2.5M12 6.5L8 10.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Before / After
                  </div>
                  <div className="f1-offer-notpdf__sidebar-item">
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true"><rect x="1" y="1" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M3.5 4.5H9.5M3.5 6.5H9.5M3.5 8.5H6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                    Body Analysis
                    <span className="f1-offer-notpdf__sidebar-badge">15+</span>
                  </div>
                  <div className="f1-offer-notpdf__sidebar-item">
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true"><path d="M2 6.5L5 9.5L11 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Action Plan
                  </div>
                  <p className="f1-offer-notpdf__sidebar-section">LIFESTYLE</p>
                  <div className="f1-offer-notpdf__sidebar-item">
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true"><path d="M6.5 1.5L8 5H11.5L8.75 7.25L9.75 11L6.5 9L3.25 11L4.25 7.25L1.5 5H5L6.5 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
                    Daily Protocol
                  </div>
                  <div className="f1-offer-notpdf__sidebar-item">
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true"><path d="M2 7C2 4.8 3.5 3 5.5 2.5C6 4 7 5 8.5 5.5C8.5 7.5 7.2 9.5 5.5 10.5C3.5 9.8 2 8.5 2 7Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><path d="M8.5 2C9.5 2.5 11 4 11 6C10 6.5 9 6.5 8.5 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
                    Nutrition Plan
                  </div>
                  <div className="f1-offer-notpdf__sidebar-item">
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true"><path d="M2 9L4 5L6.5 8L8.5 4L11 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Workout Plan
                  </div>
                  <div className="f1-offer-notpdf__sidebar-item">
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true"><path d="M2 8C2 5.8 3.8 4 6 4H7C9.2 4 11 5.8 11 8V9H2V8Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><path d="M4 4V3.5C4 2.7 4.7 2 5.5 2H7.5C8.3 2 9 2.7 9 3.5V4" stroke="currentColor" strokeWidth="1.2"/><path d="M1 9H12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                    Sleeping Advices
                  </div>
                  <div className="f1-offer-notpdf__sidebar-item">
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true"><path d="M6.5 1.5V4M6.5 9V11.5M4 3L5.5 4.5M7.5 8.5L9 10M3 5H1.5M11.5 5H10M4 7L2.5 8.5M10.5 3L9 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><circle cx="6.5" cy="6.5" r="2" stroke="currentColor" strokeWidth="1.2"/></svg>
                    Posture Analysis
                  </div>
                </nav>

                {/* Before / After center */}
                <div className="f1-offer-notpdf__center">
                  <div className="f1-offer-notpdf__ba">
                    <div className="f1-offer-notpdf__ba-img">
                      <Image src="/assets/1-before.png" alt="Before" fill sizes="200px" style={{ objectFit: "cover", objectPosition: "top" }} />
                      <span className="f1-offer-notpdf__ba-label">BEFORE</span>
                    </div>
                    <div className="f1-offer-notpdf__ba-img">
                      <Image src="/assets/1-after.png" alt="After" fill sizes="200px" style={{ objectFit: "cover", objectPosition: "top" }} />
                      <span className="f1-offer-notpdf__ba-label f1-offer-notpdf__ba-label--after">AFTER</span>
                    </div>
                  </div>
                  <div className="f1-offer-notpdf__center-footer">
                    <p className="f1-offer-notpdf__center-eyebrow">SHOULDER-WAIST RATIO</p>
                    <p className="f1-offer-notpdf__center-title">Your Ratios, Decoded.</p>
                  </div>
                </div>

                {/* Score cards */}
                <div className="f1-offer-notpdf__scores">
                  <div className="f1-offer-notpdf__score-card">
                    <p className="f1-offer-notpdf__score-eyebrow">ATTRACTIVENESS SCORE</p>
                    <p className="f1-offer-notpdf__score-val">61</p>
                    <div className="f1-offer-notpdf__score-bar">
                      <div className="f1-offer-notpdf__score-bar-fill" style={{ width: "61%" }} />
                    </div>
                    <p className="f1-offer-notpdf__score-hint">Under-optimised potential</p>
                  </div>
                  <div className="f1-offer-notpdf__score-card f1-offer-notpdf__score-card--dark">
                    <p className="f1-offer-notpdf__score-eyebrow">REALISTIC POTENTIAL</p>
                    <p className="f1-offer-notpdf__score-val">84 – 89</p>
                    <p className="f1-offer-notpdf__score-hint">High with correct execution</p>
                  </div>
                  <div className="f1-offer-notpdf__score-card">
                    <p className="f1-offer-notpdf__score-eyebrow">ARCHETYPE SHIFT</p>
                    <p className="f1-offer-notpdf__archetype-from">Average build</p>
                    <p className="f1-offer-notpdf__archetype-to">→ Athletic V-taper</p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PRICE BLOCK ═══ */}
      <section id="pricing" className="f1-offer-price f1-section">
        <div className="f1-offer-price__inner">
          <div className="f1-section__header">
            <p className="f1-section__eyebrow">Pricing</p>
            <h2 className="f1-section__title f1-section__title--sm">One price.<br /><span>Everything included.</span></h2>
          </div>

          <div className="f1-offer-price__card">
            <div className="f1-offer-price__anchor">
              A personal trainer costs $300/month — and gives you a generic protocol that doesn&apos;t know your body. This is a 3-month engagement built specifically for you, for
            </div>
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
