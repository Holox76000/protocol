"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
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

/* ─── CTA button with loading state ─────────────────────────────────────── */

function CtaButton({ label, className }: { label: string; className?: string }) {
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(() => {
    setLoading(true);
  }, []);

  return (
    <a
      href="/f1/signup"
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

const DELIVERABLES = [
  {
    num: "01",
    title: "Deep assessment questionnaire",
    description:
      "A long-form questionnaire covering your body, your social context, your lifestyle, your dating situation, and your goals. Not a quiz. An intake form that makes your protocol actually yours.",
  },
  {
    num: "02",
    title: "AI body analysis",
    description:
      "Your proportions, ratios, and structural variables measured against the science of attractiveness — not gym metrics. Shoulders, waist, hips, facial harmony. Every variable that research identifies as a driver of how people perceive you.",
  },
  {
    num: "03",
    title: "3-month protocol",
    description:
      "Training built around the variables that move your perception score, not your lift numbers. Exact targets, exact sessions, exact adjustments by week. No guessing what to prioritize.",
  },
  {
    num: "04",
    title: "WhatsApp coaching",
    description:
      "Direct line to your coach throughout the 3 months. Weekly check-ins, ratio tracking, form feedback. You are not left alone with a PDF.",
  },
];

const STEPS = [
  {
    step: "1",
    title: "Complete your analysis",
    description: "Upload photos for your AI body analysis. Answer the assessment questionnaire. Takes about 20 minutes.",
  },
  {
    step: "2",
    title: "Receive your protocol",
    description: "Within 24 hours you receive your personalized 3-month program with every session, every target, every variable explained.",
  },
  {
    step: "3",
    title: "Execute with coaching",
    description: "Follow the protocol. Check in weekly on WhatsApp. Your coach tracks your ratios and adjusts as you progress.",
  },
];

const FAQS = [
  {
    q: "Will this work for my body type?",
    a: "Yes — the analysis is built around your specific proportions, not a generic template. The science behind this applies to all body types. What changes is the target and the path to get there.",
  },
  {
    q: "How is this different from a personal trainer?",
    a: "A personal trainer optimizes for muscle mass and performance. This optimizes for how people perceive you — a different goal, a different measurement, a different program. Most trainers are not trained in aesthetic medicine or attractiveness research.",
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
    name: "Marc, 27",
    detail: "Ectomorph build \u00b7 SWR 1.29 \u2192 1.44",
    before: "/assets/5-before.png",
    after: "/assets/5-after.png",
  },
  {
    obj: "Different goal. Different result.",
    quote:
      "I\u2019ve followed PPL splits, 5x5, online coaching. They build muscle. This builds the right shape for you. Different goal, different results.",
    name: "David, 34",
    detail: "Mesomorph build \u00b7 SWR 1.33 \u2192 1.47",
    before: "/assets/2-before.png",
    after: "/assets/2-after.png",
  },
];

/* ─── Component ──────────────────────────────────────────────────────────── */

export default function F1OfferPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
            <CtaButton label="Start — $49" className="f1-offer-nav__cta" />
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
            <CtaButton label="Start your Protocol — $49" className="f1-offer-cta--large" />
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

      {/* ═══ WHAT YOU GET ═══ */}
      <section id="what-you-get" className="f1-offer-deliverables f1-section">
        <div className="f1-offer-deliverables__inner">
          <div className="f1-section__header">
            <p className="f1-section__eyebrow">What you receive</p>
            <h2 className="f1-section__title f1-section__title--sm">
              Four steps.<br />
              <span>One outcome.</span>
            </h2>
          </div>
          <div className="f1-offer-deliverables__grid">
            {DELIVERABLES.map((d) => (
              <div key={d.num} className="f1-offer-deliverable-card">
                <div className="f1-offer-deliverable-card__num">{d.num}</div>
                <h3 className="f1-offer-deliverable-card__title">{d.title}</h3>
                <p className="f1-offer-deliverable-card__desc">{d.description}</p>
              </div>
            ))}
          </div>
          <div className="f1-offer-section-cta">
            <CtaButton label="Start your Protocol — $49" className="f1-offer-cta--large" />
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
            <span className="f1-offer-proof__stat-num">2,400+</span>
            <span className="f1-offer-proof__stat-label">men analyzed</span>
          </div>

          <div className="f1-testimonial-grid">
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
          <div className="f1-offer-section-cta">
            <CtaButton label="Start your Protocol — $49" className="f1-offer-cta--large" />
          </div>
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

          <div className="f1-offer-steps__grid">
            {STEPS.map((s) => (
              <div key={s.step} className="f1-offer-step">
                <div className="f1-offer-step__num">{s.step}</div>
                <h3 className="f1-offer-step__title">{s.title}</h3>
                <p className="f1-offer-step__desc">{s.description}</p>
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
                Not a bot. Not a ticketing system. A direct line to your coach. You send your weekly measurements, they track your ratios, they tell you what to adjust.
              </p>
              <p className="f1-body">
                <strong>This is what $300/month buys you with a PT.</strong> Here it&apos;s included in the $49.
              </p>
            </div>
          </div>
          <div className="f1-offer-section-cta">
            <CtaButton label="Start your Protocol — $49" className="f1-offer-cta--large" />
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
              A personal trainer costs $300/month — and gives you a generic program that doesn&apos;t know your body. This is a 3-month engagement built specifically for you, for
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

            <CtaButton label="Start your Protocol — $49" className="f1-offer-cta--large f1-offer-cta--full" />

            <div className="f1-offer-price__payment-logos">
              <span>Visa</span>
              <span>Mastercard</span>
              <span>Amex</span>
              <span>Apple Pay</span>
              <span>Google Pay</span>
            </div>

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
          <div className="f1-offer-section-cta">
            <CtaButton label="Start your Protocol — $49" className="f1-offer-cta--large" />
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="f1-offer-final f1-section">
        <div className="f1-offer-final__inner">
          <h2 className="f1-offer-final__title">
            You know what the variable is.<br />
            <span>Now find out where you stand.</span>
          </h2>
          <p className="f1-offer-final__sub">
            AI body analysis. 3-month protocol. WhatsApp coaching. $49 one-time.
          </p>
          <CtaButton label="Start your Protocol — $49" className="f1-offer-cta--large" />
          <div className="f1-offer-final__risk">
            <ShieldIcon />
            <span>90-day guarantee — if your proportions don&apos;t move, full refund</span>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="f1-footer">
        <p>© {new Date().getFullYear()} Protocol. All rights reserved.</p>
        <p>
          <TrackedLink href="/checkout?funnel=f1" eventName="f1_offer_footer_cta" eventParams={{}}>
            Start your Protocol — $49
          </TrackedLink>
        </p>
      </footer>

    </div>
  );
}
