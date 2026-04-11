"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import TrackedLink from "../tracked-link";
import GaryLinkovQuoteSection from "../program/GaryLinkovQuoteSection";
import ExpertAdviceSection from "../program/ExpertAdviceSection";
import BeforeAfterSlider from "../program/BeforeAfterSlider";
import type { ResearchTab } from "../program/ResearchImpactSection";
import { getUtmParams, persistUtmParams, appendUtmToPath } from "../../lib/utm";
import "../program/program.css";
import "./f1.css";

const ResearchImpactSection = dynamic(() => import("../program/ResearchImpactSection"));

/* ─── Body Type Selector ─────────────────────────────────────────────────── */

const BODY_TYPE_IMAGES = [
  { id: 0, before: "/assets/projection-advertorial-before.svg", after: "/assets/projection-advertorial-after.svg" },
  { id: 1, before: "/assets/projection-advertorial-before-3.svg", after: "/assets/projection-advertorial-after-3.svg" },
  { id: 2, before: "/assets/projection-advertorial-before-4.svg", after: "/assets/projection-advertorial-after-4.svg" },
  { id: 3, before: "/assets/advertorial-projection-before-2.svg", after: "/assets/projection-advertorial-after-2.svg" },
];

const PROJECTIONS = [
  {
    id: 0,
    situation: "Work presentation",
    before: "/assets/meeting-before.png",
    after: "/assets/meeting-after.png",
    scene: "You present. People listen. No interruptions, no side conversations. They take notes when you speak and ask follow-up questions when you're done.",
  },
  {
    id: 2,
    situation: "Dating app photo",
    before: "/assets/dating-app-before.png",
    after: "/assets/dating-app-after.png",
    scene: "2 matches, zero messages. Same face, different shape. Now the notifications don\u2019t stop. The photo didn\u2019t change. You did.",
  },
  {
    id: 3,
    situation: "Beach club",
    before: "/assets/beach-before.png",
    after: "/assets/beach-after.png",
    scene: "Phone down. Shirt off. People come to you. You\u2019re laughing, in the middle of it, not watching from the side.",
  },
];

const LOADING_STEPS = [
  "Analyzing your body type…",
  "Computing your proportions…",
  "Generating your projection…",
];

function BodyTypeSelector({ offerHref }: { offerHref: string }) {
  const [selected, setSelected] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const current = BODY_TYPE_IMAGES[selected];

  function handleReveal() {
    setLoading(true);
    setProgress(0);
    setLoadingStep(0);

    const totalMs = 3000;
    const tickMs = 30;
    let elapsed = 0;

    const interval = setInterval(() => {
      elapsed += tickMs;
      const pct = Math.min((elapsed / totalMs) * 100, 100);
      setProgress(pct);
      setLoadingStep(Math.floor((pct / 100) * LOADING_STEPS.length));
      if (elapsed >= totalMs) {
        clearInterval(interval);
        setLoading(false);
        setRevealed(true);
      }
    }, tickMs);
  }

  return (
    <div id="step-1" style={{ marginTop: 16, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div className="f1-steps">
        <a href="#step-1" className="f1-steps__item f1-steps__item--active">
          <span className="f1-steps__num">1</span>
          <span className="f1-steps__label">Assess your body</span>
        </a>
        <span className="f1-steps__connector" aria-hidden="true" />
        <a href="#step-2" className={`f1-steps__item ${revealed ? "f1-steps__item--active" : "f1-steps__item--muted"}`}>
          <span className="f1-steps__num">2</span>
          <span className="f1-steps__label">Find what&apos;s changeable</span>
        </a>
        <span className="f1-steps__connector" aria-hidden="true" />
        <div className="f1-steps__item f1-steps__item--muted">
          <span className="f1-steps__num">3</span>
          <span className="f1-steps__label">Decide your commitment</span>
        </div>
        <span className="f1-steps__connector" aria-hidden="true" />
        <div className="f1-steps__item f1-steps__item--muted">
          <span className="f1-steps__num">4</span>
          <span className="f1-steps__label">Build your system</span>
        </div>
      </div>
      {loading ? (
        <div className="f1-scan-loader">
          <img
            src={current.before}
            alt=""
            aria-hidden="true"
            className="f1-scan-loader__image"
          />
          <div className="f1-scan-loader__overlay" />
          <div className="f1-scan-loader__grid" />
          <div className="f1-scan-loader__line" />
          <div className="f1-scan-loader__corners" />
          <div className="f1-scan-loader__bottom">
            <div key={loadingStep} className="f1-scan-loader__step">
              {LOADING_STEPS[Math.min(loadingStep, LOADING_STEPS.length - 1)]}
            </div>
            <div className="f1-scan-loader__bar-track">
              <div className="f1-scan-loader__bar-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      ) : !revealed ? (
        <>
          <p style={{
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#799097",
            margin: 0,
          }}>
            Step 1 — Which one is you?
          </p>
          <p style={{
            fontSize: 12,
            color: "#9ca3af",
            margin: "4px 0 0",
            textAlign: "center",
          }}>
            We&apos;ll show you what your body could look like after 90 days.
          </p>
          <div className="f1-body-selector" style={{
            gap: 8,
            padding: "10px",
            background: "#f0efec",
            borderRadius: 16,
            width: "100%",
            maxWidth: 680,
          }}>
            {BODY_TYPE_IMAGES.map((bt, i) => (
              <div key={bt.id} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <button
                  type="button"
                  onClick={() => setSelected(i)}
                  aria-label={["Skinny fat", "Slim", "Average", "Heavy"][i]}
                  aria-pressed={selected === i}
                  style={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: "2 / 3",
                    borderRadius: 10,
                    overflow: "hidden",
                    border: selected === i ? "2.5px solid #1a1a1a" : "2.5px solid transparent",
                    padding: 0,
                    cursor: "pointer",
                    background: "#ddd",
                    transition: "border-color 0.15s ease, transform 0.15s ease",
                    transform: selected === i ? "scale(1.06)" : "scale(1)",
                  }}
                >
                  <Image
                    src={bt.before}
                    alt={["Skinny fat", "Slim", "Average", "Heavy"][i]}
                    fill
                    sizes="(max-width: 640px) 22vw, 120px"
                    style={{ objectFit: "cover", objectPosition: "top" }}
                  />
                </button>
                <span style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: selected === i ? "#0a0a0a" : "#9ca3af",
                  transition: "color 0.15s ease",
                }}>
                  {["Skinny fat", "Slim", "Average", "Heavy"][i]}
                </span>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={handleReveal}
            className="program-hero__cta"
            style={{ marginTop: 8 }}
          >
            <span>See my projection</span>
            <span className="program-hero__cta-icon" aria-hidden="true"><ArrowIcon /></span>
          </button>
        </>
      ) : (
        <div className="f1-body-reveal f1-body-reveal--wide" style={{ width: "min(440px, calc(100vw - 40px))", marginInline: "auto" }}>
          {/* Before / After */}
          <div style={{
            display: "flex",
            width: "100%",
            gap: 0,
            borderRadius: 16,
            overflow: "hidden",
            position: "relative",
          }}>
            {/* Before */}
            <div style={{ flex: 1, minWidth: 0, position: "relative", aspectRatio: "9 / 16" }}>
              <Image
                src={current.before}
                alt="Before"
                fill
                sizes="(max-width: 600px) 50vw, 450px"
                style={{ objectFit: "cover", objectPosition: "top" }}
              />
              <span style={{
                position: "absolute",
                bottom: 10,
                left: "50%",
                transform: "translateX(-50%)",
                background: "rgba(0,0,0,0.52)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
                borderRadius: 6,
                padding: "3px 10px",
                color: "#fff",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}>
                Before
              </span>
            </div>

            {/* Divider */}
            <div style={{ width: 2, background: "#fff", flexShrink: 0 }} />

            {/* After */}
            <div style={{ flex: 1, minWidth: 0, position: "relative", aspectRatio: "9 / 16" }}>
              <Image
                src={current.after}
                alt="After"
                fill
                sizes="(max-width: 600px) 50vw, 450px"
                style={{ objectFit: "cover", objectPosition: "top" }}
              />
              <span style={{
                position: "absolute",
                bottom: 10,
                left: "50%",
                transform: "translateX(-50%)",
                background: "rgba(15,15,15,0.65)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
                borderRadius: 6,
                padding: "3px 10px",
                color: "#fff",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}>
                After
              </span>
            </div>
          </div>

          {/* Caption */}
          <p style={{
            margin: "18px 0 4px",
            fontSize: 20,
            fontWeight: 600,
            color: "#1a1a1a",
            letterSpacing: "-0.03em",
            textAlign: "center",
            lineHeight: 1.2,
          }}>
            This is what your body type looks like after 90 days of Protocol.
          </p>
          <p style={{
            margin: "0 0 20px",
            fontSize: 13,
            color: "#6b7280",
            textAlign: "center",
            lineHeight: 1.5,
          }}>
            Your proportions, engineered over 90 days.
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <a href="#projections" className="program-hero__cta">
              <span>See the real-life difference</span>
              <span className="program-hero__cta-icon" aria-hidden="true"><ArrowIcon /></span>
            </a>
            <button
              type="button"
              onClick={() => setRevealed(false)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 12,
                color: "#9ca3af",
                padding: "4px 0",
              }}
            >
              ← Choose another profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Icons ──────────────────────────────────────────────────────────────── */

function PlayIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
      <path d="M9 6.5L20 13L9 19.5V6.5Z" fill="white" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <path d="M6 14H22M22 14L14 6M22 14L14 22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── SVG Silhouettes ────────────────────────────────────────────────────── */

function SilhouetteNeutral() {
  return (
    <svg viewBox="0 0 120 260" fill="none" aria-hidden="true">
      <ellipse cx="60" cy="24" rx="16" ry="18" fill="currentColor" opacity="0.35" />
      <rect x="54" y="40" width="12" height="10" rx="4" fill="currentColor" opacity="0.35" />
      <path d="M34 50 Q28 90 30 130 Q40 138 60 138 Q80 138 90 130 Q92 90 86 50 Q74 44 60 44 Q46 44 34 50Z" fill="currentColor" opacity="0.35" />
      <path d="M34 54 Q20 80 22 118 Q26 122 30 118 Q32 84 38 60Z" fill="currentColor" opacity="0.25" />
      <path d="M86 54 Q100 80 98 118 Q94 122 90 118 Q88 84 82 60Z" fill="currentColor" opacity="0.25" />
      <path d="M44 136 Q38 170 36 210 Q42 216 50 210 Q54 172 58 140Z" fill="currentColor" opacity="0.35" />
      <path d="M76 136 Q82 170 84 210 Q78 216 70 210 Q66 172 62 140Z" fill="currentColor" opacity="0.35" />
    </svg>
  );
}

function SilhouetteGymBro() {
  return (
    <svg viewBox="0 0 120 260" fill="none" aria-hidden="true">
      <ellipse cx="60" cy="24" rx="16" ry="18" fill="currentColor" opacity="0.4" />
      <rect x="53" y="40" width="14" height="10" rx="4" fill="currentColor" opacity="0.4" />
      <path d="M18 50 Q14 90 18 130 Q36 140 60 140 Q84 140 102 130 Q106 90 102 50 Q82 38 60 38 Q38 38 18 50Z" fill="currentColor" opacity="0.4" />
      <path d="M18 54 Q4 80 6 120 Q10 124 16 120 Q18 84 24 62Z" fill="currentColor" opacity="0.3" />
      <path d="M102 54 Q116 80 114 120 Q110 124 104 120 Q102 84 96 62Z" fill="currentColor" opacity="0.3" />
      <path d="M44 138 Q38 172 36 212 Q42 218 50 212 Q54 174 58 142Z" fill="currentColor" opacity="0.4" />
      <path d="M76 138 Q82 172 84 212 Q78 218 70 212 Q66 174 62 142Z" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

function SilhouetteHero() {
  return (
    <svg viewBox="0 0 120 260" fill="none" aria-hidden="true">
      <ellipse cx="60" cy="24" rx="16" ry="18" fill="currentColor" opacity="0.8" />
      <rect x="54" y="40" width="12" height="10" rx="4" fill="currentColor" opacity="0.8" />
      <path d="M22 50 Q18 75 32 110 Q42 128 60 130 Q78 128 88 110 Q102 75 98 50 Q80 40 60 40 Q40 40 22 50Z" fill="currentColor" opacity="0.8" />
      <path d="M22 54 Q10 80 12 116 Q16 120 22 116 Q24 84 30 62Z" fill="currentColor" opacity="0.65" />
      <path d="M98 54 Q110 80 108 116 Q104 120 98 116 Q96 84 90 62Z" fill="currentColor" opacity="0.65" />
      <path d="M46 128 Q40 166 38 208 Q44 214 52 208 Q56 170 60 136Z" fill="currentColor" opacity="0.8" />
      <path d="M74 128 Q80 166 82 208 Q76 214 68 208 Q64 170 60 136Z" fill="currentColor" opacity="0.8" />
    </svg>
  );
}

/* ─── Data ───────────────────────────────────────────────────────────────── */

const RESEARCH_TABS: ResearchTab[] = [
  { label: "Confidence", items: [
    { titleHtml: "Higher <strong>self-esteem</strong>", description: "Men who feel good about their body report 2x higher self-esteem scores", source: "Reingen & Kernan (1993). Journal of Consumer Psychology." },
    { titleHtml: "Less <strong>social anxiety</strong>", description: "Physical appearance satisfaction is one of the strongest predictors of confidence in social settings", source: "Mendelson et al. (2001). Body Image." },
    { titleHtml: "More <strong>assertiveness</strong>", description: "Men satisfied with their physique report higher levels of assertiveness and social initiative", source: "Davis, C. (1997). Psychology of Sport and Exercise." },
  ]},
  { label: "Finances", items: [
    { titleHtml: "Higher <strong>salary</strong>", description: "Lean, muscular men earn 10-15% more than their peers", source: "Hamermesh & Biddle (1994). The American Economic Review." },
    { titleHtml: "More <strong>promotions</strong>", description: "Attractive people are more likely to be hired and promoted", source: "Morrow et al. (1990). Journal of Management." },
    { titleHtml: "More <strong>negotiating power</strong>", description: "Attractive people achieve better outcomes in salary negotiations", source: "Parrett, M. (2015). Journal of Economic Psychology." },
  ]},
  { label: "Dating", items: [
    { titleHtml: "More <strong>swipes</strong>", description: "On dating apps, looks matter about 9 times more than biographies", source: "Witmer et al. (2025). Computers in Human Behavior Reports." },
    { titleHtml: "More <strong>second-dates</strong>", description: "In speed-dating studies, looks consistently predict success", source: "Eastwick & Finkel (2008). Journal of Personality and Social Psychology." },
    { titleHtml: "More desirable <strong>partners</strong>", description: "People usually end up with someone in their league, looks-wise", source: "Luo, S. (2017). Social & Personality Psychology." },
  ]},
  { label: "Socializing", items: [
    { titleHtml: "<strong>Funnier</strong>", description: "Attractive people are found funnier on video than in audio", source: "Cowan & Little (2013). Personality and Individual Differences." },
    { titleHtml: "<strong>Smarter</strong>", description: "Attractive people are thought to be more intelligent", source: "Moore et al. (2011). Journal of Evolutionary Psychology." },
    { titleHtml: "<strong>Better</strong>", description: "Attractive people are perceived as more moral and trustworthy", source: "Shinners (2009). UW-L Journal of Undergraduate Research." },
  ]},
];


const VERSIONS = [
  { label: "Designer clothes", desc: "You notice the clothes. You don\u2019t notice him.", verdict: "no" as const, img: "/assets/clothes.svg" },
  { label: "Perfect grooming", desc: "He looks put-together. He doesn\u2019t look attractive.", verdict: "no" as const, img: "/assets/perfect-grooming.svg" },
  { label: "Gym physique", desc: "Impressive in the gym. Not attractive outside of it.", verdict: "no" as const, img: "/assets/gymbro.svg" },
  { label: "Right shape", desc: "This is what your potential looks like.", verdict: "yes" as const, img: "/assets/perfect-shape.svg" },
];

const TIMELINE = [
  { marker: "The question", text: "What does the research actually say about male physical attractiveness? Published science across evolutionary psychology, social cognitive science, and aesthetic medicine." },
  { marker: "5 years", text: "Working alongside researchers and doctors in aesthetics. A single focus: the variables that drive how people perceive male attractiveness, and how to change them." },
  { marker: "The finding", text: "The entire fitness market optimizes for muscle volume. Not one methodology optimizes for what research identifies as the primary driver: your shape, relative to who you are." },
  { marker: "The protocol", text: "Protocol is the result. A system that analyzes your body, factors in your face, your age, and your social context, and gives you a plan built for your life." },
];

const TESTIMONIALS = [
  { obj: "Does it work for my body type?", quote: "I always assumed I\u2019d be the skinny guy. Turns out my frame had more potential than I thought. 13 weeks in, people started noticing.", name: "Ryan, 27", detail: "Ectomorph build", before: "/assets/5-before.png", after: "/assets/5-after.png" },
  { obj: "How is this different from a fitness program?", quote: "I\u2019ve followed PPL splits, 5x5, online coaching. They build muscle. This builds the right shape for you. Different goal, different results.", name: "Jake, 34", detail: "Mesomorph build", before: "/assets/2-before.png", after: "/assets/2-after.png" },
  { obj: "How long until I see a difference?", quote: "3 sessions a week, 50 minutes each. First visible changes around week 7. By week 14 people were asking what I\u2019d changed.", name: "Marcus, 38", detail: "3 sessions/week", before: "/assets/14-before.png", after: "/assets/14-after.png" },
  { obj: "Is this based on real science?", quote: "I\u2019m skeptical by default. What convinced me was the analysis. Every proportion benchmarked against published studies. This is not guesswork.", name: "James, 29", detail: "Data analyst", before: "/assets/1-before.png", after: "/assets/1-after.png" },
  { obj: "I\u2019m over 40, is it too late?", quote: "Started at 44. My proportions were easier to shift than I expected. The protocol accounted for my recovery capacity. Best shape I\u2019ve been in.", name: "Sanjet, 44", detail: "Finance executive", before: "/assets/18-before.png", after: "/assets/18-after.png" },
  { obj: "I don\u2019t want to look like a bodybuilder", quote: "The protocol factored in who I am. My face, my lifestyle, how I want to come across. The result fits me. It does not look forced.", name: "Tyler, 32", detail: "Creative director", before: "/assets/8-before.png", after: "/assets/8-after.png" },
];

const WITHOUT = [
  "A protocol that doesn\u2019t know your proportions or who you are",
  "No way to know if your shape is improving or not",
  "Effort that builds muscle but doesn\u2019t change perception",
  "The variable that affects your salary, your dating, your confidence, left to chance",
];

const WITH = [
  "A scientific analysis of your body with the precision of aesthetic medicine",
  "A protocol shaped by your face, your age, and your social context",
  "Only the variables that research shows drive perception",
  "The shortest path from where you are to your potential",
];

/* ─── Component ──────────────────────────────────────────────────────────── */

export default function F1Landing() {
  const [offerHref, setOfferHref] = useState("/f1/offer");

  useEffect(() => {
    // Capture UTM params from landing URL, persist to sessionStorage for downstream pages
    const utm = getUtmParams();
    persistUtmParams(utm);
    setOfferHref(appendUtmToPath("/f1/offer", utm));
  }, []);

  return (
    <div className="program-page program-page--theme-test f1-page">

      {/* ═══ NAV ═══ */}
      <header className="program-nav">
        <div className="program-nav__inner">
          <a href={offerHref} className="program-nav__logo" aria-label="See the offer">
            <Image src="/program/static/landing/images/shared/Prtcl.png" alt="Protocol" width={44} height={44} className="program-nav__logo-image" />
          </a>
          <nav className="program-nav__links" aria-label="Primary">
            <a href="#research">The research</a>
            <a href="#reframe">The reframe</a>
            <a href="#results">Results</a>
          </nav>
          <div className="program-nav__actions">
            <TrackedLink href={offerHref} className="program-nav__cta" eventName="f1_cta_clicked" eventParams={{ cta_location: "nav" }}>
              Start attractiveness Protocol
</TrackedLink>
          </div>
        </div>
      </header>

      {/* ═══ HERO ═══ */}
      <section className="program-hero">
        <div className="program-hero__shell">
          <div className="program-hero__copy">
            <h1 className="program-hero__title">
              4 steps to improve your physical attractiveness
            </h1>
            <p className="f1-hero__subtitle">Science found the exact formula. Here&apos;s how to use it.</p>
            <BodyTypeSelector offerHref={offerHref} />
            <p className="program-hero__trust">
              <span className="program-hero__trust-item">Based on published research</span>
              <span className="program-hero__trust-dot" aria-hidden="true" />
              <span className="program-hero__trust-item">Personalized to your body</span>
              <span className="program-hero__trust-dot" aria-hidden="true" />
              <span className="program-hero__trust-item">90-day guarantee</span>
            </p>

            {/* VSL — hidden for now */}
            <div className="f1-vsl" style={{ display: "none" }}>
              <button type="button" className="f1-vsl__play" aria-label="Play video"><PlayIcon /></button>
              <span className="f1-vsl__label">Watch: the science breakdown</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PROJECTIONS GRID ═══ */}
      <section id="step-2" className="f1-section f1-projections">
        <div className="f1-projections__inner">
          <div className="f1-section__header">
            <p className="f1-section__eyebrow">Projections</p>
            <h2 id="projections" className="f1-section__title f1-section__title--sm">
              Same Man. Different Shape. <span>Different Life.</span>
            </h2>
          </div>
          <div className="f1-projections__grid">
            {PROJECTIONS.map((p) => (
              <div key={p.id} className="f1-projections__item">
                <p className="f1-projections__situation">{p.situation}</p>
                <div className="f1-projections__row">
                  <img src={p.before} alt={`${p.situation} — before`} className="f1-projections__img" loading="lazy" />
                  <img src={p.after} alt={`${p.situation} — after`} className="f1-projections__img" loading="lazy" />
                </div>
                <p className="f1-projections__scene">{p.scene}</p>
              </div>
            ))}
          </div>
          <div className="f1-mid-cta" style={{ marginTop: 16 }}>
            <TrackedLink href={offerHref} className="f1-cta" eventName="f1_cta_clicked" eventParams={{ cta_location: "projections" }}>
              Start attractiveness Protocol <ArrowIcon />
            </TrackedLink>
          </div>
        </div>
      </section>

      {/* ═══ RESEARCH TABS ═══ */}
      <ResearchImpactSection
        tabs={RESEARCH_TABS}
        titleHtml="Your Body Shape Impacts <strong>Every Part of Your Life</strong>"
        subtitle=""
      />

      {/* ═══ SHAPE FRAME ═══ */}
      <section className="f1-section f1-shape" id="research">
        <div className="f1-shape__inner">
          <div className="f1-section__header">
            <p className="f1-section__eyebrow">The research</p>
            <h2 className="f1-section__title f1-section__title--sm">
              The #1 Factor Is Your Shape. <span>And It&apos;s the One You Can Change.</span>
            </h2>
          </div>
          <p className="f1-body">Your face and your height are mostly fixed. According to hundreds of studies in social cognitive science point to the same finding.</p>
          <p className="f1-body">Your shape is not. It is the single most powerful attractiveness variable you can actually engineer. Most men do not know it exists.</p>
        </div>
      </section>

      <div className="f1-mid-cta">
        <TrackedLink href={offerHref} className="f1-cta" eventName="f1_cta_clicked" eventParams={{ cta_location: "research" }}>
          Start attractiveness Protocol <ArrowIcon />
        </TrackedLink>
        <p className="f1-cta-sub">Based on 5 years of published research &middot; Personalized to your body</p>
      </div>

      {/* ═══ LISTICLE ═══ */}
      <section className="f1-section">
        <div className="f1-listicle">

          <div className="f1-listicle__item f1-listicle__item--media-right">
            <div className="f1-listicle__content">
              <div className="f1-listicle__num">01</div>
              <h3 className="f1-listicle__title">A scientific full-body analysis.</h3>

              <p className="f1-body">Most programs put you in a box. Ectomorph, mesomorph, endomorph. They hand you a cookie-cutter plan.</p>
              <p className="f1-body">Protocol runs a complete scientific analysis of your body. Every proportion and structural element that published research has linked to perceived attractiveness gets measured and benchmarked against your profile.</p>
              <TrackedLink href={offerHref} className="f1-cta f1-cta--inline" eventName="f1_cta_clicked" eventParams={{ cta_location: "listicle_01" }}>
                Start attractiveness Protocol <ArrowIcon />
              </TrackedLink>
            </div>
            <div className="f1-listicle__media">
              <Image src="/assets/scan-protocol.png" alt="Full body scan analysis" fill sizes="(max-width: 900px) 100vw, 500px" style={{ objectFit: "cover" }} />
            </div>
          </div>

          <div className="f1-listicle__item f1-listicle__item--media-left">
            <div className="f1-listicle__media">
              <Image src="/assets/attractiveness_contextual_targets.svg" alt="Contextual attractiveness targets" fill sizes="(max-width: 900px) 100vw, 500px" style={{ objectFit: "cover" }} />
            </div>
            <div className="f1-listicle__content">
              <div className="f1-listicle__num">02</div>
              <h3 className="f1-listicle__title">According to social psychology, attractiveness is contextual.</h3>
              <p className="f1-body">Your ideal physique is not a fixed target. It depends on your facial structure, your frame, your age, and the social environment you operate in.</p>
              <p className="f1-body">An office lawyer with soft features has a different shoulder-to-waist target than a construction foreman with a strong jaw. Same science. Different targets. Copying someone else&apos;s physique does not work.</p>
              <p className="f1-body">Protocol reads all of these variables before designing your plan.</p>
              <TrackedLink href={offerHref} className="f1-cta f1-cta--inline" eventName="f1_cta_clicked" eventParams={{ cta_location: "listicle_02" }}>
                Start attractiveness Protocol <ArrowIcon />
              </TrackedLink>
            </div>
          </div>

          <div className="f1-listicle__item f1-listicle__item--media-right">
            <div className="f1-listicle__content">
              <div className="f1-listicle__num">03</div>
              <h3 className="f1-listicle__title">Everything the fitness industry taught you is true. It just won&apos;t make you attractive.</h3>
              <p className="f1-body">The workouts work. The diets work. The supplements do what they claim. You will build muscle, lose fat, get stronger.</p>
              <p className="f1-body">The fitness industry optimizes for performance and size. It does not optimize for how people perceive you. That is not a flaw in their method. <strong>It is a different goal.</strong> Nobody told you the difference.</p>
              <TrackedLink href={offerHref} className="f1-cta f1-cta--inline" eventName="f1_cta_clicked" eventParams={{ cta_location: "listicle_03" }}>
                Start attractiveness Protocol <ArrowIcon />
              </TrackedLink>
            </div>
            <div className="f1-listicle__media f1-listicle__media--diagram">
              <Image src="/assets/fitness_vs_attractiveness_goals_v2.svg" alt="Fitness vs attractiveness goals — two different coordinates" fill sizes="(max-width: 900px) 100vw, 500px" style={{ objectFit: "contain" }} />
            </div>
          </div>

          <div className="f1-listicle__item f1-listicle__item--media-left">
            <div className="f1-listicle__media">
              <Image src="/assets/variables_kept_vs_cut_v2.svg" alt="What the protocol keeps vs cuts" fill sizes="(max-width: 900px) 100vw, 500px" style={{ objectFit: "cover" }} />
            </div>
            <div className="f1-listicle__content">
              <div className="f1-listicle__num">04</div>
              <h3 className="f1-listicle__title">Only a few variables drive perception. We built a protocol around those.</h3>
              <p className="f1-body">Most men work on dozens of things at once. Most of those variables do not change how people perceive them.</p>
              <p className="f1-body">Protocol strips away everything that does not impact perception and focuses your effort only on what does. That is why it is faster and simpler. We did not cut corners. We cut everything that has no measurable effect.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ MID CTA ═══ */}

      <div className="f1-mid-cta">
        <TrackedLink href={offerHref} className="f1-cta" eventName="f1_cta_clicked" eventParams={{ cta_location: "mid" }}>
          Start attractiveness Protocol <ArrowIcon />
        </TrackedLink>
        <p className="f1-cta-sub">Based on 5 years of published research &middot; Personalized to your body</p>
      </div>

      {/* ═══ REFRAME ═══ */}
      <section className="f1-section f1-reframe" id="reframe">
        <div className="f1-reframe__inner">
          <div className="f1-section__header">
            <p className="f1-section__eyebrow">The reframe</p>
            <h2 className="f1-section__title f1-section__title--sm">
              You Put in the Work. <span>The Work Was Pointed in the Wrong Direction.</span>
            </h2>
          </div>
          <p className="f1-body">You trained hard, ate clean, stayed consistent. The problem was never your effort. Nobody told you what to aim at.</p>
          <p className="f1-body">The research is clear: proportions matter more than muscle size or body weight. A man with the right proportions at 75kg reads as more attractive than a disproportionate man at 90kg.</p>

          <div className="f1-divider" />

          <div className="f1-section__header">
            <p className="f1-section__eyebrow">You now vs. your potential</p>
            <h3 className="f1-section__title f1-section__title--sm">Same Man. Four Approaches. <span>Only One Worked.</span></h3>
          </div>

          <div className="f1-versions">
            {VERSIONS.map((v) => (
              <div key={v.label} className={`f1-version-card ${v.verdict === "yes" ? "f1-version-card--winner" : ""}`}>
                <div className="f1-version-card__visual">
                  <img src={v.img} alt={v.label} loading="lazy" />
                </div>
                <div className="f1-version-card__body">
                  <div className={`f1-version-card__verdict f1-version-card__verdict--${v.verdict}`}>
                    {v.verdict === "no" ? "\u2717 Not it" : "\u2713 This is it"}
                  </div>
                  <div className="f1-version-card__name">{v.label}</div>
                  <p className="f1-version-card__desc">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="f1-mid-cta">
        <TrackedLink href={offerHref} className="f1-cta" eventName="f1_cta_clicked" eventParams={{ cta_location: "reframe" }}>
          Start attractiveness Protocol <ArrowIcon />
        </TrackedLink>
        <p className="f1-cta-sub">Based on 5 years of published research &middot; Personalized to your body</p>
      </div>

      {/* ═══ DR GARY LINKOV QUOTE ═══ */}
      <GaryLinkovQuoteSection />

      {/* ═══ ORIGIN ═══ */}
      <section className="f1-section">
        <div className="f1-origin">
          <div className="f1-section__header">
            <p className="f1-section__eyebrow">The origin</p>
            <h2 className="f1-section__title f1-section__title--sm">5 Years of Research. <span>One Question.</span></h2>
            <p className="f1-section__subtitle">What makes a man physically attractive from a social perception standpoint?</p>
          </div>
          <div className="f1-origin__timeline">
            {TIMELINE.map((s) => (
              <div key={s.marker} className="f1-origin__step">
                <div className="f1-origin__marker">{s.marker}</div>
                <p className="f1-origin__text">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="f1-mid-cta">
        <TrackedLink href={offerHref} className="f1-cta" eventName="f1_cta_clicked" eventParams={{ cta_location: "origin" }}>
          Start attractiveness Protocol <ArrowIcon />
        </TrackedLink>
        <p className="f1-cta-sub">Based on 5 years of published research &middot; Personalized to your body</p>
      </div>

      {/* ═══ PROOF STORY ═══ */}
      <section className="f1-section f1-proof" id="results">
        <div className="f1-proof__inner">
          <div className="f1-section__header">
            <p className="f1-section__eyebrow">Real story</p>
            <h2 className="f1-section__title f1-section__title--sm">&ldquo;I Trained for 4 Years. <span>Nobody Could Tell.&rdquo;</span></h2>
          </div>

          <div className="f1-proof__card">
            <div className="f1-proof__slider">
              <BeforeAfterSlider beforeSrc="/assets/14-before.png" afterSrc="/assets/14-after.png" beforeAlt="Marcus before" afterAlt="Marcus after" subject="Marcus" />
            </div>
            <div className="f1-proof__author">
              <div className="f1-proof__avatar">T</div>
              <div>
                <div className="f1-proof__name">Marcus, 31</div>
                <div className="f1-proof__meta">Office job &middot; Trained 4x/week for 4 years</div>
              </div>
            </div>
            <p className="f1-body">I&apos;d been consistent for four years. Splits, volume, tracking macros, meal prep on Sundays. My lifts were solid. I&apos;d put on muscle. But nothing changed in how people treated me.</p>
            <p className="f1-body">What surprised me was the depth. They measured my entire body. Proportions, ratios, posture, composition. They benchmarked everything against research data. For the first time I could see the gap: <span className="f1-proof-metric">SWR 1.31</span>, target: <span className="f1-proof-metric">1.46</span>.</p>
            <p className="f1-body">Around week 11, the difference became visible to other people, not just to me. My ratio was at <span className="f1-proof-metric">1.41</span>. The body was not bigger. It was shaped differently.</p>
          </div>
        </div>
      </section>

      <div className="f1-mid-cta">
        <TrackedLink href={offerHref} className="f1-cta" eventName="f1_cta_clicked" eventParams={{ cta_location: "proof" }}>
          Start attractiveness Protocol <ArrowIcon />
        </TrackedLink>
        <p className="f1-cta-sub">Based on 5 years of published research &middot; Personalized to your body</p>
      </div>

      {/* ═══ TESTIMONIALS ═══ */}
      <section className="f1-section">
        <div className="f1-testimonials">
          <div className="f1-section__header">
            <p className="f1-section__eyebrow">Results</p>
            <h2 className="f1-section__title f1-section__title--sm">Different Bodies. <span>Same Science.</span></h2>
          </div>
          <div className="f1-testimonial-grid">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="f1-testimonial-card">
                <div className="f1-testimonial-card__images">
                  <div className="f1-testimonial-card__img-wrap">
                    <Image src={t.before} alt={`${t.name} before`} fill sizes="(max-width: 900px) 40vw, 200px" />
                    <span className="f1-testimonial-card__img-label">Before</span>
                  </div>
                  <div className="f1-testimonial-card__img-wrap">
                    <Image src={t.after} alt={`${t.name} after`} fill sizes="(max-width: 900px) 40vw, 200px" />
                    <span className="f1-testimonial-card__img-label">After</span>
                  </div>
                </div>
                <div className="f1-testimonial-card__obj">Objection: &ldquo;{t.obj}&rdquo;</div>
                <p className="f1-testimonial-card__quote">&ldquo;{t.quote}&rdquo;</p>
                <div className="f1-testimonial-card__name">{t.name}</div>
                <div className="f1-testimonial-card__detail">{t.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="f1-mid-cta">
        <TrackedLink href={offerHref} className="f1-cta" eventName="f1_cta_clicked" eventParams={{ cta_location: "testimonials" }}>
          Start attractiveness Protocol <ArrowIcon />
        </TrackedLink>
        <p className="f1-cta-sub">Based on 5 years of published research &middot; Personalized to your body</p>
      </div>

      {/* ═══ PAIN THRESHOLD ═══ */}
      <section className="f1-section f1-pain">
        <div className="f1-pain__inner">
          <div className="f1-section__header">
            <p className="f1-section__eyebrow">The cost of waiting</p>
            <h2 className="f1-section__title f1-section__title--sm">
              Right now, you&apos;re training without knowing if your body is <span>moving toward its potential</span>.
            </h2>
          </div>

          <div className="f1-pain__grid">
            <div className="f1-pain__col f1-pain__col--without">
              <div className="f1-pain__col-title">Without the protocol</div>
              <ul className="f1-pain__list">{WITHOUT.map((i) => <li key={i}>{i}</li>)}</ul>
            </div>
            <div className="f1-pain__col f1-pain__col--with">
              <div className="f1-pain__col-title">With the Attractiveness Protocol</div>
              <ul className="f1-pain__list">{WITH.map((i) => <li key={i}>{i}</li>)}</ul>
            </div>
          </div>

          <div className="f1-pain__cta">
            <TrackedLink href={offerHref} className="f1-cta" eventName="f1_cta_clicked" eventParams={{ cta_location: "pain" }}>
              Start attractiveness Protocol <ArrowIcon />
            </TrackedLink>
            <p className="f1-cta-sub">Based on 5 years of published research &middot; Personalized to your body</p>
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <ExpertAdviceSection />

      {/* ═══ GUARANTEE ═══ */}
      <section className="f1-section">
        <div className="f1-guarantee">
          <div className="f1-guarantee__box">
            <div className="f1-guarantee__days">90</div>
            <div className="f1-guarantee__unit">Day Guarantee</div>
            <h3>Follow the protocol for 90 days. Measure your proportions. If the data hasn&apos;t moved, full refund.</h3>
            <p>The protocol is built on measurable variables. If those variables don&apos;t change, you don&apos;t pay. No conditions. No exceptions.</p>
          </div>
        </div>
      </section>

      {/* ═══ CLOSE ═══ */}
      <section className="f1-close">
        <div className="f1-close__inner">
          <div className="f1-section__header">
            <p className="f1-section__eyebrow">Your decision</p>
            <h2 className="f1-section__title f1-section__title--sm">You Have <span>Two Options.</span></h2>
          </div>

          <div className="f1-close__option f1-close__option--leave">
            <div className="f1-close__option-label">Option 1. Leave this page</div>
            <p className="f1-close__text">Go back to a program that doesn&apos;t account for your proportions, your face, or your context. Keep putting in the effort without getting what you deserve from it.</p>
            <ul className="f1-close__loss-list">
              <li>Your dating stays below what it could be</li>
              <li>Your career doesn&apos;t reflect the treatment you&apos;d get if people perceived you differently</li>
              <li>Your confidence stays capped because your physique doesn&apos;t project your potential</li>
              <li>Time passes. The gap stays open</li>
            </ul>
          </div>

          <div className="f1-close__option f1-close__option--discover">
            <div className="f1-close__option-label">Option 2. Start attractiveness Protocol</div>
            <p className="f1-close__text">Answer a few questions about your body and context. Get your personalized attractiveness roadmap — the exact variables to train, the exact targets to hit.</p>
            <TrackedLink href={offerHref} className="f1-cta f1-cta--large f1-cta--inverted" eventName="f1_cta_clicked" eventParams={{ cta_location: "close" }}>
              Start attractiveness Protocol
            </TrackedLink>
          </div>

          <p className="f1-close__meta">Based on published research &middot; 90-day guarantee</p>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="f1-footer">
        <p>Protocol Club &middot; Attractiveness science, applied.</p>
        <p>&copy; {new Date().getFullYear()} Protocol Club. All rights reserved.</p>
      </footer>
    </div>
  );
}
