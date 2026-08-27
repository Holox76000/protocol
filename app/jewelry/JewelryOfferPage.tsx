"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { trackGa4Event } from "../../lib/ga4Event";
import { trackEvent } from "../../lib/analytics";
import { getUtmParams, persistUtmParams, getPersistedUtmParams } from "../../lib/utm";
import { EXPERIMENTS } from "../../lib/experiments";
import { PlaceholderRibbon } from "../../components/ImagePlaceholder";
import "../f1/f1.css";
import "../f1/offer/f1-offer.css";
import "../dating/dating.css";
import "./jewelry.css";

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

const PLANS = EXPERIMENTS.jewelry.plans;
const DEFAULT_PLAN_KEY = EXPERIMENTS.jewelry.defaultPlanKey;

// The selected plan is shared across every CTA on the page (nav, hero, sticky,
// pricing selector) so any button checks out the tier the visitor picked.
const PlanContext = createContext<{
  plan: string;
  setPlan: (key: string) => void;
}>({ plan: DEFAULT_PLAN_KEY, setPlan: () => {} });

/* ─── Checkout ──────────────────────────────────────────────────────────── */

async function startCheckout(location: string, label: string, plan: string): Promise<boolean> {
  trackGa4Event("jewelry_offer_cta_clicked", {
    funnel: "jewelry",
    cta_location: location,
    cta_label: label,
    plan,
  });
  trackEvent("offer_cta_clicked", { funnel: "jewelry", cta_location: location, plan });

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
        funnel: "jewelry",
        landing_page: "/jewelry",
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

const CTA_LABEL = "Identify my jewelry";

const WHY_CARDS = [
  {
    title: "An appraisal costs more than the piece",
    desc: "A formal appraisal runs $50–$150 and takes a week. For a ring you might sell for $200, that math never works.",
  },
  {
    title: "The jeweler's offer isn't neutral",
    desc: "Walk in to sell and the counter offer favors the counter. Know your range before you hear theirs.",
  },
  {
    title: "Scan apps just name a stone",
    desc: "The cheap scanner apps guess a gemstone and stop. No metal, no era, no hallmark, no value you can use.",
  },
];

const STEPS = [
  {
    num: "01",
    time: "2 MIN",
    title: "Photograph your piece",
    desc: "Lay it on a plain surface in good light. One clear shot, plus a close-up of any stamp inside the band or on the clasp.",
  },
  {
    num: "02",
    time: "AI SCAN",
    title: "We read the metal, stones, and marks",
    desc: "GemCheck identifies the materials, dates the style, decodes the hallmarks, and checks it against recent sales.",
  },
  {
    num: "03",
    time: "24 H",
    title: "Your appraisal, by email",
    desc: "Materials, gemstones, era, hallmarks, a fair-market value range, and a verdict on whether it's worth a professional appraisal.",
  },
];

const REPORT_ITEMS = [
  {
    title: "Materials",
    desc: "Gold, silver, or platinum — with the karat or purity, read from the piece and its marks.",
  },
  {
    title: "Gemstones",
    desc: "What the stones are, rough carat weight, and whether they read as natural, treated, or synthetic.",
  },
  {
    title: "Style and era",
    desc: "Victorian, Art Deco, Mid-Century, or contemporary — dated from the setting and the design.",
  },
  {
    title: "Hallmarks decoded",
    desc: "Maker's marks, purity stamps, and country of origin, translated into plain English.",
  },
  {
    title: "Fair-market value range",
    desc: "What comparable pieces actually sell for — not a retail sticker, not a pawn-counter lowball.",
  },
  {
    title: "Worth a real appraisal?",
    desc: "A straight yes or no on whether the piece is valuable enough to pay for a certified, in-person appraisal.",
  },
];

const GREAT_FOR_CARDS = [
  {
    title: "You inherited a jewelry box",
    desc: "Cleared out a mother's or grandmother's collection and can't tell real from costume. Sort the keepers in an afternoon.",
  },
  {
    title: "Estate sales and thrift finds",
    desc: "You spotted a ring at an estate sale. Check it before you buy — or before you pass on something worth real money.",
  },
  {
    title: "Selling on eBay",
    desc: "Price it right before you list. Buyers lowball vague listings; hallmarks and a value range make yours credible.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "My mother left three boxes of jewelry. GemCheck sorted the real gold from the costume in a weekend — one brooch came back at $900.",
    name: "Diane, 58",
    meta: "July 2026",
  },
  {
    quote:
      "I check every ring before I list it on eBay now. Buyers stopped lowballing once I added the hallmarks and a value range.",
    name: "Karen, 49",
    meta: "June 2026",
  },
  {
    quote:
      "Found a signed Art Deco piece at an estate sale for $40. The report put it at $600–$800. I'd have walked right past it.",
    name: "Ruth, 63",
    meta: "May 2026",
  },
];

const PRICING_BULLETS = [
  "Full ID: metal, gemstones, era, hallmarks",
  "Fair-market value range on every piece",
  "A \"worth a professional appraisal?\" verdict",
  "Unlimited identifications while subscribed",
  "A saved catalog of your whole collection",
  "First report by email within 24 hours",
  "Cancel anytime — reply \"cancel\" to any email",
];

const FAQS = [
  {
    q: "What photos do I need?",
    a: "One clear photo on a plain background in good light, plus a close-up of any stamp inside a ring band or on a clasp. More angles mean a tighter estimate.",
  },
  {
    q: "How accurate is the value?",
    a: "It's a fair-market range from comparable sales, meant to guide you — not a certified appraisal and not valid for insurance. For a piece worth real money, we'll tell you to get one.",
  },
  {
    q: "Can you tell real gold from plated?",
    a: "Usually, from the hallmarks and the wear. When a photo can't settle it, the report says so and gives you the one at-home test to run.",
  },
  {
    q: "Is this an insurance appraisal?",
    a: "No. Insurers require a certified, in-person appraisal. GemCheck tells you whether your piece is worth paying for one.",
  },
  {
    q: "How do I cancel?",
    a: "Reply \"cancel\" to any email from us — handled the same day. No calls, no forms, no retention flow.",
  },
  {
    q: "What happens to my photos?",
    a: "They're used for your appraisal and to build your collection catalog. Never shared, never sold.",
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

/* ─── Sample appraisal report (hero visual) ─────────────────────────────── */

const REPORT_DETAILS = [
  { label: "Metal", value: "14k gold" },
  { label: "Stone", value: "Diamond ~0.5 ct" },
  { label: "Era", value: "Art Deco · 1920s" },
  { label: "Hallmark", value: "585" },
];

function RingMark() {
  return (
    <svg className="j-report__ring" viewBox="0 0 48 48" role="img" aria-label="Stylized ring">
      {/* Band */}
      <ellipse cx="24" cy="31" rx="11" ry="12" fill="none" stroke="#c9a961" strokeWidth="3" />
      {/* Setting shoulders */}
      <path d="M18 21 L24 15 L30 21" fill="none" stroke="#c9a961" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Gem */}
      <path d="M24 6 L30 13 L24 21 L18 13 Z" fill="#e7d9a8" stroke="#c9a961" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M18 13 H30 M24 6 V21" stroke="#c9a961" strokeWidth="0.8" />
    </svg>
  );
}

function JewelryReportCard() {
  return (
    <div className="j-report img-ph-slot">
      <PlaceholderRibbon note="real jewelry photo + appraisal result" />
      <div className="j-report__head">
        <span className="j-report__title">Appraisal Report</span>
        <span className="j-report__tag">Sample</span>
      </div>
      <div className="j-report__piece">
        <RingMark />
        <div>
          <div className="j-report__from">From your photo</div>
          <div className="j-report__piece-name">14k Gold Ring</div>
          <div className="j-report__piece-sub">Art Deco · diamond solitaire</div>
        </div>
      </div>
      <div className="j-report__value">
        <span className="j-report__value-label">Fair-market value</span>
        <strong className="j-report__value-num">$1,800 – $2,400</strong>
        <span className="j-report__value-note">Matched to 40+ recent comparable sales</span>
      </div>
      <div className="j-report__rows">
        {REPORT_DETAILS.map((d) => (
          <div key={d.label} className="j-report__row">
            <span className="j-report__row-label">{d.label}</span>
            <span className="j-report__row-val">{d.value}</span>
          </div>
        ))}
      </div>
      <div className="j-report__verdict">
        <span className="j-report__verdict-check"><CheckIcon size={12} /></span>
        Worth a professional appraisal
      </div>
    </div>
  );
}

/* ─── Sections ──────────────────────────────────────────────────────────── */

function JNav() {
  return (
    <nav className="mo-nav">
      <div className="mo-nav__brand">Gem<em>Check</em></div>
      <div className="mo-nav__links">
        <a href="#j-method">How it works</a>
        <a href="#mo-pricing">Pricing</a>
      </div>
      <CheckoutButton label={CTA_LABEL} className="mo-nav__cta" location="nav" withArrow={false} />
    </nav>
  );
}

function JHero() {
  return (
    <section className="mo-hero mo-hero-v1">
      <div className="mo-hero-v1__left">
        <div className="mo-hero-v1__copy">
          <h1 className="mo-hero__title">Snap a photo. <em>Know what it&rsquo;s worth.</em></h1>
          <p className="mo-hero__desc">
            Send one photo of any piece. GemCheck identifies the metal, gemstones,
            era, and hallmarks — then gives you a fair-market value range. First
            report in 24 hours.
          </p>
          <div className="mo-hero__ctas">
            <CheckoutButton label={CTA_LABEL} className="mo-cta mo-cta--hero" location="hero" />
            <a href="#j-method" className="mo-hero__cta-ghost">See how it works</a>
          </div>
          <TrustpilotBadge />
          <div className="mo-hero__meta">
            <span>from $4.99/week</span>
            <span className="mo-hero__meta-dot">·</span>
            <span>unlimited IDs</span>
            <span className="mo-hero__meta-dot">·</span>
            <span>cancel anytime</span>
          </div>
        </div>
      </div>

      {/* Mobile: copy above the visual */}
      <div className="mo-hero-v1__mobile-ctas mo-hero-pad">
        <h1 className="mo-hero__title">Snap a photo. <em>Know what it&rsquo;s worth.</em></h1>
        <p className="mo-hero__desc">
          Send one photo of any piece. GemCheck identifies the metal, gemstones,
          era, and hallmarks — then gives you a fair-market value range. First
          report in 24 hours.
        </p>
      </div>

      {/* Right column: sample appraisal report */}
      <div className="mo-hero-v1__right j-hero-right">
        <div className="mo-hero-v1__product-stack">
          <div className="j-report-wrap">
            <JewelryReportCard />
            <div className="mo-hero-v1__fc mo-hero-v1__fc--ratio">
              <div className="mo-fc-label">Fair-market</div>
              <div className="mo-fc-val">$1.8k <em>–</em> $2.4k</div>
              <div className="mo-fc-delta">24h</div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: CTA strip below the visual */}
      <div className="mo-hero-v1__mobile-cta-strip mo-hero-pad">
        <CheckoutButton label={CTA_LABEL} className="mo-cta mo-cta--hero" location="hero-mobile" />
        <a href="#j-method" className="mo-hero__cta-ghost">See how it works</a>
        <TrustpilotBadge />
      </div>
    </section>
  );
}

function JWhy() {
  return (
    <section className="mo-section mo-section--surface">
      <div className="mo-container">
        <div className="mo-section-head--center">
          <p className="mo-section-eyebrow mo-section-eyebrow--center">Why GemCheck</p>
          <h2 className="mo-section-title" style={{ marginTop: 12 }}>
            You own it. <em>You just don&rsquo;t know what it is.</em>
          </h2>
          <p className="dt-research-sub">
            A piece sits in a drawer for years and nobody can say if it&rsquo;s gold or gold-tone.
            Finding out shouldn&rsquo;t cost $100 or an appointment.
          </p>
        </div>
        <div className="dt-research-grid">
          {WHY_CARDS.map((c) => (
            <div key={c.title} className="dt-research-card">
              <h3>{c.title}</h3>
              <p>{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function JSteps() {
  return (
    <section id="j-method" className="mo-section">
      <div className="mo-container">
        <div className="mo-section-head">
          <div>
            <div className="mo-section-eyebrow">How it works</div>
            <h2 className="mo-section-title">One photo. <em>A real appraisal.</em></h2>
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
          <CheckoutButton label={CTA_LABEL} className="mo-cta" location="steps" />
        </div>
      </div>
    </section>
  );
}

function JReport() {
  return (
    <section className="mo-section mo-section--surface">
      <div className="mo-container">
        <div className="mo-section-head--center">
          <p className="mo-section-eyebrow mo-section-eyebrow--center">Inside your report</p>
          <h2 className="mo-section-title" style={{ marginTop: 12 }}>
            Everything a jeweler checks. <em>On paper.</em>
          </h2>
        </div>
        <div className="dt-research-grid">
          {REPORT_ITEMS.map((c) => (
            <div key={c.title} className="dt-research-card">
              <h3>{c.title}</h3>
              <p>{c.desc}</p>
            </div>
          ))}
        </div>
        <div className="mo-section-cta">
          <CheckoutButton label={CTA_LABEL} className="mo-cta" location="report" />
        </div>
      </div>
    </section>
  );
}

function JGreatFor() {
  return (
    <section className="mo-section">
      <div className="mo-container">
        <div className="mo-section-head--center">
          <p className="mo-section-eyebrow mo-section-eyebrow--center">Who it&rsquo;s for</p>
          <h2 className="mo-section-title" style={{ marginTop: 12 }}>
            Built for the box <em>nobody could read.</em>
          </h2>
          <p className="dt-research-sub">
            Most pieces never get checked because checking them was slow and expensive.
            Here&rsquo;s where GemCheck earns its keep.
          </p>
        </div>
        <div className="dt-research-grid">
          {GREAT_FOR_CARDS.map((c) => (
            <div key={c.title} className="dt-research-card">
              <h3>{c.title}</h3>
              <p>{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const OLD_WAY = [
  "$50–$150 per piece for a formal appraisal",
  "A week's wait and an appointment to book",
  "Mearto's experts: $15–$45 a piece, 48-hour turnaround",
  "Or a scan app that names a stone and stops",
];

const NEW_WAY = [
  "From $4.99/week, unlimited pieces",
  "Photo in, full report back within 24 hours",
  "Metal, stones, era, hallmarks, and a value range",
  "A clear verdict on whether it's worth a formal appraisal",
];

function JOldNew() {
  return (
    <section className="mo-section mo-section--surface">
      <div className="mo-container">
        <div className="mo-section-head--center">
          <p className="mo-section-eyebrow mo-section-eyebrow--center">Old way → new way</p>
          <h2 className="mo-section-title" style={{ marginTop: 12 }}>
            A second opinion, <em>without the appointment.</em>
          </h2>
        </div>
        <div className="dt-oldnew-grid">
          <div className="dt-oldnew-card dt-oldnew-card--old">
            <div className="dt-oldnew-card__tag">The old way</div>
            <h3 className="dt-oldnew-card__name">Drive it to an appraiser</h3>
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
            <h3 className="dt-oldnew-card__name">GemCheck</h3>
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

function JTestimonials() {
  return (
    <section className="mo-section">
      <div className="mo-container">
        <div className="mo-section-head--center">
          <div className="mo-section-eyebrow mo-section-eyebrow--center">What members say</div>
          <h2 className="mo-section-title" style={{ marginTop: 16 }}><em>Real pieces, real numbers.</em></h2>
        </div>
        <div className="mo-testimonials-grid">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="mo-testi">
              <div className="mo-testi__stars">
                <StarIcon /><StarIcon /><StarIcon /><StarIcon /><StarIcon />
              </div>
              <p className="mo-testi__quote">&ldquo;{t.quote}&rdquo;</p>
              <div className="mo-testi__person">
                <div className="mo-testi__avatar img-ph-avatar">{t.name[0]}</div>
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

function JPricing() {
  const { plan, setPlan } = useContext(PlanContext);
  return (
    <section id="mo-pricing" className="mo-section mo-section--ink">
      <div className="mo-container">
        <div className="mo-section-head--center">
          <h2 className="mo-section-title" style={{ marginTop: 16, color: "#fff" }}>
            Unlimited IDs and a saved catalog. <em style={{ color: "rgba(255,255,255,0.5)" }}>Pick your plan.</em>
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
          <CheckoutButton label={CTA_LABEL} className="mo-pricing-card__cta" location="pricing" />
          <div className="mo-pricing-card__guarantee">Cancel anytime — first payment refunded if it doesn&rsquo;t help</div>
        </div>
      </div>
    </section>
  );
}

function JGuarantee() {
  return (
    <section className="mo-guarantee">
      <div className="mo-container">
        <div className="mo-guarantee__inner">
          <div className="mo-guarantee__seal">
            <div className="mo-guarantee__seal-num">100%</div>
            <div className="mo-guarantee__seal-label">Refund</div>
          </div>
          <div>
            <h2 className="mo-guarantee__title">
              Read your full report.{" "}
              <em>If it doesn&rsquo;t help, your first payment is refunded.</em>
            </h2>
          </div>
        </div>
      </div>
    </section>
  );
}

function JFaq() {
  const [open, setOpen] = useState<number>(0);
  return (
    <section className="mo-section">
      <div className="mo-container">
        <div className="mo-faq__inner">
          <div>
            <div className="mo-section-eyebrow">FAQ</div>
            <h2 className="mo-faq__title">Short answers <em>to common questions.</em></h2>
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

function JFooter() {
  return (
    <footer className="mo-footer">
      <div className="mo-container">
        <div className="mo-footer__top">
          <div>
            <div className="mo-footer__brand">Gem<em>Check</em></div>
          </div>
          <div>
            <div className="mo-footer__col-head">Product</div>
            <a className="mo-footer__link" href="#j-method">How it works</a>
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
          <span>© {new Date().getFullYear()} GemCheck</span>
          <span>hello@protocol-club.com</span>
        </div>
        <p className="mo-footer__disclaimer">
          Estimates are for guidance only, not a certified appraisal and not valid for insurance.
        </p>
      </div>
    </footer>
  );
}

function JSticky({ visible }: { visible: boolean }) {
  const { plan } = useContext(PlanContext);
  const active = PLANS.find((p) => p.key === plan) ?? PLANS[0];
  return (
    <div className={`mo-sticky ${visible ? "mo-sticky--visible" : ""}`}>
      <div className="mo-sticky__mobile">
        <div className="mo-sticky__text">Full appraisal, {active.priceLabel}{active.perLabel}</div>
        <CheckoutButton label={CTA_LABEL} className="mo-sticky__btn" location="sticky-mobile" withArrow={false} />
      </div>
      <div className="mo-sticky__desktop dt-sticky-desktop">
        <div className="mo-sticky__desktop-text">
          <strong>GemCheck</strong>
          <span>{active.priceLabel}{active.perLabel} · cancel anytime</span>
        </div>
        <CheckoutButton label={CTA_LABEL} className="mo-sticky__desktop-btn" location="sticky-desktop" withArrow={false} />
      </div>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function JewelryOfferPage() {
  const [stickyVisible, setStickyVisible] = useState(false);
  const [plan, setPlan] = useState<string>(DEFAULT_PLAN_KEY);

  useEffect(() => {
    trackGa4Event("view_offer", { funnel: "jewelry", page_path: "/jewelry" });
    trackEvent("view_offer", { funnel: "jewelry", page_path: "/jewelry" });

    persistUtmParams(getUtmParams());

    const onScroll = () => setStickyVisible(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <PlanContext.Provider value={{ plan, setPlan }}>
      <div className="mo-page">
        <UrgencyBar />
        <JNav />
        <JHero />
        <JWhy />
        <JSteps />
        <JReport />
        <JGreatFor />
        <JOldNew />
        <JTestimonials />
        <JPricing />
        <JGuarantee />
        <JFaq />
        <JFooter />
        <JSticky visible={stickyVisible} />
      </div>
    </PlanContext.Provider>
  );
}
