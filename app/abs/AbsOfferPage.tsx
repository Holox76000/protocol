"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { trackGa4Event } from "../../lib/ga4Event";
import { trackEvent } from "../../lib/analytics";
import { getUtmParams, persistUtmParams, getPersistedUtmParams } from "../../lib/utm";
import { EXPERIMENTS } from "../../lib/experiments";
import { CompareBars } from "../../components/CompareBars";
import "../f1/f1.css";
import "../f1/offer/f1-offer.css";
import "../dating/dating.css";
import "./abs.css";

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

function StarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 1l2.09 4.26L14.8 6l-3.4 3.32.8 4.68L8 11.77 3.8 14l.8-4.68L1.2 6l4.71-.74L8 1z" />
    </svg>
  );
}

/* ─── Plans ─────────────────────────────────────────────────────────────── */

const PLANS = EXPERIMENTS.abs.plans;
const DEFAULT_PLAN_KEY = EXPERIMENTS.abs.defaultPlanKey;

// The selected plan is shared across every CTA on the page (nav, hero, sticky,
// pricing selector) so any button checks out the tier the visitor picked.
const PlanContext = createContext<{
  plan: string;
  setPlan: (key: string) => void;
}>({ plan: DEFAULT_PLAN_KEY, setPlan: () => {} });

/* ─── Checkout ──────────────────────────────────────────────────────────── */

async function startCheckout(location: string, label: string, plan: string): Promise<boolean> {
  trackGa4Event("abs_offer_cta_clicked", {
    funnel: "abs",
    cta_location: location,
    cta_label: label,
    plan,
  });
  trackEvent("offer_cta_clicked", { funnel: "abs", cta_location: location, plan });

  const utms = { ...getPersistedUtmParams(), ...getUtmParams() };
  const gaClientId = document.cookie
    .split("; ")
    .find((c) => c.startsWith("_ga="))
    ?.slice(4);

  try {
    const res = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        funnel: "abs",
        landing_page: "/abs",
        plan,
        ...utms,
        ...(gaClientId && { ga_client_id: gaClientId }),
      }),
    });
    const data = (await res.json()) as { url?: string };
    if (data.url) {
      window.location.assign(data.url);
      return true;
    }
  } catch {
    // fall through to reset the button
  }
  return false;
}

function CheckoutButton({
  label,
  className,
  location,
  withArrow = true,
}: {
  label: string;
  className: string;
  location: string;
  withArrow?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const { plan } = useContext(PlanContext);

  const handleClick = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    const ok = await startCheckout(location, label, plan);
    if (!ok) setLoading(false);
  }, [loading, location, label, plan]);

  return (
    <button type="button" onClick={handleClick} className={`dt-btn ${className}`} disabled={loading}>
      {loading ? (
        <span className="mo-cta__spinner" aria-hidden="true" />
      ) : (
        <>
          <span>{label}</span>
          {withArrow && <ArrowIcon size={16} />}
        </>
      )}
    </button>
  );
}

/* ─── Data ──────────────────────────────────────────────────────────────── */

const CTA_LABEL = "Get my abs analysis";
// Cheapest plan drives the "from $X" hint so it stays correct if pricing changes.
const CTA_CHEAPEST = [...PLANS].sort((a, b) => a.priceCents - b.priceCents)[0];
const CTA_PER = CTA_CHEAPEST.interval === "week" ? "/wk" : CTA_CHEAPEST.interval === "month" ? "/mo" : "/yr";
const CTA_LABEL_PRICED = `${CTA_LABEL} · from ${CTA_CHEAPEST.priceLabel}${CTA_PER}`;

const STEPS = [
  {
    num: "01",
    time: "5 MIN",
    title: "Two photos + a short questionnaire",
    desc: "Front and side, phone camera, normal light. Then a few questions about your training and how you eat.",
  },
  {
    num: "02",
    time: "AI SCAN",
    title: "We score your abs, zone by zone",
    desc: "Upper abs, lower abs, obliques, deep core, V-taper — plus an estimated body-fat range and the one factor hiding your abs most.",
  },
  {
    num: "03",
    time: "48 H",
    title: "Your plan in your inbox",
    desc: "Training and calories, week by week, ordered around your blocker. It adapts each month from your re-scan — not a generic ab routine.",
  },
];

const RESEARCH_CARDS: { title: string; desc: string; art: "gauge" | "abs-lower" | "abs-frame" }[] = [
  {
    title: "Body fat is the gate",
    desc: "Below roughly 15% body fat, abs show. Above it, no volume of crunches makes them visible. Most men train the muscle and ignore the gate.",
    art: "gauge",
  },
  {
    title: "Lower abs lag by design",
    desc: "The lower segment activates last and holds fat longest. If your top two abs show and nothing else, that's the pattern to break.",
    art: "abs-lower",
  },
  {
    title: "Shape comes from the frame",
    desc: "Obliques and V-taper frame the six-pack. A strong rectus with weak obliques still reads as no abs in a photo.",
    art: "abs-frame",
  },
];

const REPORT_ITEMS = [
  {
    title: "Abs Score (0–100)",
    desc: "One number for where you stand today — and the target your plan is built to hit.",
  },
  {
    title: "Zone-by-zone breakdown",
    desc: "Upper abs, lower abs, obliques, deep core, V-taper — each scored, so you know what's built and what's missing.",
  },
  {
    title: "Body-fat estimate",
    desc: "A visual range from your photos — the number that decides whether training or diet comes first.",
  },
  {
    title: "Your #1 blocker",
    desc: "The single factor keeping your abs hidden. Everything in the plan is ordered around it.",
  },
  {
    title: "Adaptive plan",
    desc: "Training and calories, week by week — re-ordered every month from your latest re-scan.",
  },
  {
    title: "The don't-do list",
    desc: "The exercises and habits wasting your time, cut from day one.",
  },
];

const LIKE_YOU_CARDS: { title: string; desc: string; art?: "plans" | "calendar" }[] = [
  {
    title: "Your starting point",
    desc: "A 28% body-fat plan and a 15% plan look nothing alike. Yours starts from your numbers.",
    art: "plans",
  },
  {
    title: "Your schedule",
    desc: "Three mornings a week or six evenings — the plan fits the sessions you'll actually do.",
    art: "calendar",
  },
  {
    title: "Your blocker first",
    desc: "Diet, lower-ab lag, or a weak frame: the plan attacks your limiting factor first, because that's where the visible change is.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "Turns out my abs weren't the problem — my body fat was 4% too high. Eight weeks into the plan the top four are visible.",
    name: "Marcus, 31",
    meta: "June 2026",
    chip: { label: "Abs Score · 8 weeks", from: 48, to: 71 },
  },
  {
    quote:
      "First plan that told me what NOT to do. Dropped the daily crunches, fixed the diet, saw more in six weeks than in two years.",
    name: "Danny, 27",
    meta: "July 2026",
    chip: { label: "Abs Score · 6 weeks", from: 52, to: 79 },
  },
  {
    quote:
      "The scan called out my lower abs and it was right. The lower-ab block in the plan is brutal but it works.",
    name: "Chris, 34",
    meta: "May 2026",
    chip: { label: "Lower abs · 12 weeks", from: 39, to: 68 },
  },
];

const PRICING_BULLETS = [
  "Abs Score 0–100 + zone-by-zone breakdown",
  "Estimated body-fat range from your photos",
  "Your #1 visibility blocker, identified",
  "Adaptive plan: training + calories, week by week",
  "Monthly re-scan — track your score over time",
  "First report by email within 48 hours",
  "Photos deleted after your scan",
];

const FAQS = [
  {
    q: "What photos do I need?",
    a: "Two phone photos — front and side, shirt off, normal indoor light. No pump, no special lighting: the scan is calibrated for regular photos.",
  },
  {
    q: "How accurate is the body-fat estimate?",
    a: "It's a visual estimate with a range (e.g. 19–22%), not a DEXA scan. For deciding what your plan should attack first, a range is exactly what's needed.",
  },
  {
    q: "I'm a complete beginner — is this for me?",
    a: "Yes. The plan is built from your scan and your questionnaire, training history included. Beginners get a beginner's plan, not a scaled-down advanced one.",
  },
  {
    q: "How is this different from a fitness app?",
    a: "Apps hand you routines. This starts with a diagnosis — what's hiding your abs specifically — then builds the plan in that order.",
  },
  {
    q: "How do I cancel?",
    a: "Reply \"cancel\" to any email from us — handled the same day. No calls, no forms, no retention flow.",
  },
  {
    q: "What happens to my photos?",
    a: "They're used once for your scan, then deleted. Never shared, never used for anything else.",
  },
];

/* ─── Trustpilot badge ──────────────────────────────────────────────────── */

function TrustpilotBadge() {
  return (
    <div className="mo-tp-badge">
      <div className="mo-tp-badge__body">
        <div className="mo-tp-badge__stars">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className="mo-tp-badge__star">★</span>
          ))}
        </div>
        <p className="mo-tp-badge__meta"><strong>4.8</strong> · early member reviews</p>
      </div>
    </div>
  );
}

/* ─── Urgency: launch price countdown ───────────────────────────────────── */

// Launch-pricing window ends here, then rates rise. Extend by moving this date.
const PRICE_BUMP_AT = new Date("2026-09-02T22:00:00Z");

function formatCountdown(ms: number): string {
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return d > 0 ? `${d}d ${h}h` : `${h}h ${m}m`;
}

function UrgencyBar() {
  // Time-dependent → compute after mount to avoid a hydration mismatch.
  const [countdown, setCountdown] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => {
      const ms = PRICE_BUMP_AT.getTime() - Date.now();
      setCountdown(ms > 0 ? formatCountdown(ms) : "");
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="dt-urgency" role="note">
      <span className="dt-urgency__price">
        <strong>Launch pricing</strong>
        {countdown
          ? <> — lock in your rate before it rises in <strong>{countdown}</strong></>
          : <> — lock in your rate before it rises</>}
      </span>
    </div>
  );
}

/* ─── Sample scan report (hero visual) ──────────────────────────────────── */

const REPORT_ZONES = [
  { name: "Upper abs", score: 71 },
  { name: "Lower abs", score: 43 },
  { name: "Obliques", score: 58 },
  { name: "Deep core", score: 66 },
  { name: "V-taper", score: 62 },
];

function AbsReportCard() {
  return (
    <div className="ab-report">
      <div className="ab-report__head">
        <span className="ab-report__title">Abs Scan Report</span>
        <span className="ab-report__tag">Sample</span>
      </div>
      <div className="ab-report__subject">
        <img src="/abs/scan-torso.jpg" alt="AI abs scan subject" />
        <span className="ab-report__scan ab-report__scan--tl" />
        <span className="ab-report__scan ab-report__scan--tr" />
        <span className="ab-report__scan ab-report__scan--bl" />
        <span className="ab-report__scan ab-report__scan--br" />
        <span className="ab-report__scanline" />
      </div>
      <div className="ab-report__score">
        <div className="ab-report__score-num">54<span>/100</span></div>
        <div className="ab-report__score-label">Abs Score</div>
      </div>
      <div className="ab-report__bars">
        {REPORT_ZONES.map((z) => (
          <div key={z.name} className="ab-report__bar-row">
            <span className="ab-report__bar-name">{z.name}</span>
            <div className="ab-report__bar"><div style={{ width: `${z.score}%` }} /></div>
            <span className="ab-report__bar-val">{z.score}</span>
          </div>
        ))}
      </div>
      <div className="ab-report__blocker">
        <span>Primary blocker</span>
        <strong>Body fat — est. 13–15%</strong>
      </div>
    </div>
  );
}

/* ─── Zone map + plan mockups (recreated in our design language — see
       reference/abmaxx/README.md for the App Store references) ───────────── */

function AbsZoneMap() {
  return (
    <div className="ab-mock ab-zonemap">
      <div className="ab-report__head">
        <span className="ab-report__title">Zone Scan</span>
        <span className="ab-report__tag">From your photo</span>
      </div>
      <div className="ab-report__subject">
        <img src="/abs/scan-torso.jpg" alt="AI abs zone scan subject" />
        <span className="ab-zonemap__weakbox" />
        <span className="ab-report__scan ab-report__scan--tl" />
        <span className="ab-report__scan ab-report__scan--tr" />
        <span className="ab-report__scan ab-report__scan--bl" />
        <span className="ab-report__scan ab-report__scan--br" />
      </div>
      <div className="ab-zonemap__weak">
        <span className="ab-zonemap__weak-dot" />
        <div>
          <div className="ab-zonemap__weak-name">Weak zone — lower abs</div>
          <div className="ab-zonemap__weak-sub">Scored 43 / 100, your least developed</div>
        </div>
      </div>
      <div className="ab-report__blocker">
        <span>Est. body fat</span>
        <strong>13–15% — diet leads, training follows</strong>
      </div>
    </div>
  );
}

const PLAN_ROWS = [
  { name: "Hanging leg raises", sets: "3 × 12", img: "/abs/ex-hanging-leg-raises.jpg" },
  { name: "Reverse crunches", sets: "4 × 15", img: "/abs/ex-reverse-crunches.jpg" },
  { name: "Flutter kicks", sets: "4 × 40s", img: "/abs/ex-flutter-kicks.jpg" },
];

function AbsPlanCard() {
  return (
    <div className="ab-mock ab-plan">
      <div className="ab-report__head">
        <span className="ab-report__title">Your Plan</span>
        <span className="ab-report__tag">Week 1 · Day 1</span>
      </div>
      <div className="ab-plan__focus">
        <div className="ab-plan__focus-name">Lower-ab block</div>
        <div className="ab-plan__focus-meta">~15 min · 5 exercises · 410 kcal deficit today</div>
      </div>
      <p className="ab-plan__why">Your lower abs scored 43 — week one opens on that zone.</p>
      <div className="ab-plan__rows">
        {PLAN_ROWS.map((r) => (
          <div key={r.name} className="ab-plan__row">
            <img className="ab-plan__thumb" src={r.img} alt="" />
            <span className="ab-plan__row-name">{r.name}</span>
            <span className="ab-plan__row-sets">{r.sets}</span>
          </div>
        ))}
        <div className="ab-plan__row ab-plan__row--more">+ 2 more, unlocked day by day</div>
      </div>
      <div className="ab-report__blocker">
        <span>Adapts weekly</span>
        <strong>Re-scan at day 30 — the plan re-orders itself</strong>
      </div>
    </div>
  );
}

/* ─── Show-don't-tell materializations ──────────────────────────────────── */

// Rectus-abdominis schema. `variant` decides what lights up in accent:
//  · "abs-lower"  → top pair lit, everything below dimmed (lower abs lag)
//  · "abs-frame"  → obliques + V-taper lit, central rectus dimmed (the frame)
function AbsAnatomy({ variant }: { variant: "abs-lower" | "abs-frame" }) {
  const lit = (part: "top" | "rest" | "frame") =>
    variant === "abs-lower"
      ? part === "top"
      : part === "frame";
  const seg = (part: "top" | "rest") => (lit(part) ? "var(--accent)" : "#e4e9eb");
  const frame = lit("frame") ? "var(--accent)" : "#e4e9eb";
  return (
    <svg className="ab-anatomy" viewBox="0 0 120 150" fill="none" aria-hidden="true">
      {/* obliques (the frame) */}
      <path d="M42 34 L30 44 L34 104 L44 96 Z" fill={frame} opacity={0.9} />
      <path d="M78 34 L90 44 L86 104 L76 96 Z" fill={frame} opacity={0.9} />
      {/* upper pair — the two segments that show first */}
      <rect x="45" y="22" width="14.5" height="21" rx="5" fill={seg("top")} />
      <rect x="60.5" y="22" width="14.5" height="21" rx="5" fill={seg("top")} />
      {/* mid pair */}
      <rect x="45" y="47" width="14.5" height="21" rx="5" fill={seg("rest")} />
      <rect x="60.5" y="47" width="14.5" height="21" rx="5" fill={seg("rest")} />
      {/* lower pair — lags */}
      <rect x="45" y="72" width="14.5" height="21" rx="5" fill={seg("rest")} />
      <rect x="60.5" y="72" width="14.5" height="21" rx="5" fill={seg("rest")} />
      {/* suprapubic block */}
      <rect x="45" y="97" width="30" height="26" rx="9" fill={seg("rest")} />
      {/* V-taper (part of the frame) */}
      <path d="M34 104 L60 140 L86 104" stroke={frame} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Body-fat threshold gauge: 25%→10% scale, "abs visible" at ~15%.
function BodyFatGauge() {
  return (
    <div className="ab-gauge" aria-hidden="true">
      <div className="ab-gauge__track">
        <div className="ab-gauge__zone ab-gauge__zone--hidden">hidden</div>
        <div className="ab-gauge__zone ab-gauge__zone--visible">visible</div>
      </div>
      <div className="ab-gauge__marker">
        <span className="ab-gauge__marker-lbl">abs visible ~15%</span>
      </div>
      <div className="ab-gauge__scale">
        <span>25%</span>
        <span className="ab-gauge__scale--mid">15%</span>
        <span>10%</span>
      </div>
    </div>
  );
}

function ResearchArt({ kind }: { kind: "gauge" | "abs-lower" | "abs-frame" }) {
  return (
    <div className="ab-research-art">
      {kind === "gauge" ? <BodyFatGauge /> : <AbsAnatomy variant={kind} />}
    </div>
  );
}

// Two side-by-side mini plan-cards — same product, opposite prescriptions.
const MINI_PLANS = [
  { bf: "28% body fat", lead: "Diet leads", diet: 84, train: 30 },
  { bf: "15% body fat", lead: "Training leads", diet: 34, train: 88 },
];

function StartingPointArt() {
  return (
    <div className="ab-mini-plans">
      {MINI_PLANS.map((p) => (
        <div key={p.bf} className="ab-mini">
          <span className="ab-mini__bf">{p.bf}</span>
          <div className="ab-mini__lead">{p.lead}</div>
          <div className="ab-mini__split">
            <span className="ab-mini__split-lbl">Diet</span>
            <div className="ab-mini__bar"><div style={{ width: `${p.diet}%` }} /></div>
            <span className="ab-mini__split-lbl">Train</span>
            <div className="ab-mini__bar"><div style={{ width: `${p.train}%` }} /></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// 7-day calendar strip, two schedules — same plan, different sessions.
const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const SCHEDULES = [
  { tag: "3 mornings", slot: "AM", on: [0, 2, 4] },
  { tag: "6 evenings", slot: "PM", on: [0, 1, 2, 3, 4, 5] },
];

function ScheduleStrip() {
  return (
    <div className="ab-cal">
      {SCHEDULES.map((s) => (
        <div key={s.tag} className="ab-cal__row">
          <span className="ab-cal__tag">{s.tag}</span>
          <div className="ab-cal__days">
            {DAYS.map((d, i) => {
              const on = s.on.includes(i);
              return (
                <span key={i} className={`ab-cal__day ${on ? "ab-cal__day--on" : ""}`}>
                  <span className="ab-cal__dow">{d}</span>
                  {on && <span className="ab-cal__slot">{s.slot}</span>}
                </span>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function LikeYouArt({ kind }: { kind: "plans" | "calendar" }) {
  return (
    <div className="ab-likeyou-art">
      {kind === "plans" ? <StartingPointArt /> : <ScheduleStrip />}
    </div>
  );
}

// Numeric result chip, styled like the hero flashcard.
function TestiChip({ label, from, to }: { label: string; from: number; to: number }) {
  return (
    <div className="ab-testi-chip">
      <span className="ab-testi-chip__label">{label}</span>
      <span className="ab-testi-chip__val">{from} <em>→</em> {to}</span>
      <span className="ab-testi-chip__delta">+{to - from}</span>
    </div>
  );
}

// Founder pivot: one routine → two outcomes.
function DivergeViz() {
  return (
    <div className="ab-diverge" aria-hidden="true">
      <div className="ab-diverge__src">Same ab routine</div>
      <svg className="ab-diverge__lines" viewBox="0 0 200 34" fill="none" preserveAspectRatio="none">
        <path d="M100 0 C100 18 55 12 40 34" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
        <path d="M100 0 C100 18 145 12 160 34" stroke="#c9d2d6" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <div className="ab-diverge__outs">
        <div className="ab-diverge__out ab-diverge__out--win">
          <span className="ab-diverge__ico"><CheckIcon size={12} /></span>
          Six-pack in 3 months
        </div>
        <div className="ab-diverge__out ab-diverge__out--lose">
          <span className="ab-diverge__ico ab-diverge__ico--x">✕</span>
          Nothing in a year
        </div>
      </div>
    </div>
  );
}

/* ─── Sections ──────────────────────────────────────────────────────────── */

function ANav() {
  return (
    <nav className="mo-nav">
      <div className="mo-nav__brand">Protocol <em>Abs</em></div>
      <div className="mo-nav__links">
        <a href="#ab-method">How it works</a>
        <a href="#mo-pricing">Pricing</a>
      </div>
      <CheckoutButton label={CTA_LABEL_PRICED} className="mo-nav__cta" location="nav" withArrow={false} />
    </nav>
  );
}

function AHero() {
  return (
    <section className="mo-hero mo-hero-v1">
      <div className="mo-hero-v1__left">
        <div className="mo-hero-v1__copy">
          <h1 className="mo-hero__title">Your abs are there. <em>See what&rsquo;s hiding them.</em></h1>
          <p className="mo-hero__desc">
            Upload two photos. Our AI scores your abs zone by zone, estimates your
            body fat, and builds a plan that adapts monthly. First report in 48 hours.
          </p>
          <div className="mo-hero__ctas">
            <CheckoutButton label={CTA_LABEL_PRICED} className="mo-cta mo-cta--hero" location="hero" />
            <a href="#ab-method" className="mo-hero__cta-ghost">See how it works</a>
          </div>
          <TrustpilotBadge />
          <div className="mo-hero__meta">
            <span>from $8.99/week</span>
            <span className="mo-hero__meta-dot">·</span>
            <span>adaptive plan</span>
            <span className="mo-hero__meta-dot">·</span>
            <span>cancel anytime</span>
          </div>
        </div>
      </div>

      {/* Mobile: copy above the visual */}
      <div className="mo-hero-v1__mobile-ctas mo-hero-pad">
        <h1 className="mo-hero__title">Your abs are there. <em>See what&rsquo;s hiding them.</em></h1>
        <p className="mo-hero__desc">
          Upload two photos. Our AI scores your abs zone by zone, estimates your
          body fat, and builds a plan that adapts monthly. First report in 48 hours.
        </p>
      </div>

      {/* Right column: sample scan report */}
      <div className="mo-hero-v1__right ab-hero-right">
        <div className="mo-hero-v1__product-stack">
          <div className="ab-report-wrap">
            <AbsReportCard />
            <div className="mo-hero-v1__fc mo-hero-v1__fc--ratio">
              <div className="mo-fc-label">Abs Score / 90 days</div>
              <div className="mo-fc-val">54 <em>→</em> 82</div>
              <div className="mo-fc-delta">+28</div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: CTA strip below the visual */}
      <div className="mo-hero-v1__mobile-cta-strip mo-hero-pad">
        <CheckoutButton label={CTA_LABEL_PRICED} className="mo-cta mo-cta--hero" location="hero-mobile" />
        <a href="#ab-method" className="mo-hero__cta-ghost">See how it works</a>
        <TrustpilotBadge />
      </div>
    </section>
  );
}

function AResearch() {
  return (
    <section className="mo-section mo-section--surface">
      <div className="mo-container">
        <div className="mo-section-head--center">
          <p className="mo-section-eyebrow mo-section-eyebrow--center">Why abs stay hidden</p>
          <h2 className="mo-section-title" style={{ marginTop: 12 }}>
            Everyone trains abs. <em>Almost no one diagnoses them.</em>
          </h2>
          <p className="dt-research-sub">
            Crunches don&rsquo;t fix what&rsquo;s actually hiding your abs. Three things do the
            hiding — your scan tells you which one is yours.
          </p>
        </div>
        <div className="dt-research-grid">
          {RESEARCH_CARDS.map((c) => (
            <div key={c.title} className="dt-research-card ab-research-card">
              <h3>{c.title}</h3>
              <p>{c.desc}</p>
              <ResearchArt kind={c.art} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ASteps() {
  return (
    <section id="ab-method" className="mo-section">
      <div className="mo-container">
        <div className="mo-section-head">
          <div>
            <div className="mo-section-eyebrow">How it works</div>
            <h2 className="mo-section-title">Scan first. <em>Then the plan.</em></h2>
          </div>
        </div>
        <div className="mo-steps-grid">
          {STEPS.map((s) => (
            <div key={s.num} className="mo-step">
              <div className="mo-step__head">
                <div className="mo-step__num">{s.num} /</div>
                <div className="mo-step__time">{s.time}</div>
              </div>
              <h3 className="mo-step__title">{s.title}</h3>
              <p className="mo-step__desc">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="mo-section-cta">
          <CheckoutButton label={CTA_LABEL_PRICED} className="mo-cta" location="steps" />
        </div>
      </div>
    </section>
  );
}

function AReport() {
  return (
    <section className="mo-section mo-section--surface">
      <div className="mo-container">
        <div className="mo-section-head--center">
          <p className="mo-section-eyebrow mo-section-eyebrow--center">Inside your report</p>
          <h2 className="mo-section-title" style={{ marginTop: 12 }}>
            Six things you get. <em>One decides the rest.</em>
          </h2>
        </div>
        <div className="ab-report-map">
          <div className="ab-report-map__card">
            <AbsReportCard />
          </div>
          <ol className="ab-report-legend">
            {REPORT_ITEMS.map((c, i) => (
              <li key={c.title} className="ab-report-legend__row">
                <span className="ab-report-legend__num">{i + 1}</span>
                <div>
                  <h3 className="ab-report-legend__title">{c.title}</h3>
                  <p className="ab-report-legend__desc">{c.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="mo-section-cta">
          <CheckoutButton label={CTA_LABEL_PRICED} className="mo-cta" location="report" />
        </div>
      </div>
    </section>
  );
}

function AScanToPlan() {
  return (
    <section className="mo-section">
      <div className="mo-container">
        <div className="mo-section-head--center">
          <p className="mo-section-eyebrow mo-section-eyebrow--center">Scan → plan</p>
          <h2 className="mo-section-title" style={{ marginTop: 12 }}>
            The scan finds the zone. <em>The plan trains it.</em>
          </h2>
        </div>
        <div className="ab-s2p">
          <AbsZoneMap />
          <div className="dt-ba-arrow ab-s2p__arrow" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <AbsPlanCard />
        </div>
        <div className="mo-section-cta">
          <CheckoutButton label={CTA_LABEL_PRICED} className="mo-cta" location="scan-to-plan" />
        </div>
      </div>
    </section>
  );
}

function ALikeYou() {
  return (
    <section className="mo-section">
      <div className="mo-container">
        <div className="mo-section-head--center">
          <p className="mo-section-eyebrow mo-section-eyebrow--center">Calibrated to you</p>
          <h2 className="mo-section-title" style={{ marginTop: 12 }}>
            Built on your physique. <em>Not a template.</em>
          </h2>
          <p className="dt-research-sub">
            Generic programs prescribe the same thing to every body. Your plan starts from
            what the scan found in yours.
          </p>
        </div>
        <div className="dt-research-grid">
          {LIKE_YOU_CARDS.map((c) => (
            <div key={c.title} className="dt-research-card ab-research-card">
              <h3>{c.title}</h3>
              <p>{c.desc}</p>
              {c.art && <LikeYouArt kind={c.art} />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AFounderStory() {
  return (
    <section className="mo-section">
      <div className="mo-container">
        <div className="dt-founder">
          <svg className="dt-founder__mark" width="28" height="24" viewBox="0 0 13 12" fill="none" aria-hidden="true">
            <path d="M0 12V7.08C0 3.75 0.94 1.23 4.92 0V2.52C3.04 3.16 2.46 4.27 2.52 7.08H4.92V12H0ZM10.3 7.08H12.76V12H7.84V7.08C7.84 3.75 8.72 1.23 12.7 0V2.52C10.83 3.16 10.3 4.27 10.3 7.08Z" fill="currentColor"/>
          </svg>
          <p className="mo-section-eyebrow">From the founder</p>
          <h2 className="mo-section-title" style={{ marginTop: 12 }}>
            The routine was never the problem. <em>The diagnosis was missing.</em>
          </h2>
          <div className="dt-founder__body">
            <p>
              I&rsquo;ve spent years building body-transformation programs, and the same pattern
              kept coming back: two men follow the same ab routine — one sees a six-pack in three
              months, the other sees nothing in a year.
            </p>
            <p>
              One of them needed to drop body fat before a single crunch mattered. The other
              needed lower-ab volume and nothing else. Generic programs ignore that, which is
              why they fail quietly — and why people blame themselves.
            </p>
            <p>
              So we flipped the order: scan first, find the blocker, then build the plan around
              it. That&rsquo;s the whole product.
            </p>
          </div>
          <DivergeViz />
          <div className="dt-founder__author">
            <div className="dt-founder__avatar">P</div>
            <div>
              <p className="dt-founder__name">Pierre</p>
              <p className="dt-founder__title">Founder, Protocol Abs</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const OLD_WAY = [
  "$600+/month for a personal trainer",
  "The same ab routine everyone gets",
  "Body fat guessed in the mirror",
  "Months of effort aimed at the wrong thing",
];

const NEW_WAY = [
  "From $8.99/week, cancel anytime",
  "Scored zone by zone from two photos",
  "Estimated body-fat range + your #1 blocker",
  "A plan that re-orders itself after every re-scan",
];

function AOldNew() {
  return (
    <section className="mo-section mo-section--surface">
      <div className="mo-container">
        <div className="mo-section-head--center">
          <p className="mo-section-eyebrow mo-section-eyebrow--center">Old way → new way</p>
          <h2 className="mo-section-title" style={{ marginTop: 12 }}>
            A trainer&rsquo;s eye, <em>at 3% of the price.</em>
          </h2>
        </div>
        <CompareBars metrics={[{ label: "Cost per month", oldVal: "$600+", newVal: "~$39", newPct: 6.5 }]} />
        <div className="dt-oldnew-grid">
          <div className="dt-oldnew-card dt-oldnew-card--old">
            <div className="dt-oldnew-card__tag">The old way</div>
            <h3 className="dt-oldnew-card__name">Hire a trainer, hope for the best</h3>
            <ul>
              {OLD_WAY.map((item) => (
                <li key={item}>
                  <span className="dt-oldnew-card__mark" aria-hidden="true">✕</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="dt-oldnew-card dt-oldnew-card--new">
            <div className="dt-oldnew-card__tag">The new way</div>
            <h3 className="dt-oldnew-card__name">Protocol Abs</h3>
            <ul>
              {NEW_WAY.map((item) => (
                <li key={item}>
                  <span className="dt-oldnew-card__mark dt-oldnew-card__mark--check"><CheckIcon size={12} /></span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function ATestimonials() {
  return (
    <section className="mo-section">
      <div className="mo-container">
        <div className="mo-section-head--center">
          <div className="mo-section-eyebrow mo-section-eyebrow--center">What members say</div>
          <h2 className="mo-section-title" style={{ marginTop: 16 }}><em>Abs that finally showed up.</em></h2>
        </div>
        <div className="mo-testimonials-grid">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="mo-testi">
              <div className="mo-testi__stars">
                <StarIcon /><StarIcon /><StarIcon /><StarIcon /><StarIcon />
              </div>
              <p className="mo-testi__quote">&ldquo;{t.quote}&rdquo;</p>
              <TestiChip label={t.chip.label} from={t.chip.from} to={t.chip.to} />
              <div className="mo-testi__person">
                <div className="mo-testi__avatar"><img src={`/abs/testi/${t.name.split(",")[0].toLowerCase()}.jpg`} alt="" /></div>
                <div>
                  <div className="mo-testi__name">{t.name}</div>
                  <div className="mo-testi__meta">Member · {t.meta}</div>
                  <div className="dt-verified"><CheckIcon size={11} /> Verified purchase</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function APricing() {
  const { plan, setPlan } = useContext(PlanContext);
  return (
    <section id="mo-pricing" className="mo-section mo-section--ink">
      <div className="mo-container">
        <div className="mo-section-head--center">
          <h2 className="mo-section-title" style={{ marginTop: 16, color: "#fff" }}>
            Scan, plan, re-scans. <em style={{ color: "rgba(255,255,255,0.5)" }}>Pick your plan.</em>
          </h2>
        </div>
        <div className="mo-pricing-card">
          <div className="ab-plan-picker" role="radiogroup" aria-label="Choose a plan">
            {PLANS.map((p) => {
              const active = p.key === plan;
              return (
                <button
                  key={p.key}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  className={`ab-plan-opt ${active ? "ab-plan-opt--active" : ""}`}
                  onClick={() => setPlan(p.key)}
                >
                  {p.badge && <span className="ab-plan-opt__badge">{p.badge}</span>}
                  <span className="ab-plan-opt__radio" aria-hidden="true" />
                  <span className="ab-plan-opt__label">{p.label}</span>
                  <span className="ab-plan-opt__price">
                    {p.priceLabel}<span className="ab-plan-opt__per">{p.perLabel}</span>
                  </span>
                  <span className="ab-plan-opt__sub">{p.subLabel ?? "billed " + p.interval + "ly"}</span>
                </button>
              );
            })}
          </div>
          <ul className="mo-pricing-card__list">
            {PRICING_BULLETS.map((b) => (
              <li key={b}>
                <span className="mo-pricing-card__check"><CheckIcon size={12} /></span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <CheckoutButton label={CTA_LABEL_PRICED} className="mo-pricing-card__cta" location="pricing" />
          <div className="mo-pricing-card__guarantee">Cancel anytime</div>
        </div>
      </div>
    </section>
  );
}

function AFaq() {
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

function AFooter() {
  return (
    <footer className="mo-footer">
      <div className="mo-container">
        <div className="mo-footer__top">
          <div>
            <div className="mo-footer__brand">Protocol <em>Abs</em></div>
          </div>
          <div>
            <div className="mo-footer__col-head">Product</div>
            <a className="mo-footer__link" href="#ab-method">How it works</a>
            <a className="mo-footer__link" href="#mo-pricing">Pricing</a>
          </div>
          <div>
            <div className="mo-footer__col-head">Legal</div>
            <a className="mo-footer__link" href="/terms-of-service">Terms</a>
            <a className="mo-footer__link" href="/privacy-policy">Privacy</a>
            <a className="mo-footer__link" href="/refund-policy">Refund Policy</a>
          </div>
        </div>
        <div className="mo-footer__bottom">
          <span>© {new Date().getFullYear()} Protocol Abs</span>
          <span>hello@protocol-club.com</span>
        </div>
        <p className="mo-footer__disclaimer">
          * Not medical advice. Body-fat figures are visual estimates, not clinical measurements.
          Results vary with adherence.
        </p>
      </div>
    </footer>
  );
}

function ASticky({ visible }: { visible: boolean }) {
  const { plan } = useContext(PlanContext);
  const active = PLANS.find((p) => p.key === plan) ?? PLANS[0];
  return (
    <div className={`mo-sticky ${visible ? "mo-sticky--visible" : ""}`}>
      <div className="mo-sticky__mobile">
        <div className="mo-sticky__text">Scan + plan, {active.priceLabel}{active.perLabel}</div>
        <CheckoutButton label={CTA_LABEL_PRICED} className="mo-sticky__btn" location="sticky-mobile" withArrow={false} />
      </div>
      <div className="mo-sticky__desktop dt-sticky-desktop">
        <div className="mo-sticky__desktop-text">
          <strong>Protocol Abs</strong>
          <span>{active.priceLabel}{active.perLabel} · cancel anytime</span>
        </div>
        <CheckoutButton label={CTA_LABEL_PRICED} className="mo-sticky__desktop-btn" location="sticky-desktop" withArrow={false} />
      </div>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function AbsOfferPage() {
  const [stickyVisible, setStickyVisible] = useState(false);
  const [plan, setPlan] = useState<string>(DEFAULT_PLAN_KEY);

  useEffect(() => {
    trackGa4Event("view_offer", { funnel: "abs", page_path: "/abs" });
    trackEvent("view_offer", { funnel: "abs", page_path: "/abs" });

    persistUtmParams(getUtmParams());

    const onScroll = () => setStickyVisible(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <PlanContext.Provider value={{ plan, setPlan }}>
      <div className="mo-page va-abs">
        <UrgencyBar />
        <ANav />
        <AHero />
        <AResearch />
        <ASteps />
        <AReport />
        <AScanToPlan />
        <ALikeYou />
        <AFounderStory />
        <AOldNew />
        <ATestimonials />
        <APricing />
        <AFaq />
        <AFooter />
        <ASticky visible={stickyVisible} />
      </div>
    </PlanContext.Provider>
  );
}
