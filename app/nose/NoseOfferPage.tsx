"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { trackGa4Event } from "../../lib/ga4Event";
import { trackEvent } from "../../lib/analytics";
import { getUtmParams, persistUtmParams, getPersistedUtmParams } from "../../lib/utm";
import { EXPERIMENTS } from "../../lib/experiments";
import "../f1/f1.css";
import "../f1/offer/f1-offer.css";
import "../dating/dating.css";
import "./nose.css";

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

const PLANS = EXPERIMENTS.nose.plans;
const DEFAULT_PLAN_KEY = EXPERIMENTS.nose.defaultPlanKey;

// The selected plan is shared across every CTA on the page (nav, hero, sticky,
// pricing selector) so any button checks out the tier the visitor picked.
const PlanContext = createContext<{
  plan: string;
  setPlan: (key: string) => void;
}>({ plan: DEFAULT_PLAN_KEY, setPlan: () => {} });

/* ─── Checkout ──────────────────────────────────────────────────────────── */

async function startCheckout(location: string, label: string, plan: string): Promise<boolean> {
  trackGa4Event("nose_offer_cta_clicked", {
    funnel: "nose",
    cta_location: location,
    cta_label: label,
    plan,
  });
  trackEvent("offer_cta_clicked", { funnel: "nose", cta_location: location, plan });

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
        funnel: "nose",
        landing_page: "/nose",
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

const CTA_LABEL = "See my nose preview";

const STEPS = [
  {
    num: "01",
    time: "2 MIN",
    title: "One profile photo",
    desc: "Side profile, phone camera, plain light, hair off your face. That's the only angle a nose read needs.",
  },
  {
    num: "02",
    time: "AI EDIT",
    title: "We reshape only the nose",
    desc: "Hump, bridge, and tip adjusted in proportion to your face. Eyes, lips, skin, and jaw stay exactly as they are.",
  },
  {
    num: "03",
    time: "24 H",
    title: "Your preview by email",
    desc: "A photoreal before/after plus variants. Download the surgeon-ready PDF and bring it to your consult.",
  },
];

const WHY_CARDS = [
  {
    title: "The mirror lies",
    desc: "You've studied your profile for years and still can't tell what a smaller bridge would do. Guessing isn't a plan.",
  },
  {
    title: "$15,000, no preview",
    desc: "Rhinoplasty runs $9K to $20K and it's permanent. Most people commit having never seen their own after photo.",
  },
  {
    title: "Filters wreck the face",
    desc: "Beauty apps warp your whole face to fake a nose. The result looks nothing like you — useless for a real decision.",
  },
];

const VARIANT_ITEMS = [
  {
    title: "Hump removed",
    desc: "The dorsal bump smoothed to a straight bridge, kept in scale with the rest of your face.",
  },
  {
    title: "Tip refined",
    desc: "A rounded or drooping tip lifted and narrowed. Subtle — not sculpted off.",
  },
  {
    title: "Bridge smoothed",
    desc: "Height and width brought into balance with your brow and lips.",
  },
  {
    title: "Ethnic-preserving",
    desc: "Refines the nose while keeping the features that read as you — never a whole new face.",
  },
  {
    title: "Only the nose moves",
    desc: "Every preview leaves your eyes, skin, and jawline untouched. That's the whole point.",
  },
  {
    title: "Surgeon-ready export",
    desc: "A clean PDF of your before/after and variants, built to hand a surgeon at your consult.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "I'd wanted this for ten years and never booked. Seeing the after is what finally got me to schedule the consult.",
    name: "Sofia, 24",
    meta: "July 2026",
  },
  {
    quote:
      "Brought the PDF to my surgeon and we went straight to what I actually wanted. Saved a whole appointment.",
    name: "Priya, 29",
    meta: "June 2026",
  },
  {
    quote:
      "It only touched my nose. Every other app turned me into someone else — this one still looked like me.",
    name: "Daniel, 33",
    meta: "May 2026",
  },
];

const PRICING_BULLETS = [
  "Photoreal before/after from one photo",
  "Only the nose changes — the rest of your face stays intact",
  "Multiple variants: hump, tip, bridge",
  "Ethnic-preserving option",
  "Surgeon-ready PDF export",
  "Unlimited previews while subscribed",
  "First preview by email within 24 hours",
];

const FAQS = [
  {
    q: "Is this a prediction of my surgery result?",
    a: "No. It's a visualization to explore options and prep your consult — not a medical forecast. Your surgeon decides what's actually possible for your anatomy.",
  },
  {
    q: "What photo do I need?",
    a: "One side-profile photo — phone camera, plain background, hair off your face. That's the angle a nose read needs.",
  },
  {
    q: "Will it change the rest of my face?",
    a: "No — we edit the nose only. Eyes, lips, skin, and jawline stay exactly as shot; that's the whole point of the tool.",
  },
  {
    q: "Can it do ethnic rhinoplasty?",
    a: "Yes. The ethnic-preserving option refines the nose while keeping the features that read as you, instead of defaulting to one generic shape.",
  },
  {
    q: "How do I cancel?",
    a: "Reply \"cancel\" to any email from us — done the same day. No calls, no forms, no retention flow.",
  },
  {
    q: "What happens to my photo?",
    a: "It's used once to render your preview, then deleted. Never shared, never used for anything else.",
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

/* ─── Face profile mockup (recreated in our design language — stylized
       schematic, not a photo) ─────────────────────────────────────────────── */

// Head silhouette facing right. Only the nose segment differs between the two
// variants: `before` carries a convex dorsal hump, `after` a straight bridge
// and a lifted, refined tip. Everything else is identical, on purpose.
function FacePanel({ variant, tag }: { variant: "before" | "after"; tag?: string }) {
  const isAfter = variant === "after";
  return (
    <div className={`no-face-panel ${isAfter ? "no-face-panel--after" : ""}`}>
      <div className="no-face-panel__head">
        <span className="no-face-panel__label">{isAfter ? "After" : "Before"}</span>
        {tag && <span className="no-face-panel__tag">{tag}</span>}
      </div>
      <div className="no-face-panel__photo">
        <img src={isAfter ? "/nose/after.jpg" : "/nose/before.jpg"} alt="" />
      </div>
    </div>
  );
}

/* ─── Sections ──────────────────────────────────────────────────────────── */

function NNav() {
  return (
    <nav className="mo-nav">
      <div className="mo-nav__brand">Nose<em>Lab</em></div>
      <div className="mo-nav__links">
        <a href="#no-method">How it works</a>
        <a href="#mo-pricing">Pricing</a>
      </div>
      <CheckoutButton label={CTA_LABEL} className="mo-nav__cta" location="nav" withArrow={false} />
    </nav>
  );
}

function NHero() {
  return (
    <section className="mo-hero mo-hero-v1">
      <div className="mo-hero-v1__left">
        <div className="mo-hero-v1__copy">
          <h1 className="mo-hero__title">See your nose reshaped. <em>Before you book surgery.</em></h1>
          <p className="mo-hero__desc">
            Upload one photo. We reshape only your nose — hump, bridge, tip — and
            leave the rest of your face untouched. Your preview lands in 24 hours.
          </p>
          <div className="mo-hero__ctas">
            <CheckoutButton label={CTA_LABEL} className="mo-cta mo-cta--hero" location="hero" />
            <a href="#no-method" className="mo-hero__cta-ghost">See how it works</a>
          </div>
          <TrustpilotBadge />
          <div className="mo-hero__meta">
            <span>from $2.99/week</span>
            <span className="mo-hero__meta-dot">·</span>
            <span>surgeon-ready export</span>
            <span className="mo-hero__meta-dot">·</span>
            <span>cancel anytime</span>
          </div>
        </div>
      </div>

      {/* Mobile: copy above the visual */}
      <div className="mo-hero-v1__mobile-ctas mo-hero-pad">
        <h1 className="mo-hero__title">See your nose reshaped. <em>Before you book surgery.</em></h1>
        <p className="mo-hero__desc">
          Upload one photo. We reshape only your nose — hump, bridge, tip — and
          leave the rest of your face untouched. Your preview lands in 24 hours.
        </p>
      </div>

      {/* Right column: before/after preview */}
      <div className="mo-hero-v1__right no-hero-right">
        <div className="mo-hero-v1__product-stack">
          <div className="no-hero-wrap">
            <div className="no-ba">
              <FacePanel variant="before" tag="Your photo" />
              <FacePanel variant="after" tag="Preview" />
            </div>
            <div className="mo-hero-v1__fc mo-hero-v1__fc--ratio">
              <div className="mo-fc-label">Export</div>
              <div className="mo-fc-val">Surgeon-ready</div>
              <div className="mo-fc-delta">PDF</div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: CTA strip below the visual */}
      <div className="mo-hero-v1__mobile-cta-strip mo-hero-pad">
        <CheckoutButton label={CTA_LABEL} className="mo-cta mo-cta--hero" location="hero-mobile" />
        <a href="#no-method" className="mo-hero__cta-ghost">See how it works</a>
        <TrustpilotBadge />
      </div>
    </section>
  );
}

function NWhy() {
  return (
    <section className="mo-section mo-section--surface">
      <div className="mo-container">
        <div className="mo-section-head--center">
          <p className="mo-section-eyebrow mo-section-eyebrow--center">Why it never happens</p>
          <h2 className="mo-section-title" style={{ marginTop: 12 }}>
            You&rsquo;ve thought about it for years. <em>You just can&rsquo;t picture the after.</em>
          </h2>
          <p className="dt-research-sub">
            A surgeon quotes $9,000 to $20,000 and a result you can&rsquo;t see first. So you sit
            with the mirror and guess.
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

function NSteps() {
  return (
    <section id="no-method" className="mo-section">
      <div className="mo-container">
        <div className="mo-section-head">
          <div>
            <div className="mo-section-eyebrow">How it works</div>
            <h2 className="mo-section-title">One photo. <em>One nose changed.</em></h2>
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

function NBeforeAfter() {
  return (
    <section className="mo-section mo-section--surface">
      <div className="mo-container">
        <div className="mo-section-head--center">
          <p className="mo-section-eyebrow mo-section-eyebrow--center">Before → after</p>
          <h2 className="mo-section-title" style={{ marginTop: 12 }}>
            Same face. <em>Different nose.</em>
          </h2>
        </div>
        <div className="no-s2p">
          <div className="no-s2p__col">
            <FacePanel variant="before" tag="Your photo" />
            <p className="no-s2p__note">Dorsal hump, heavier tip — the profile you know.</p>
          </div>
          <div className="dt-ba-arrow no-s2p__arrow" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="no-s2p__col">
            <FacePanel variant="after" tag="Preview" />
            <p className="no-s2p__note">Straight bridge, lifted tip. Everything else untouched.</p>
          </div>
        </div>
        <div className="mo-section-cta">
          <CheckoutButton label={CTA_LABEL} className="mo-cta" location="before-after" />
        </div>
      </div>
    </section>
  );
}

function NVariants() {
  return (
    <section className="mo-section">
      <div className="mo-container">
        <div className="mo-section-head--center">
          <p className="mo-section-eyebrow mo-section-eyebrow--center">What you get</p>
          <h2 className="mo-section-title" style={{ marginTop: 12 }}>
            One nose, <em>several honest options.</em>
          </h2>
          <p className="dt-research-sub">
            Not one forced result. A few real directions you can compare — then take the
            best one to a surgeon.
          </p>
        </div>
        <div className="dt-research-grid">
          {VARIANT_ITEMS.map((c) => (
            <div key={c.title} className="dt-research-card">
              <h3>{c.title}</h3>
              <p>{c.desc}</p>
            </div>
          ))}
        </div>
        <div className="mo-section-cta">
          <CheckoutButton label={CTA_LABEL} className="mo-cta" location="variants" />
        </div>
      </div>
    </section>
  );
}

const OLD_WAY = [
  "$150–$500 for each surgeon consult",
  "Morph software you don't see until you're in the chair",
  "A $15,000 decision made on a hunch",
  "Beauty filters that warp your whole face",
];

const NEW_WAY = [
  "From $2.99/week, cancel anytime",
  "Your own photo, only the nose changed",
  "Several variants to compare side by side",
  "A surgeon-ready PDF for your consult",
];

function NOldNew() {
  return (
    <section className="mo-section mo-section--surface">
      <div className="mo-container">
        <div className="mo-section-head--center">
          <p className="mo-section-eyebrow mo-section-eyebrow--center">Old way → new way</p>
          <h2 className="mo-section-title" style={{ marginTop: 12 }}>
            A real preview, <em>before the $15,000.</em>
          </h2>
        </div>
        <div className="dt-oldnew-grid">
          <div className="dt-oldnew-card dt-oldnew-card--old">
            <div className="dt-oldnew-card__tag">The old way</div>
            <h3 className="dt-oldnew-card__name">Book, pay, hope it&rsquo;s what you pictured</h3>
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
            <h3 className="dt-oldnew-card__name">NoseLab</h3>
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

function NTestimonials() {
  return (
    <section className="mo-section">
      <div className="mo-container">
        <div className="mo-section-head--center">
          <div className="mo-section-eyebrow mo-section-eyebrow--center">What members say</div>
          <h2 className="mo-section-title" style={{ marginTop: 16 }}><em>They saw it first.</em></h2>
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

function NPricing() {
  const { plan, setPlan } = useContext(PlanContext);
  return (
    <section id="mo-pricing" className="mo-section mo-section--ink">
      <div className="mo-container">
        <div className="mo-section-head--center">
          <h2 className="mo-section-title" style={{ marginTop: 16, color: "#fff" }}>
            Previews and exports. <em style={{ color: "rgba(255,255,255,0.5)" }}>Pick your plan.</em>
          </h2>
        </div>
        <div className="mo-pricing-card">
          <div className="no-plan-picker" role="radiogroup" aria-label="Choose a plan">
            {PLANS.map((p) => {
              const active = p.key === plan;
              return (
                <button
                  key={p.key}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  className={`no-plan-opt ${active ? "no-plan-opt--active" : ""}`}
                  onClick={() => setPlan(p.key)}
                >
                  {p.badge && <span className="no-plan-opt__badge">{p.badge}</span>}
                  <span className="no-plan-opt__radio" aria-hidden="true" />
                  <span className="no-plan-opt__label">{p.label}</span>
                  <span className="no-plan-opt__price">
                    {p.priceLabel}<span className="no-plan-opt__per">{p.perLabel}</span>
                  </span>
                  <span className="no-plan-opt__sub">{p.subLabel ?? "billed " + p.interval + "ly"}</span>
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

function NGuarantee() {
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
              See your preview.{" "}
              <em>If it doesn&rsquo;t help, your first payment is refunded.</em>
            </h2>
          </div>
        </div>
      </div>
    </section>
  );
}

function NFaq() {
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

function NFooter() {
  return (
    <footer className="mo-footer">
      <div className="mo-container">
        <div className="mo-footer__top">
          <div>
            <div className="mo-footer__brand">Nose<em>Lab</em></div>
          </div>
          <div>
            <div className="mo-footer__col-head">Product</div>
            <a className="mo-footer__link" href="#no-method">How it works</a>
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
          <span>© {new Date().getFullYear()} NoseLab</span>
          <span>hello@protocol-club.com</span>
        </div>
        <p className="mo-footer__disclaimer">
          For visualization only. Not medical advice, not a prediction of surgical results.
        </p>
      </div>
    </footer>
  );
}

function NSticky({ visible }: { visible: boolean }) {
  const { plan } = useContext(PlanContext);
  const active = PLANS.find((p) => p.key === plan) ?? PLANS[0];
  return (
    <div className={`mo-sticky ${visible ? "mo-sticky--visible" : ""}`}>
      <div className="mo-sticky__mobile">
        <div className="mo-sticky__text">Nose preview, {active.priceLabel}{active.perLabel}</div>
        <CheckoutButton label={CTA_LABEL} className="mo-sticky__btn" location="sticky-mobile" withArrow={false} />
      </div>
      <div className="mo-sticky__desktop dt-sticky-desktop">
        <div className="mo-sticky__desktop-text">
          <strong>NoseLab</strong>
          <span>{active.priceLabel}{active.perLabel} · cancel anytime</span>
        </div>
        <CheckoutButton label={CTA_LABEL} className="mo-sticky__desktop-btn" location="sticky-desktop" withArrow={false} />
      </div>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function NoseOfferPage() {
  const [stickyVisible, setStickyVisible] = useState(false);
  const [plan, setPlan] = useState<string>(DEFAULT_PLAN_KEY);

  useEffect(() => {
    trackGa4Event("view_offer", { funnel: "nose", page_path: "/nose" });
    trackEvent("view_offer", { funnel: "nose", page_path: "/nose" });

    persistUtmParams(getUtmParams());

    const onScroll = () => setStickyVisible(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <PlanContext.Provider value={{ plan, setPlan }}>
      <div className="mo-page va-nose">
        <UrgencyBar />
        <NNav />
        <NHero />
        <NWhy />
        <NSteps />
        <NBeforeAfter />
        <NVariants />
        <NOldNew />
        <NTestimonials />
        <NPricing />
        <NGuarantee />
        <NFaq />
        <NFooter />
        <NSticky visible={stickyVisible} />
      </div>
    </PlanContext.Provider>
  );
}
