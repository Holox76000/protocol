"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
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

/* ─── Funnel eyebrow maps ────────────────────────────────────────────────── */

const BODY_LABELS: Record<string, string> = {
  "Skinny":     "skinny",
  "Skinny-fat": "skinny-fat",
  "Overweight": "overweight",
  "Average":    "average",
};

const ETH_LABELS: Record<string, string> = {
  "Caucasian":        "Caucasian",
  "Black":            "Black",
  "Asian (East / SE)":"Asian",
  "South Asian":      "South Asian",
  "Hispanic-Latino":  "Latino",
  "MENA":             "Arabic",
};

const AGE_PHRASES: Record<string, string> = {
  "20–29": "in their 20's",
  "30–39": "in their 30's",
  "40–49": "over 40",
  "50+":   "over 50",
};

function buildEyebrow(morphology: string | null, ethnicity: string | null, age: string | null): string | null {
  const body = morphology ? BODY_LABELS[morphology] : null;
  const eth  = ethnicity  ? ETH_LABELS[ethnicity]   : null;
  const phrase = age      ? AGE_PHRASES[age]         : null;
  if (!body || !eth || !phrase) return null;
  const ethPart = eth === "Caucasian" ? "" : ` ${eth}`;
  return `For ${body}${ethPart} men ${phrase}.`;
}

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


/* ─── Compare section ────────────────────────────────────────────────────── */

type ColDef = {
  label: string;
  personalised: React.ReactNode;
  research: React.ReactNode;
  coach: React.ReactNode;
  refund: React.ReactNode;
  commitment: React.ReactNode;
};

type ColKey = "generic-app" | "youtube" | "strict-diet" | "surgery" | "personal-trainer";

const COL_DEFS: Record<ColKey, ColDef> = {
  "generic-app": {
    label: "Generic App",
    personalised: <XIcon />,
    research: "Partial",
    coach: <XIcon />,
    refund: <XIcon />,
    commitment: "Monthly sub",
  },
  "youtube": {
    label: "Free YouTube Advice",
    personalised: "No",
    research: "Mixed",
    coach: "No",
    refund: "N/A",
    commitment: "Free, no system",
  },
  "strict-diet": {
    label: "Strict Dieting",
    personalised: "No",
    research: "Partial",
    coach: "No",
    refund: "No",
    commitment: "$300+/month groceries",
  },
  "surgery": {
    label: "Aesthetic Surgery",
    personalised: "Yes (one-time)",
    research: "Yes",
    coach: "In-person only",
    refund: "No",
    commitment: "$5,000–$15,000",
  },
  "personal-trainer": {
    label: "Personal Trainer",
    personalised: "Sometimes",
    research: <XIcon />,
    coach: "In-person only",
    refund: <XIcon />,
    commitment: "$200/session",
  },
};

const US_COL: ColDef = {
  label: "Protocol Club",
  personalised: <span className="mo-compare__check"><CheckIcon /> Yes. Your ratios, your plan.</span>,
  research:     <span className="mo-compare__check"><CheckIcon /> Yes. 3,000+ studies.</span>,
  coach:        <span className="mo-compare__check"><CheckIcon /> WhatsApp · 6h reply</span>,
  refund:       <span className="mo-compare__check"><CheckIcon /> 90-day, no questions</span>,
  commitment:   "One-time · $89",
};

const COMPARE_FEATURES: Array<{ label: string; field: keyof Omit<ColDef, "label"> }> = [
  { label: "Personalised to your frame",   field: "personalised" },
  { label: "Backed by published research", field: "research" },
  { label: "Direct access to your coach",  field: "coach" },
  { label: "Refund if it doesn't work",    field: "refund" },
  { label: "Commitment",                   field: "commitment" },
];

const ATTEMPT_TO_COL: Record<string, ColKey> = {
  "Personal trainer":            "personal-trainer",
  "YouTube advice":              "youtube",
  "A strict diet":               "strict-diet",
  "Surgery or medical procedures": "surgery",
};

function resolveCompareCols(pastAttempts: string[]): { col1: ColDef; col2: ColDef } {
  const relevant = pastAttempts.filter(a => ATTEMPT_TO_COL[a]);

  if (relevant.length === 0) {
    return { col1: COL_DEFS["generic-app"], col2: COL_DEFS["personal-trainer"] };
  }

  if (relevant.length === 1) {
    const attempt = relevant[0];
    if (attempt === "Personal trainer") {
      return {
        col1: COL_DEFS["generic-app"],
        col2: { ...COL_DEFS["personal-trainer"], label: "Your Personal Trainer" },
      };
    }
    return { col1: COL_DEFS[ATTEMPT_TO_COL[attempt]], col2: COL_DEFS["personal-trainer"] };
  }

  const [a1, a2] = relevant.slice(0, 2);
  return { col1: COL_DEFS[ATTEMPT_TO_COL[a1]], col2: COL_DEFS[ATTEMPT_TO_COL[a2]] };
}

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

function MHeroV1({ href, eyebrow }: { href: string; eyebrow: string | null }) {
  return (
    <section className="mo-hero mo-hero-v1">
      {/* Left column: copy (desktop only) */}
      <div className="mo-hero-v1__left">
        <div className="mo-hero-v1__copy">
          {eyebrow && <p className="mo-hero__eyebrow">{eyebrow}</p>}
          <h1 className="mo-hero__title">Reach your full <em>attractiveness potential</em></h1>
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
        {eyebrow && <p className="mo-hero__eyebrow">{eyebrow}</p>}
        <h1 className="mo-hero__title">Reach your full <em>attractiveness potential</em></h1>
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
            <h2 className="mo-section-title" style={{ marginTop: 4 }}>Real people. <em>Real confidence.</em></h2>
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


function MCompare({ pastAttempts }: { pastAttempts: string[] }) {
  const { col1, col2 } = resolveCompareCols(pastAttempts);

  const groups = [
    { label: col1.label,       vals: COMPARE_FEATURES.map(f => col1[f.field]),   isUs: false },
    { label: col2.label,       vals: COMPARE_FEATURES.map(f => col2[f.field]),   isUs: false },
    { label: "Protocol Club",  vals: COMPARE_FEATURES.map(f => US_COL[f.field]), isUs: true  },
  ];

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
            <div>{col1.label}</div>
            <div>{col2.label}</div>
            <div className="mo-compare__col-us">Protocol Club</div>
          </div>
          {COMPARE_FEATURES.map((f) => (
            <div key={f.label} className="mo-compare__row">
              <div className="mo-compare__cell-row">{f.label}</div>
              <div className="mo-compare__cell mo-compare__x">{col1[f.field]}</div>
              <div className="mo-compare__cell mo-compare__x">{col2[f.field]}</div>
              <div className="mo-compare__cell mo-compare__col-us">{US_COL[f.field]}</div>
            </div>
          ))}
        </div>

        {/* Mobile: stacked cards */}
        <div className="mo-compare__mobile">
          {groups.map((group) => (
            <div key={group.label} className="mo-compare__group">
              <div className={`mo-compare__head ${group.isUs ? "mo-compare__head--us" : ""}`}>{group.label}</div>
              {COMPARE_FEATURES.map((f, i) => (
                <div key={f.label} className="mo-compare__mrow">
                  <div className="mo-compare__row-label">{f.label}</div>
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

const OUTCOMES = [
  { rank: "01", category: "Mindset", label: "Self-confidence",        delta: 37, scaleMax: 50, delay: 0.05 },
  { rank: "02", category: "Career",  label: "Salary increase",        delta: 12, scaleMax: 50, delay: 0.20 },
  { rank: "03", category: "Dating",  label: "Matches on dating apps", delta: 34, scaleMax: 50, delay: 0.35 },
];

function MMemberOutcomes() {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="mo-outcomes">
      <div className="mo-container">
        <header className="mo-outcomes__head">
          <p className="mo-outcomes__eyebrow">Reported effects · post-protocol</p>
          <h2 className="mo-outcomes__title">
            What members <em>report the most</em> after finishing their protocol.
          </h2>
        </header>
        <div className="mo-outcomes__rows">
          {OUTCOMES.map((o) => (
            <article key={o.rank} className="mo-outcomes__row">
              <div className="mo-outcomes__num"><em>+</em>{o.delta}<span>%</span></div>
              <div className="mo-outcomes__body">
                <p className="mo-outcomes__cat">{o.rank} — {o.category}</p>
                <p className="mo-outcomes__label">{o.label}</p>
                <div className="mo-outcomes__bar">
                  <div
                    className={`mo-outcomes__bar-fill${visible ? " mo-outcomes__bar-fill--animate" : ""}`}
                    style={{ "--pct": `${(o.delta / o.scaleMax) * 100}%`, "--delay": `${o.delay}s` } as React.CSSProperties}
                  />
                </div>
                <div className="mo-outcomes__scale"><span>0%</span><span>+25%</span><span>+50%</span></div>
              </div>
            </article>
          ))}
        </div>
        <p className="mo-outcomes__foot">Self-reported · 2,500+ members · 6 months post-protocol</p>
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

/* ─── Personalized preview ───────────────────────────────────────────────── */

type PreviewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "generating" }
  | { status: "done"; before_url: string; after_url: string }
  | { status: "error" };

function MPersonalizedPreview({ before_url, after_url }: { before_url: string; after_url: string }) {
  return (
    <section className="mo-section mo-section--surface mo-personalized-preview">
      <div className="mo-container">
        <div className="mo-section-head--center">
          <div className="mo-section-eyebrow mo-section-eyebrow--center">Your transformation preview</div>
          <h2 className="mo-section-title" style={{ marginTop: 12 }}>
            Based on your profile. <em>What you could look like.</em>
          </h2>
        </div>
        <div className="mo-preview-split">
          <div className="mo-preview-col">
            <Image src={before_url} alt="Before" fill className="object-cover object-top" sizes="300px" />
            <span className="mo-preview-label">Now</span>
          </div>
          <div className="mo-preview-col">
            <Image src={after_url} alt="After" fill className="object-cover object-top" sizes="300px" />
            <span className="mo-preview-label mo-preview-label--after">12 weeks</span>
          </div>
        </div>
        <p className="mo-preview-disclaimer">AI-generated preview based on your diagnostic answers. Individual results may vary.</p>
      </div>
    </section>
  );
}

function MPreviewGenerating() {
  return (
    <section className="mo-section mo-section--surface mo-personalized-preview">
      <div className="mo-container">
        <div className="mo-section-head--center">
          <div className="mo-section-eyebrow mo-section-eyebrow--center">Your transformation preview</div>
          <h2 className="mo-section-title" style={{ marginTop: 12 }}>
            Our AI is analyzing your photo. <em>Hold tight.</em>
          </h2>
        </div>

        {/* Skeleton before/after */}
        <div className="mo-preview-split">
          <div className="mo-preview-col mo-preview-col--skeleton">
            <div className="mo-preview-shimmer" />
            <span className="mo-preview-label">Now</span>
          </div>
          <div className="mo-preview-col mo-preview-col--skeleton">
            <div className="mo-preview-shimmer" />
            <span className="mo-preview-label mo-preview-label--after">
              <span className="mo-preview-dot-anim" />
              Generating
            </span>
          </div>
        </div>

        {/* Steps */}
        <div className="mo-preview-steps">
          <div className="mo-preview-step mo-preview-step--done">
            <span className="mo-preview-step-icon">✓</span>
            Photo uploaded
          </div>
          <div className="mo-preview-step mo-preview-step--active">
            <span className="mo-preview-step-spinner" />
            Analyzing your body type
          </div>
          <div className="mo-preview-step mo-preview-step--pending">
            <span className="mo-preview-step-dot" />
            Generating your transformation
          </div>
        </div>

        <p className="mo-preview-disclaimer">This takes 30–60 seconds. Scroll down while you wait — your preview will appear here automatically.</p>
      </div>
    </section>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function F1OfferPage() {
  const [signupHref, setSignupHref] = useState("/register");
  const [stickyVisible, setStickyVisible] = useState(false);
  const [preview, setPreview] = useState<PreviewState>({ status: "idle" });
  const [heroEyebrow, setHeroEyebrow] = useState<string | null>(null);
  const [pastAttempts, setPastAttempts] = useState<string[]>([]);

  useEffect(() => {
    trackGa4Event("view_offer", { funnel: "f1", page_path: "/f1/offer" });
    trackEvent("view_offer", { funnel: "f1", page_path: "/f1/offer" });

    const utm = getUtmParams();
    persistUtmParams(utm);
    setSignupHref(appendUtmToPath("/register", utm));

    const onScroll = () => setStickyVisible(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });

    // Load personalized preview if funnel_sid present
    const params = new URLSearchParams(window.location.search);

    if (params.get("funnel") === "quiz") {
      const from = params.get("from") ?? "funnel";
      try { sessionStorage.setItem("protocol.funnel.from", from); } catch {}
      (window as typeof window & { fbq?: (...args: unknown[]) => void }).fbq?.(
        "track",
        "CompleteRegistration",
        { content_name: from }
      );
    }

    const eyebrow = buildEyebrow(
      params.get("morphology"),
      params.get("ethnicity"),
      params.get("age_bracket"),
    );
    if (eyebrow) setHeroEyebrow(eyebrow);

    const rawAttempts = params.get("past_solutions");
    if (rawAttempts) setPastAttempts(rawAttempts.split("|"));

    const sid = params.get("funnel_sid");
    if (sid) {
      setPreview({ status: "loading" });
      let attempts = 0;
      const maxAttempts = 12;
      const poll = async () => {
        try {
          const res = await fetch(`/api/funnel/session?id=${encodeURIComponent(sid)}`);
          if (!res.ok) { setPreview({ status: "error" }); return; }
          const data = await res.json() as { status: string; before_url?: string; after_url?: string };
          if (data.status === "done" && data.before_url && data.after_url) {
            setPreview({ status: "done", before_url: data.before_url, after_url: data.after_url });
          } else if (data.status === "generating" && attempts < maxAttempts) {
            attempts++;
            setPreview({ status: "generating" });
            setTimeout(poll, 8000);
          } else if (data.status === "not_started") {
            setPreview({ status: "idle" });
          } else {
            setPreview({ status: "error" });
          }
        } catch {
          setPreview({ status: "error" });
        }
      };
      poll();
    }

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="mo-page">
      <MNav href={signupHref} />
      <MHeroV1 href={signupHref} eyebrow={heroEyebrow} />
      <MPress />
      {preview.status === "done" && (
        <MPersonalizedPreview before_url={preview.before_url} after_url={preview.after_url} />
      )}
      {preview.status === "generating" && <MPreviewGenerating />}
      <MSteps />
      <MResults href={signupHref} />
      <MMemberOutcomes />
      <CompleteFacialAnalysisSection />
      <PersonalizedSection />
      <InformativeSection />
      <AestheticTestsSection />
      <ProtocolSection interfaceSrc="/assets/connor-protocol.png" />

      <MCompare pastAttempts={pastAttempts} />
      <MTestimonials />
      <MPricing href={signupHref} />
      <MGuarantee />
      <MFaq />
      <MFooter />
      <MSticky href={signupHref} visible={stickyVisible} />
    </div>
  );
}
