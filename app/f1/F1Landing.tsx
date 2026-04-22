"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import TrackedLink from "../tracked-link";
import GaryLinkovQuoteSection from "../program/GaryLinkovQuoteSection";
import ExpertAdviceSection from "../program/ExpertAdviceSection";
import BeforeAfterSlider from "../program/BeforeAfterSlider";
import type { ResearchTab } from "../program/ResearchImpactSection";
import { getUtmParams, persistUtmParams, appendUtmToPath } from "../../lib/utm";
import "../program/program.css";
import "./f1.css";

const ResearchImpactSection = dynamic(() => import("../program/ResearchImpactSection"));

/* ─── Icons ──────────────────────────────────────────────────────────────── */

function ArrowIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <path d="M6 14H22M22 14L14 6M22 14L14 22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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

/* ─── Versions reveal (process-of-elimination animation) ─────────────────── */

function VersionsReveal() {
  const [visibleCount, setVisibleCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          VERSIONS.forEach((_, i) => {
            setTimeout(() => setVisibleCount(i + 1), i * 650);
          });
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="f1-versions" ref={ref}>
      {VERSIONS.map((v, i) => (
        <div
          key={v.label}
          className={`f1-version-card${v.verdict === "yes" ? " f1-version-card--winner" : ""}${i < visibleCount ? " f1-version-card--visible" : ""}`}
        >
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
  );
}

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

      {/* ═══ HERO V1 — GQ / Glossy ═══ */}
      <div className="f1-pub-bar">
        <div className="f1-pub-bar__left">
          <div className="f1-pub-section">The Body Issue</div>
        </div>
      </div>

      <div className="f1-hero-v1">
        <Image
          src="/assets/14-after.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="f1-hero-v1__img"
          style={{ objectFit: "cover", objectPosition: "top" }}
        />
        <div className="f1-hero-v1__overlay" aria-hidden="true" />
        <div className="f1-hero-v1__text">
          <div className="f1-hero-v1__kicker">
            Protocol Club
          </div>
          <h1 className="f1-hero-v1__headline">
            4 steps to improve your <em>physical attractiveness</em>
          </h1>
          <p className="f1-hero-v1__deck">
            A four-year MIT study analyzed what the eye actually reads as attractive in the male body — and built a 12-week protocol around it.
          </p>
          <div className="f1-hero-v1__byline-row">
            <div className="f1-hero-v1__byline">
              By <strong>Eleanor Marsh</strong> · Photographs by <strong>Kaspar Lynn</strong> · 3 min read
            </div>
            <a href="#article" className="f1-hero-v1__cta">
              Discover the study
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      <div className="f1-press-strip">
        <span className="f1-press-strip__label">Also covered by</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/press/gq.webp" alt="GQ" className="f1-press-strip__logo" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/press/wired.webp" alt="Wired" className="f1-press-strip__logo" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/press/the-guardian.webp" alt="The Guardian" className="f1-press-strip__logo" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/press/business-insider.webp" alt="Business Insider" className="f1-press-strip__logo" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/press/mit-technology-review.webp" alt="MIT Tech Review" className="f1-press-strip__logo" />
      </div>

      {/* ═══ LISTICLE ═══ */}
      <section id="article" className="f1-section">
        <div className="f1-listicle">

          <div className="f1-listicle__item f1-listicle__item--media-right">
            <div className="f1-listicle__content">
              <div className="f1-listicle__num">01</div>
              <h3 className="f1-listicle__title">A scientific full-body analysis.</h3>

              <p className="f1-body">Most programs put you in a box. Ectomorph, mesomorph, endomorph. They hand you a cookie-cutter plan.</p>
              <p className="f1-body">This protocol runs a complete scientific analysis of your body. Every proportion and structural element that published research has linked to perceived attractiveness gets measured and benchmarked against your profile.</p>
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
              <p className="f1-body">The ideal physique is not a fixed target. It depends on your facial structure, your frame, your age, and the social environment you operate in.</p>
              <p className="f1-body">An office lawyer with soft features has a different shoulder-to-waist target than a construction foreman with a strong jaw.</p>
              <TrackedLink href={offerHref} className="f1-cta f1-cta--inline" eventName="f1_cta_clicked" eventParams={{ cta_location: "listicle_02" }}>
                Start attractiveness Protocol <ArrowIcon />
              </TrackedLink>
            </div>
          </div>

          <div className="f1-listicle__item f1-listicle__item--media-right">
            <div className="f1-listicle__content">
              <div className="f1-listicle__num">03</div>
              <h3 className="f1-listicle__title">Everything the fitness industry taught you is true. It just won&apos;t make you attractive.</h3>
              <p className="f1-body">The fitness industry optimizes for performance and size. It does not optimize for how people perceive you. That is not a flaw in their method. <strong>It is a different goal.</strong> Nobody told you the difference.</p>
              <TrackedLink href={offerHref} className="f1-cta f1-cta--inline" eventName="f1_cta_clicked" eventParams={{ cta_location: "listicle_03" }}>
                Start attractiveness Protocol <ArrowIcon />
              </TrackedLink>
            </div>
            <div className="f1-listicle__media f1-listicle__media--diagram">
              <Image src="/assets/fitness_vs_attractiveness_goals_v2.svg" alt="Fitness vs attractiveness goals — two different coordinates" fill sizes="(max-width: 900px) 100vw, 500px" style={{ objectFit: "contain" }} />
            </div>
          </div>

          <div className="f1-listicle__item f1-listicle__item--media-left f1-listicle__item--keep-size">
            <div className="f1-listicle__media" style={{ aspectRatio: "480 / 380" }}>
              <Image src="/assets/variables_kept_vs_cut_v2.svg" alt="What the protocol keeps vs cuts" fill sizes="(max-width: 900px) 100vw, 500px" style={{ objectFit: "contain" }} />
            </div>
            <div className="f1-listicle__content">
              <div className="f1-listicle__num">04</div>
              <h3 className="f1-listicle__title">Attractiveness variables drive perception. These are not the same as fitness industry ones.</h3>
              <p className="f1-body">Most men work on dozens of things at once. Most of those variables do not change how people perceive them.</p>
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
          <p style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", marginTop: 16, fontStyle: "italic" }}>
            Results are not typical. Individual results vary. Testimonials reflect personal experiences and do not guarantee similar outcomes.
          </p>
        </div>
      </section>

      <div className="f1-mid-cta">
        <TrackedLink href={offerHref} className="f1-cta" eventName="f1_cta_clicked" eventParams={{ cta_location: "testimonials" }}>
          Start attractiveness Protocol <ArrowIcon />
        </TrackedLink>
        <p className="f1-cta-sub">Based on 5 years of published research &middot; Personalized to your body</p>
      </div>

      {/* ═══ RESEARCH TABS ═══ */}
      <div id="research">
        <ResearchImpactSection
          tabs={RESEARCH_TABS}
          titleHtml="Your Physical Attractiveness Impacts <strong>Every Part Of Your Life</strong>"
          subtitle=""
        />
      </div>

      {/* ═══ SHAPE FRAME ═══ */}
      <section className="f1-section f1-shape" id="shape">
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

          <div style={{ display: "none" }}>
            <div className="f1-section__header">
              <p className="f1-section__eyebrow">You now vs. your potential</p>
              <h3 className="f1-section__title f1-section__title--sm">Same Man. Four Approaches. <span>Only One Worked.</span></h3>
            </div>

            <VersionsReveal />
          </div>

          <div className="f1-mid-cta">
            <TrackedLink href={offerHref} className="f1-cta" eventName="f1_cta_clicked" eventParams={{ cta_location: "reframe" }}>
              Start attractiveness Protocol <ArrowIcon />
            </TrackedLink>
            <p className="f1-cta-sub">Based on 5 years of published research &middot; Personalized to your body</p>
          </div>
        </div>
      </section>

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
              <div className="f1-proof__avatar">M</div>
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
