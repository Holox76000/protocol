"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { trackGa4Event } from "../../../lib/ga4Event";
import { trackEvent } from "../../../lib/analytics";
import { getUtmParams, persistUtmParams, getPersistedUtmParams } from "../../../lib/utm";
import { EXPERIMENTS } from "../../../lib/experiments";
import "./nose-preview.css";

/* ─── Checkout ──────────────────────────────────────────────────────────────
   Same one-time plan as /nose. The shape the visitor was looking at when they
   converted rides along in `from`, which the API copies into Stripe metadata —
   no backend change, and delivery sees which direction they came for. */

const PLAN = EXPERIMENTS.nose.plans[0];

async function startCheckout(location: string, shapeKey: string): Promise<boolean> {
  trackGa4Event("nose_preview_cta_clicked", {
    funnel: "nose",
    cta_location: location,
    shape: shapeKey,
    plan: PLAN.key,
  });
  trackEvent("offer_cta_clicked", {
    funnel: "nose",
    cta_location: location,
    page: "/nose/preview",
    shape: shapeKey,
  });

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
        landing_page: "/nose/preview",
        plan: PLAN.key,
        from: `preview:${shapeKey}`,
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

/* ─── Data ──────────────────────────────────────────────────────────────── */

type Shape = {
  key: string;
  img: string;
  /** Frame ratio for this panel — the frame takes it so the image fills it. */
  ratio: string;
  /** Alt text and the label behind each dot. */
  label: string;
};

// Two panels: what the tool does, then how many shapes it gives you.
const SHAPES: Shape[] = [
  {
    key: "intro",
    img: "/nose/preview/intro.jpg",
    ratio: "1200 / 847",
    label: "See your face with a different nose",
  },
  {
    key: "styles",
    img: "/nose/preview/intro2.jpg",
    ratio: "1200 / 848",
    label: "More than one nose to choose from",
  },
];

// Audience numbers, in the three-card row the retake paywall runs under its
// rating. The users figure is the one on the slide-1 creative; the other two
// are placeholders until the real counts land.
const STATS = [
  { value: "190,000+", label: "Users" },
  { value: "1M+", label: "Nose previews generated" },
  { value: "30+", label: "Countries supported" },
];

const TESTIMONIALS = [
  {
    name: "Sofia, 24",
    handle: "@sofia",
    avatar: "/nose/testi/sofia.jpg",
    quote:
      "I'd wanted this for ten years and never booked. Seeing the after is what finally got me to schedule the consult.",
    date: "July 2026",
  },
  {
    name: "Priya, 29",
    handle: "@priya",
    avatar: "/nose/testi/priya.jpg",
    quote:
      "Brought the PDF to my surgeon and we went straight to what I actually wanted. Saved a whole appointment.",
    date: "June 2026",
  },
  {
    name: "Daniel, 33",
    handle: "@daniel",
    avatar: "/nose/testi/daniel.jpg",
    quote:
      "It only touched my nose. Every other app turned me into someone else — this one still looked like me.",
    date: "May 2026",
  },
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
    q: "Is this a subscription?",
    a: "No. You pay $29 once, you get your preview and your PDF, and that's the end of it. Nothing renews, so there is nothing to cancel and no card to remove.",
  },
];

const CTA_LABEL = "Get my preview";

/* ─── Icons ─────────────────────────────────────────────────────────────── */

function ChevronIcon({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={dir === "left" ? "M15 5L8 12L15 19" : "M9 5L16 12L9 19"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Stars() {
  return (
    <div className="np-stars" aria-label="4.8 out of 5">
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i}>★</span>
      ))}
    </div>
  );
}

/* ─── CTA ───────────────────────────────────────────────────────────────── */

function CheckoutButton({
  label,
  location,
  shapeKey,
}: {
  label: string;
  location: string;
  shapeKey: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    const ok = await startCheckout(location, shapeKey);
    if (!ok) setLoading(false);
  }, [loading, location, shapeKey]);

  return (
    <button type="button" onClick={handleClick} className="np-cta" disabled={loading}>
      {loading ? <span className="np-cta__spinner" aria-hidden="true" /> : label}
    </button>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function NosePreviewPage() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const seen = useRef<Set<string>>(new Set(["intro"]));

  useEffect(() => {
    // GA4 only: the LP already fired the Meta ViewContent for this visitor, and
    // trackEvent's view_offer would double-count it on the interstitial.
    trackGa4Event("view_nose_preview", { funnel: "nose", page_path: "/nose/preview" });
    persistUtmParams(getUtmParams());
  }, []);

  // Slides are narrower than the track (the neighbours peek), so the active one
  // is whichever slide centre sits closest to the track centre.
  const onScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const centre = el.scrollLeft + el.clientWidth / 2;
    let best = 0;
    let bestDist = Infinity;
    Array.from(el.children).forEach((node, i) => {
      const child = node as HTMLElement;
      const dist = Math.abs(child.offsetLeft + child.clientWidth / 2 - centre);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    setActive((prev) => (prev === best ? prev : best));
  }, []);

  useEffect(() => {
    const shape = SHAPES[active];
    if (!shape || seen.current.has(shape.key)) return;
    seen.current.add(shape.key);
    trackGa4Event("nose_preview_shape_viewed", { funnel: "nose", shape: shape.key, seen_count: seen.current.size });
  }, [active]);

  const goTo = useCallback((i: number) => {
    const el = trackRef.current;
    const child = el?.children[i] as HTMLElement | undefined;
    if (!el || !child) return;
    el.scrollTo({
      left: child.offsetLeft - (el.clientWidth - child.clientWidth) / 2,
      behavior: "smooth",
    });
    setActive(i);
  }, []);

  const shape = SHAPES[active];

  return (
    <div className="np-page">
      <header className="np-header">
        <a href="/nose" className="np-logo">
          Nose<em>Lab</em>
        </a>
      </header>

      <main className="np-main">
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="np-block np-block--tight">
          <h1 className="np-h1">See your nose before you decide</h1>
          <p className="np-lede">
            One photo, several realistic nose shapes — and nothing else on your face moves.
          </p>
        </section>

        {/* ── Shape carousel ───────────────────────────────────────────── */}
        <section className="np-block np-block--carousel">
          <div className="np-stage">
            <div
              className="np-frame"
              /* The frame takes the ratio of whatever slide is showing, so the
                 image fills it edge to edge instead of sitting on a mat. */
              style={{ aspectRatio: shape.ratio }}
            >
              <div className="np-carousel">
                <div
                  className="np-track"
                  ref={trackRef}
                  onScroll={onScroll}
                  role="group"
                  aria-label="Nose shapes"
                >
                  {SHAPES.map((s, i) => (
                    <figure
                      className={`np-slide${i === active ? " np-slide--on" : ""}`}
                      key={s.key}
                      onClick={() => i !== active && goTo(i)}
                    >
                      <div className="np-photo">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={s.img} alt={s.label} loading="eager" draggable={false} />
                      </div>
                    </figure>
                  ))}
                </div>
              </div>
            </div>

            {/* Outside the frame, in the section gutters — they never sit on
                the image. */}
            <button
              type="button"
              className="np-arrow np-arrow--prev"
              onClick={() => goTo(Math.max(active - 1, 0))}
              disabled={active === 0}
              aria-label="Previous shape"
            >
              <ChevronIcon dir="left" />
            </button>
            <button
              type="button"
              className="np-arrow np-arrow--next"
              onClick={() => goTo(Math.min(active + 1, SHAPES.length - 1))}
              disabled={active === SHAPES.length - 1}
              aria-label="Next shape"
            >
              <ChevronIcon dir="right" />
            </button>
          </div>

          <div className="np-dots">
            {SHAPES.map((s, i) => (
              <button
                key={s.key}
                type="button"
                className={`np-dot${i === active ? " np-dot--on" : ""}`}
                onClick={() => goTo(i)}
                aria-label={s.label}
                aria-current={i === active}
              />
            ))}
          </div>
        </section>

        {/* ── Plan ─────────────────────────────────────────────────────── */}
        <section className="np-block np-block--plan">
          <h2 className="np-h2">One price, every shape</h2>
          <p className="np-lede">Your photo, only the nose changed, in 24 h.</p>
          <p className="np-fine">One-time payment. Nothing renews.</p>

          <div className="np-plans">
            <div className="np-plan np-plan--on">
              <div className="np-plan__price">{PLAN.priceLabel}</div>
              <div className="np-plan__per">one-time</div>
            </div>
            <div className="np-plan np-plan--anchor">
              <div className="np-plan__price">$150+</div>
              <div className="np-plan__per">one surgeon consult</div>
            </div>
          </div>

          <CheckoutButton label={CTA_LABEL} location="preview-plan" shapeKey={shape.key} />
        </section>

        {/* ── Social proof ─────────────────────────────────────────────── */}
        <section className="np-band">
          <div className="np-band__inner">
            <div className="np-block np-block--tight">
              <Stars />
              <h2 className="np-h2">Used by 190,000+ people</h2>
            </div>

            <div className="np-stats">
              {STATS.map((s) => (
                <div className="np-stat" key={s.label}>
                  <div className="np-stat__value">{s.value}</div>
                  <div className="np-stat__label">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="np-testis">
              {TESTIMONIALS.map((t) => (
                <figure className="np-testi" key={t.name}>
                  <div className="np-testi__head">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="np-testi__avatar" src={t.avatar} alt="" loading="lazy" />
                    <div>
                      <div className="np-testi__name">{t.name}</div>
                      <div className="np-testi__handle">{t.handle}</div>
                    </div>
                  </div>
                  <blockquote className="np-testi__quote">“{t.quote}”</blockquote>
                  <figcaption className="np-testi__date">{t.date}</figcaption>
                </figure>
              ))}
            </div>

            <div className="np-block np-block--tight">
              <CheckoutButton label={CTA_LABEL} location="preview-social" shapeKey={shape.key} />
              <div className="np-rating">
                <Stars />
                <span>4.8 out of 5</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────────────── */}
        <section className="np-block">
          <h2 className="np-h2">Frequently asked questions</h2>
          <div className="np-faq">
            {FAQS.map((f, i) => (
              <div className="np-faq__row" key={f.q}>
                <button
                  type="button"
                  className="np-faq__q"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                >
                  <span>{f.q}</span>
                  <svg
                    className={`np-faq__chev${openFaq === i ? " np-faq__chev--on" : ""}`}
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {openFaq === i && <p className="np-faq__a">{f.a}</p>}
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="np-footer">
        <p>For visualization only. Not medical advice, not a prediction of surgical results.</p>
        <p>© {new Date().getFullYear()} NoseLab · hello@protocol-club.com</p>
      </footer>
    </div>
  );
}
