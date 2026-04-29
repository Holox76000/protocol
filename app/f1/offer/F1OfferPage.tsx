"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { trackGa4Event } from "../../../lib/ga4Event";
import { trackEvent } from "../../../lib/analytics";
import { getUtmParams, persistUtmParams, appendUtmToPath } from "../../../lib/utm";
import "../f1.css";
import "./f1-offer.css";
import "../../program/program.css";
import CompleteFacialAnalysisSection from "../../program/CompleteFacialAnalysisSection";
import PersonalizedSection from "../../program/PersonalizedSection";
import InformativeSection from "../../program/InformativeSection";
import AestheticTestsSection from "../../program/AestheticTestsSection";
import ProtocolSection from "../../program/ProtocolSection";

/* ─── Icons ─────────────────────────────────────────────────────────────── */

function ArrowIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8L7 12L13 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function XIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 1l2.09 4.26L14.8 6l-3.4 3.32.8 4.68L8 11.77 3.8 14l.8-4.68L1.2 6l4.71-.74L8 1z" />
    </svg>
  );
}

/* ─── renderTitle helper ────────────────────────────────────────────────── */

type TitlePart = string | { em: string };

function renderTitle(parts: TitlePart | TitlePart[]) {
  if (!Array.isArray(parts)) return <>{parts}</>;
  return (
    <>
      {parts.map((p, i) => {
        if (typeof p === "string") return <span key={i}>{p}</span>;
        if (p && "em" in p) return <em key={i}>{p.em}</em>;
        return null;
      })}
    </>
  );
}

/* ─── CTA button ─────────────────────────────────────────────────────────── */

function CtaButton({
  label,
  className,
  location,
  href,
}: {
  label: string;
  className?: string;
  location?: string;
  href: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(() => {
    setLoading(true);
    trackGa4Event("f1_offer_cta_clicked", {
      funnel: "f1",
      cta_location: location ?? "unknown",
      cta_label: label,
    });
  }, [label, location]);

  return (
    <a
      href={href}
      onClick={handleClick}
      className={`mo-cta ${className ?? ""} ${loading ? "mo-cta--loading" : ""}`}
      aria-disabled={loading}
    >
      {loading ? (
        <span className="mo-cta__spinner" aria-hidden="true" />
      ) : (
        <>
          <span>{label}</span>
          <ArrowIcon size={16} />
        </>
      )}
    </a>
  );
}

/* ─── Data ───────────────────────────────────────────────────────────────── */

const STEPS = [
  {
    num: "01",
    time: "60 SEC",
    title: "Upload three photos",
    desc: "Front, side, back. 60 seconds, stays private. We pull 100+ markers.",
    img: "/assets/body-fat-analysis.png",
  },
  {
    num: "02",
    time: "48H",
    title: "We analyse",
    desc: "AI benchmarks your ratios against the research, then your coach reviews the output and writes the protocol.",
    img: "/assets/analysis-card.png",
  },
  {
    num: "03",
    time: "12 WEEKS",
    title: "Get your protocol",
    desc: "A personalised 12-week Protocol built to move your weakest variables.",
    img: "/assets/connor-protocol.png",
  },
];

const RESULTS = [
  { name: "Ryan, 27", ratio: "ATTRACTIVENESS SCORE 45 → 67", before: "/assets/5-before.png", after: "/assets/5-after.png" },
  { name: "Jake, 34", ratio: "ATTRACTIVENESS SCORE 45 → 67", before: "/assets/2-before.png", after: "/assets/2-after.png" },
  { name: "Marcus, 31", ratio: "ATTRACTIVENESS SCORE 45 → 67", before: "/assets/14-before.png", after: "/assets/14-after.png" },
];

const SCIENCE_VARS = [
  { num: "01", name: "Shoulder-to-waist ratio", sub: "Primary V-taper indicator", val: "1.29 → 1.44" },
  { num: "02", name: "Chest-to-waist ratio", sub: "Upper-body proportion", val: "1.18 → 1.32" },
  { num: "03", name: "Torso index", sub: "Length vs. width balance", val: "3.8 → 5.1" },
  { num: "04", name: "Hip-to-shoulder ratio", sub: "Lower-frame anchoring", val: "0.74 → 0.69" },
  { num: "05", name: "Posture grade (cervical)", sub: "Forward-head + thoracic", val: "54 → 87/100" },
  { num: "06", name: "Body-fat distribution", sub: "8 visceral / subcutaneous zones", val: "— mapped" },
  { num: "+100", name: "Hundred more variables", sub: "Arm, neck, calf, posterior, gait", val: "— measured" },
];

const COMPARE_ROWS = [
  {
    feature: "Personalised to your frame",
    app: <XIcon />, pt: "Sometimes",
    us: <span className="mo-compare__check"><CheckIcon /> Your ratios, your plan</span>,
  },
  {
    feature: "Backed by published research",
    app: "Partial", pt: <XIcon />,
    us: <span className="mo-compare__check"><CheckIcon /> Measured outcomes</span>,
  },
  {
    feature: "Direct access to your coach",
    app: <XIcon />, pt: "In-person only",
    us: <span className="mo-compare__check"><CheckIcon /> WhatsApp · 6h reply</span>,
  },
  {
    feature: "Refund if it doesn't work",
    app: <XIcon />, pt: <XIcon />,
    us: <span className="mo-compare__check"><CheckIcon /> 90-day, no questions</span>,
  },
  {
    feature: "Commitment",
    app: "Monthly sub", pt: "$200/session",
    us: "One-time · $89",
  },
];

const TESTIMONIALS = [
  {
    quote: ["I didn't lose weight. ", { em: "I changed shape." }] as TitlePart[],
    name: "Ryan, 27", meta: "13 weeks",
  },
  {
    quote: ["Same suit. ", { em: "Different fit." }] as TitlePart[],
    name: "Jake, 34", meta: "12 weeks",
  },
  {
    quote: ["First thing that named the actual problem."] as TitlePart[],
    name: "Marcus, 31", meta: "16 weeks",
  },
];

const PRICING_BULLETS = [
  "100+ structural variables analysed by AI + coach review",
  "Personalised 12-week protocol",
  "Direct line to our experts — reply within 6 hours",
  "Weekly check-ins, weekly adjustments",
  "Full refund if your attractiveness hasn't moved",
];

const FAQS = [
  {
    q: "Will this work for my body type?",
    a: "Yes. The protocol is built from your photos and measurements — ectomorph, mesomorph, endomorph, or any mix. We've shipped protocols for frames across the spectrum; the method doesn't assume your starting point.",
  },
  {
    q: "How is this different from a personal trainer?",
    a: "A trainer prescribes from experience. We prescribe from your measurements. The plan is written to move specific ratios — and you can ask your coach anything on WhatsApp, the same way.",
  },
  {
    q: "What does expert access actually look like?",
    a: "A direct WhatsApp thread with the coach who wrote your protocol. Reply times under 6h on weekdays. Weekly check-ins, weekly recalibration if needed.",
  },
  {
    q: "Is the AI analysis actually accurate?",
    a: "The vision model has been trained on 12,000+ labelled body scans. A human coach validates every output before your protocol is written.",
  },
  {
    q: "What if my ratios don't move?",
    a: "Full refund. We track the ratios on day 0, day 45, day 90. If the data hasn't moved, we don't deserve to keep the $89.",
  },
  {
    q: "How much time per week?",
    a: "3–4 hours of training. 15 minutes a day on nutrition. The protocol is engineered for men with jobs.",
  },
];

const PRESS_LOGOS = [
  { src: "/program/static/landing/images/home/logo/gq.webp", alt: "GQ" },
  { src: "/program/static/landing/images/home/logo/wired.webp", alt: "Wired" },
  { src: "/program/static/landing/images/home/logo/the-guardian.webp", alt: "The Guardian" },
  { src: "/program/static/landing/images/home/logo/business-insider.webp", alt: "Business Insider" },
  { src: "/program/static/landing/images/home/logo/mit-technology-review.webp", alt: "MIT Technology Review" },
  { src: "/program/static/landing/images/home/logo/cosmopolitan.webp", alt: "Cosmopolitan" },
];

/* ─── Sections ───────────────────────────────────────────────────────────── */

function MNav({ href }: { href: string }) {
  return (
    <nav className="mo-nav">
      <div className="mo-nav__brand">Protocol <em>Club</em></div>
      <div className="mo-nav__links">
        <a href="#mo-method">Method</a>
        <a href="#mo-results">Results</a>
        <a href="#mo-science">Science</a>
        <a href="#mo-pricing">Pricing</a>
        <a href="#">Journal</a>
      </div>
      <a href={href} className="mo-nav__cta">Start — $89</a>
    </nav>
  );
}

function MHeroV1({ href }: { href: string }) {
  return (
    <section className="mo-hero mo-hero-v1">
      {/* Left column: copy (desktop only) */}
      <div className="mo-hero-v1__left">
        <div className="mo-hero-v1__copy">
          <h1 className="mo-hero__title">Reach your full <em>potential</em></h1>
          <p className="mo-hero__desc">
            A 12-week protocol built around the published research on what the eye reads as attractive.
          </p>
          <div className="mo-hero__ctas">
            <CtaButton label="Start your Protocol — $89" className="mo-cta--hero" location="hero" href={href} />
            <a href="#mo-method" className="mo-hero__cta-ghost">See the method</a>
          </div>
          <div className="mo-hero__meta">
            <span>12 weeks</span>
            <span className="mo-hero__meta-dot">·</span>
            <span>2,500+ men analysed</span>
            <span className="mo-hero__meta-dot">·</span>
            <span>90-day guarantee</span>
          </div>
        </div>
      </div>

      {/* Mobile-only: title + desc ABOVE the image */}
      <div className="mo-hero-v1__mobile-ctas mo-hero-pad">
        <h1 className="mo-hero__title">Reach your full <em>potential</em></h1>
        <p className="mo-hero__desc">
          A 12-week protocol built around the published research on what the eye reads as attractive.
        </p>
      </div>

      {/* Right column: dark panel with product image */}
      <div className="mo-hero-v1__right">
        <div className="mo-hero-v1__product-stack">
          <Image
            className="mo-hero-v1__product"
            src="/assets/connor-protocol.png"
            alt="Connor's Protocol"
            width={460}
            height={345}
            priority
          />
          {/* Attractiveness score card — white, bottom-right */}
          <div className="mo-hero-v1__fc mo-hero-v1__fc--ratio">
            <div className="mo-fc-label">Attractiveness</div>
            <div className="mo-fc-val">54 <em>→</em> 77</div>
            <div className="mo-fc-delta">+23</div>
          </div>
          {/* Score card — dark, top-left */}
          <div className="mo-hero-v1__fc mo-hero-v1__fc--score">
            <div className="mo-sc-label">Torso Index</div>
            <div className="mo-sc-val">5.1</div>
            <div className="mo-sc-bar"><i /></div>
          </div>
        </div>
      </div>

      {/* Mobile-only: CTA strip BELOW the image */}
      <div className="mo-hero-v1__mobile-cta-strip mo-hero-pad">
        <CtaButton label="Start your Protocol — $89" className="mo-cta--hero" location="hero-mobile" href={href} />
        <a href="#mo-method" className="mo-hero__cta-ghost">See the method</a>
        <div className="mo-hero__meta">
          <span>12 weeks</span>
          <span>· 2,500+ men analysed</span>
          <span>· 90-day guarantee</span>
        </div>
      </div>
    </section>
  );
}

function MPress() {
  return (
    <div className="mo-press">
      <div className="mo-press__inner">
        <span className="mo-press__label">As featured in</span>
        <div className="mo-press__row">
          {PRESS_LOGOS.map((logo) => (
            <Image key={logo.alt} src={logo.src} alt={logo.alt} width={110} height={32} />
          ))}
        </div>
      </div>
    </div>
  );
}

function MSteps() {
  return (
    <section id="mo-method" className="mo-section mo-section--surface">
      <div className="mo-container">
        <div className="mo-section-head">
          <div>
            <div className="mo-section-eyebrow">The method</div>
            <h2 className="mo-section-title">Three steps. <em>Then it runs.</em></h2>
          </div>
        </div>
        <div className="mo-steps-grid">
          {STEPS.map((s, i) => (
            <div key={i} className="mo-step">
              <div className="mo-step__head">
                <div className="mo-step__num">{s.num} /</div>
                <div className="mo-step__time">{s.time}</div>
              </div>
              <h3 className="mo-step__title">{s.title}</h3>
              <p className="mo-step__desc">{s.desc}</p>
              <div className="mo-step__visual">
                <Image src={s.img} alt={s.title} width={400} height={250} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MResults({ href }: { href: string }) {
  return (
    <section id="mo-results" className="mo-section">
      <div className="mo-container">
        <div className="mo-section-head--rule">
          <div>
            <div className="mo-section-eyebrow">Members, 13 weeks in</div>
            <h2 className="mo-section-title" style={{ marginTop: 4 }}>Real photos. <em>Real ratios.</em></h2>
          </div>
          <div className="mo-section-head__meta">2,500+ men · 13 weeks avg</div>
        </div>
        <div className="mo-results-grid">
          {RESULTS.map((r, i) => (
            <div key={i} className="mo-result">
              <div className="mo-result__split">
                <Image src={r.before} alt="Before" width={200} height={300} />
                <Image src={r.after} alt="After" width={200} height={300} />
              </div>
              <div className="mo-result__divider" />
              <div className="mo-result__labels"><span>Before</span><span>After</span></div>
              <div className="mo-result__caption">
                <div className="mo-result__name">{r.name}</div>
                <div className="mo-result__ratio">{r.ratio}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mo-results-foot">
          <span>Average attractiveness score gain : +27</span>
          <a href="#mo-results" className="mo-results-foot__link">See all 200+ →</a>
        </div>
        <div className="mo-section-cta">
          <CtaButton label="Start your Protocol — $89" location="results" href={href} />
        </div>
      </div>
    </section>
  );
}

function MScience() {
  return (
    <section id="mo-science" className="mo-section mo-section--warm">
      <div className="mo-container">
        <div className="mo-science-grid">
          {/* Left: text + list */}
          <div className="mo-science__text">
            <div className="mo-section-eyebrow">What we measure</div>
            <h2 className="mo-section-title" style={{ marginTop: 4 }}>
              Hundreds structural variables. <em>One protocol per body.</em>
            </h2>
            <div className="mo-science__list">
              {SCIENCE_VARS.map((v, i) => (
                <div key={i} className="mo-science__item">
                  <div className="mo-science__item-num">{v.num}</div>
                  <div className="mo-science__item-name">{v.name}<span>{v.sub}</span></div>
                  <div className="mo-science__item-val">{v.val}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Right: annotated visual */}
          <div className="mo-science__visual">
            <Image src="/assets/2-after.png" alt="Body analysis" width={400} height={500} />
            <div className="mo-science__overlay">
              {/* Posture — cou, tag flottant sans dot */}
              <div className="mo-science__marker" style={{ top: "13%", left: "75%" }}>
                <div className="mo-science__marker-tag">Posture · 87/100</div>
              </div>
              {/* SHL — dot anchored at left edge */}
              <div className="mo-science__marker" style={{ top: "21%", left: "15%", transform: "translateY(-50%)" }}>
                <div className="mo-science__marker-dot" />
                <div className="mo-science__marker-line" />
                <div className="mo-science__marker-tag">SHL 51.2 cm</div>
              </div>
              {/* CWR — dot anchored at right edge */}
              <div className="mo-science__marker" style={{ top: "42%", left: "72%", transform: "translate(-100%, -50%)" }}>
                <div className="mo-science__marker-tag">CWR 1.32</div>
                <div className="mo-science__marker-line" />
                <div className="mo-science__marker-dot" />
              </div>
              {/* WST — dot anchored at left edge */}
              <div className="mo-science__marker" style={{ top: "60%", left: "32%", transform: "translateY(-50%)" }}>
                <div className="mo-science__marker-dot" />
                <div className="mo-science__marker-line" />
                <div className="mo-science__marker-tag">WST 78 cm</div>
              </div>
              {/* TI — dot anchored at right edge */}
              <div className="mo-science__marker" style={{ top: "31%", left: "79%", transform: "translate(-100%, -50%)" }}>
                <div className="mo-science__marker-tag">TI 5.1</div>
                <div className="mo-science__marker-line" />
                <div className="mo-science__marker-dot" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MCompare() {
  return (
    <section className="mo-section">
      <div className="mo-container">
        <div className="mo-section-head--center">
          <div className="mo-section-eyebrow mo-section-eyebrow--center">Why this works</div>
          <h2 className="mo-section-title" style={{ marginTop: 16 }}>
            Gym industry builds muscle. <em>We build attractiveness Protocol for you.</em>
          </h2>
        </div>

        {/* Desktop: table */}
        <div className="mo-compare__table">
          <div className="mo-compare__row mo-compare__row--head">
            <div>What you get</div>
            <div>Generic app</div>
            <div>Personal trainer</div>
            <div className="mo-compare__col-us">Protocol Club</div>
          </div>
          {COMPARE_ROWS.map((r, i) => (
            <div key={i} className="mo-compare__row">
              <div className="mo-compare__cell-row">{r.feature}</div>
              <div className="mo-compare__cell mo-compare__x">{r.app}</div>
              <div className="mo-compare__cell mo-compare__x">{r.pt}</div>
              <div className="mo-compare__cell mo-compare__col-us">{r.us}</div>
            </div>
          ))}
        </div>

        {/* Mobile: stacked cards */}
        <div className="mo-compare__mobile">
          {[
            { label: "Generic app", vals: COMPARE_ROWS.map((r) => r.app), isUs: false },
            { label: "Personal trainer", vals: COMPARE_ROWS.map((r) => r.pt), isUs: false },
            { label: "Protocol Club", vals: COMPARE_ROWS.map((r) => r.us), isUs: true },
          ].map((group) => (
            <div key={group.label} className="mo-compare__group">
              <div className={`mo-compare__head ${group.isUs ? "mo-compare__head--us" : ""}`}>{group.label}</div>
              {COMPARE_ROWS.map((row, i) => (
                <div key={i} className="mo-compare__mrow">
                  <div className="mo-compare__row-label">{row.feature}</div>
                  <div className={`mo-compare__row-val ${!group.isUs ? "mo-compare__row-val--x" : ""} ${group.isUs ? "mo-compare__row-val--check" : ""}`}>
                    {group.vals[i]}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MTestimonials() {
  return (
    <section className="mo-section mo-section--surface">
      <div className="mo-container">
        <div className="mo-section-head--center">
          <div className="mo-section-eyebrow mo-section-eyebrow--center">What club members say</div>
          <h2 className="mo-section-title" style={{ marginTop: 16 }}><em>A change of shape.</em></h2>
        </div>
        <div className="mo-testimonials-grid">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="mo-testi">
              <div className="mo-testi__stars">
                <StarIcon /><StarIcon /><StarIcon /><StarIcon /><StarIcon />
              </div>
              <p className="mo-testi__quote">&ldquo;{renderTitle(t.quote)}&rdquo;</p>
              <div className="mo-testi__person">
                <div className="mo-testi__avatar">{t.name[0]}</div>
                <div>
                  <div className="mo-testi__name">{t.name}</div>
                  <div className="mo-testi__meta">Member · {t.meta}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MPricing({ href }: { href: string }) {
  return (
    <section id="mo-pricing" className="mo-section mo-section--ink">
      <div className="mo-container">
        <div className="mo-section-head--center">
          <h2 className="mo-section-title" style={{ marginTop: 16, color: "#fff" }}>
            The full Protocol. <em style={{ color: "rgba(255,255,255,0.5)" }}>$89.</em>
          </h2>
        </div>
        <div className="mo-pricing-card">
          <div className="mo-pricing-card__top">
            <div>
              <div className="mo-pricing-card__price-row">
                <span className="mo-pricing-card__price">$89</span>
                <span className="mo-pricing-card__strike">$149</span>
              </div>
              <div className="mo-pricing-card__tag">one-time</div>
            </div>
            <div className="mo-pricing-card__badge">Save $60</div>
          </div>
          <ul className="mo-pricing-card__list">
            {PRICING_BULLETS.map((b, i) => (
              <li key={i}>
                <span className="mo-pricing-card__check"><CheckIcon size={12} /></span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <a href={href} className="mo-pricing-card__cta">
            Start your Protocol — $89 <ArrowIcon />
          </a>
          <div className="mo-pricing-card__guarantee">90-day measurable-outcome guarantee</div>
        </div>
      </div>
    </section>
  );
}

function MGuarantee() {
  return (
    <section className="mo-guarantee">
      <div className="mo-container">
        <div className="mo-guarantee__inner">
          <div className="mo-guarantee__seal">
            <div className="mo-guarantee__seal-num">90</div>
            <div className="mo-guarantee__seal-label">Day Refund</div>
          </div>
          <div>
            <h2 className="mo-guarantee__title">
              Follow the protocol for 90 days. Measure your proportions.{" "}
              <em>If your attractiveness hasn&apos;t moved, full refund.</em>
            </h2>
          </div>
        </div>
      </div>
    </section>
  );
}

function MFaq() {
  const [open, setOpen] = useState<number>(0);
  return (
    <section className="mo-section">
      <div className="mo-container">
        <div className="mo-faq__inner">
          <div>
            <div className="mo-section-eyebrow">FAQ</div>
            <h2 className="mo-faq__title">Short answers <em>to real questions.</em></h2>
          </div>
          <div className="mo-faq__list">
            {FAQS.map((f, i) => (
              <div key={i} className="mo-faq__row" onClick={() => setOpen(open === i ? -1 : i)}>
                <div className="mo-faq__q-wrap">
                  <div className="mo-faq__q">{f.q}</div>
                  <div className="mo-faq__plus">{open === i ? "−" : "+"}</div>
                </div>
                {open === i && <div className="mo-faq__a">{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function MFooter() {
  return (
    <footer className="mo-footer">
      <div className="mo-container">
        <div className="mo-footer__top">
          <div>
            <div className="mo-footer__brand">Protocol <em>Club</em></div>
          </div>
          <div>
            <div className="mo-footer__col-head">Product</div>
            <a className="mo-footer__link" href="#mo-method">Method</a>
            <a className="mo-footer__link" href="#mo-results">Results</a>
            <a className="mo-footer__link" href="#mo-science">Science</a>
            <a className="mo-footer__link" href="#mo-pricing">Pricing</a>
          </div>
          <div>
            <div className="mo-footer__col-head">Company</div>
            <a className="mo-footer__link" href="#">About</a>
            <a className="mo-footer__link" href="#">Journal</a>
            <a className="mo-footer__link" href="#">Contact</a>
          </div>
          <div>
            <div className="mo-footer__col-head">Legal</div>
            <a className="mo-footer__link" href="/terms-of-service">Terms</a>
            <a className="mo-footer__link" href="/privacy-policy">Privacy</a>
            <a className="mo-footer__link" href="/refund-policy">Refund Policy</a>
          </div>
        </div>
        <div className="mo-footer__bottom">
          <span>© {new Date().getFullYear()} Protocol Club</span>
          <span>hello@protocol-club.com</span>
        </div>
        <p className="mo-footer__disclaimer">
          * Results may vary. Protocol is not a licensed medical provider. The content on this site is for informational
          purposes only and does not constitute medical advice.
        </p>
      </div>
    </footer>
  );
}

function MSticky({ href, visible }: { href: string; visible: boolean }) {
  return (
    <div className={`mo-sticky ${visible ? "mo-sticky--visible" : ""}`}>
      {/* Mobile version: full bar */}
      <div className="mo-sticky__mobile">
        <div className="mo-sticky__text">Get your full Protocol</div>
        <a href={href} className="mo-sticky__btn">Start — $89 <ArrowIcon size={12} /></a>
      </div>
      {/* Desktop version: pill */}
      <a href={href} className="mo-sticky__desktop">
        <div className="mo-sticky__desktop-text">
          <strong>The full Protocol</strong>
          <span>one-time · $89</span>
        </div>
        <span className="mo-sticky__desktop-btn">Start your Protocol — $89 <ArrowIcon size={14} /></span>
      </a>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function F1OfferPage() {
  const [signupHref, setSignupHref] = useState("/register");
  const [stickyVisible, setStickyVisible] = useState(false);

  useEffect(() => {
    trackGa4Event("view_offer", { funnel: "f1", page_path: "/f1/offer" });
    trackEvent("view_offer", { funnel: "f1", page_path: "/f1/offer" });

    const utm = getUtmParams();
    persistUtmParams(utm);
    setSignupHref(appendUtmToPath("/register", utm));

    const onScroll = () => setStickyVisible(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="mo-page">
      <MNav href={signupHref} />
      <MHeroV1 href={signupHref} />
      <MPress />
      <MSteps />
      <CompleteFacialAnalysisSection />
      <PersonalizedSection />
      <InformativeSection />
      <AestheticTestsSection />
      <ProtocolSection />
      <MResults href={signupHref} />
      <MScience />
      <MCompare />
      <MTestimonials />
      <MPricing href={signupHref} />
      <MGuarantee />
      <MFaq />
      <MFooter />
      <MSticky href={signupHref} visible={stickyVisible} />
    </div>
  );
}
