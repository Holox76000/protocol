"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { trackGa4Event } from "../../lib/ga4Event";
import { trackEvent } from "../../lib/analytics";
import { getUtmParams, persistUtmParams, getPersistedUtmParams } from "../../lib/utm";
import "../f1/f1.css";
import "../f1/offer/f1-offer.css";
import "./dating.css";

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

/* ─── Checkout ──────────────────────────────────────────────────────────── */

async function startCheckout(location: string, label: string): Promise<boolean> {
  trackGa4Event("dating_offer_cta_clicked", {
    funnel: "dating",
    cta_location: location,
    cta_label: label,
  });
  trackEvent("offer_cta_clicked", { funnel: "dating", cta_location: location });

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
        funnel: "dating",
        landing_page: "/dating",
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

  const handleClick = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    const ok = await startCheckout(location, label);
    if (!ok) setLoading(false);
  }, [loading, location, label]);

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

const CTA_LABEL = "Get my 30 photos — $39";

const STEPS = [
  {
    num: "01",
    time: "5 MIN",
    title: "Photos + a short questionnaire",
    desc: "Upload 6–12 selfies — different angles, good light. Then a few questions about who you are: your style, your settings, your life.",
  },
  {
    num: "02",
    time: "AI STUDIO",
    title: "We shoot you in 6 styles",
    desc: "Your photos calibrate our AI studio to your exact features. Then we shoot you in the styles top profiles use: nature, casual, outdoor, night out, athletic, lifestyle.",
  },
  {
    num: "03",
    time: "24 H",
    title: "30 photos in your inbox",
    desc: "Download, pick your favorites, update your profile.",
  },
];

const STYLES = [
  { key: "nature", name: "Nature", desc: "Trails, greenery, fresh air." },
  { key: "casual", name: "Casual", desc: "Weekend daylight, relaxed." },
  { key: "outdoor", name: "Outdoor", desc: "Golden hour, open air." },
  { key: "night", name: "Night out", desc: "Low light, sharp fit." },
  { key: "athletic", name: "Athletic", desc: "In motion, not flexing." },
  { key: "lifestyle", name: "Lifestyle", desc: "Travel, moments, on the move." },
];

const RESEARCH_CARDS = [
  { title: "Natural light, sharp focus", desc: "Top profiles are shot in daylight or golden hour — almost never flash, almost never filters." },
  { title: "3+ different contexts", desc: "The most-matched profiles mix settings: work, outdoors, social. Variety reads as a life, not a photoshoot." },
  { title: "Face-forward framing", desc: "Chest-up crops, eyes visible, no sunglasses in the first photo. The frame the swipe decision is made on." },
];

const TESTIMONIALS = [
  {
    quote: "Matched more in my first week than in the six months before. The photos look like me — on my best day.",
    name: "Ryan, 34",
    meta: "Hinge · May 2026",
  },
  {
    quote: "I uploaded twelve selfies and got back thirty photos I actually wanted to post.",
    name: "Sam, 29",
    meta: "Tinder · April 2026",
  },
  {
    quote: "The night-out set alone doubled my likes on Hinge.",
    name: "Alex, 31",
    meta: "Hinge · June 2026",
  },
];

const PRICING_BULLETS = [
  "30 high-resolution photos",
  "6 styles: nature · casual · outdoor · night out · athletic · lifestyle",
  "Ready for Tinder, Hinge and Bumble crops",
  "Delivered by email within 24 hours",
  "Source photos deleted after delivery",
  "Full refund if you don't love them",
];

const FAQS = [
  {
    q: "Will the photos actually look like me?",
    a: "Yes. Your photos are used as reference by our AI studio so every shot preserves your exact features. These aren't stock faces — they're you, in better light, better framing, better moments.",
  },
  {
    q: "What photos should I upload?",
    a: "6 to 12 recent photos. Vary the angles, keep your face visible. Phone selfies work.",
  },
  {
    q: "How fast do I get them?",
    a: "Within 24 hours, by email.",
  },
  {
    q: "What happens to my photos?",
    a: "They're used once to generate your set, then deleted. Never shared, never used for anything else.",
  },
  {
    q: "Can I use the photos outside dating apps?",
    a: "They're yours. Profile pictures, social — anywhere.",
  },
];

const BEFORE_PHOTOS = [
  { src: "/dating/transformation/before-1.webp", alt: "Phone selfie, indoor low light" },
  { src: "/dating/transformation/before-2.webp", alt: "Casual outdoor snapshot" },
];

const AFTER_PHOTOS = [
  { src: "/dating/transformation/after-1.webp", alt: "Outdoor — on the boat", style: "Outdoor" },
  { src: "/dating/transformation/after-2.webp", alt: "Night out — sunset outfit", style: "Night out" },
  { src: "/dating/transformation/after-3.webp", alt: "Nature — snorkeling at sea", style: "Nature" },
  { src: "/dating/transformation/after-4.webp", alt: "Athletic — shirtless outdoor portrait", style: "Athletic" },
  { src: "/dating/transformation/after-5.webp", alt: "Lifestyle — helicopter ride", style: "Lifestyle" },
  { src: "/dating/transformation/after-6.webp", alt: "Casual — at the museum", style: "Casual" },
];

const PRESS_LOGOS = [
  { src: "/program/static/landing/images/home/logo/gq.webp", alt: "GQ" },
  { src: "/program/static/landing/images/home/logo/wired.webp", alt: "Wired" },
  { src: "/program/static/landing/images/home/logo/the-guardian.webp", alt: "The Guardian" },
  { src: "/program/static/landing/images/home/logo/business-insider.webp", alt: "Business Insider" },
  { src: "/program/static/landing/images/home/logo/mit-technology-review.webp", alt: "MIT Technology Review" },
  { src: "/program/static/landing/images/home/logo/cosmopolitan.webp", alt: "Cosmopolitan" },
];

/* ─── Trustpilot badge ──────────────────────────────────────────────────── */

function TrustpilotBadge() {
  return (
    <div className="mo-tp-badge">
      <div className="mo-tp-badge__logo-wrap">
        <Image src="/assets/trustpilot-logo.png" alt="Trustpilot" width={70} height={19} />
      </div>
      <div className="mo-tp-badge__divider" />
      <div className="mo-tp-badge__body">
        <div className="mo-tp-badge__stars">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className="mo-tp-badge__star">★</span>
          ))}
        </div>
        <p className="mo-tp-badge__meta"><strong>4.8</strong> · 467 reviews</p>
      </div>
    </div>
  );
}

/* ─── Sections ──────────────────────────────────────────────────────────── */

function DNav() {
  return (
    <nav className="mo-nav">
      <div className="mo-nav__brand">Protocol <em>Dating</em></div>
      <div className="mo-nav__links">
        <a href="#dt-method">How it works</a>
        <a href="#mo-pricing">Pricing</a>
      </div>
      <CheckoutButton label={CTA_LABEL} className="mo-nav__cta" location="nav" withArrow={false} />
    </nav>
  );
}

function DHero() {
  return (
    <section className="mo-hero mo-hero-v1">
      <div className="mo-hero-v1__left">
        <div className="mo-hero-v1__copy">
          <h1 className="mo-hero__title">Photos that get you matches. <em>Without a photographer.</em></h1>
          <p className="mo-hero__desc">
            We analyzed thousands of top-performing profiles on the main dating apps.
            Our AI studio shoots you the way they&rsquo;re shot — 30 profile-ready photos,
            delivered in 24 hours.
          </p>
          <div className="mo-hero__ctas">
            <CheckoutButton label={CTA_LABEL} className="mo-cta mo-cta--hero" location="hero" />
            <a href="#dt-method" className="mo-hero__cta-ghost">See how it works</a>
          </div>
          <TrustpilotBadge />
          <div className="mo-hero__meta">
            <span>30 photos</span>
            <span className="mo-hero__meta-dot">·</span>
            <span>6 styles</span>
            <span className="mo-hero__meta-dot">·</span>
            <span>delivered in 24h</span>
          </div>
        </div>
      </div>

      {/* Mobile: copy above the visual */}
      <div className="mo-hero-v1__mobile-ctas mo-hero-pad">
        <h1 className="mo-hero__title">Photos that get you matches. <em>Without a photographer.</em></h1>
        <p className="mo-hero__desc">
          We analyzed thousands of top-performing profiles on the main dating apps.
          Our AI studio shoots you the way they&rsquo;re shot — 30 profile-ready photos,
          delivered in 24 hours.
        </p>
      </div>

      {/* Right column: style grid */}
      <div className="mo-hero-v1__right">
        <div className="mo-hero-v1__product-stack">
          <div className="dt-hero-grid">
            {STYLES.filter((s) => s.key !== "nature" && s.key !== "lifestyle").map((s) => (
              <div key={s.key} className={`dt-hero-tile dt-hero-tile--${s.key}`}>
                <span>{s.name}</span>
              </div>
            ))}
          </div>
          <div className="mo-hero-v1__fc mo-hero-v1__fc--ratio">
            <div className="mo-fc-label">Matches / week</div>
            <div className="mo-fc-val">9 <em>→</em> 47</div>
            <div className="mo-fc-delta">+38</div>
          </div>
        </div>
      </div>

      {/* Mobile: CTA strip below the visual */}
      <div className="mo-hero-v1__mobile-cta-strip mo-hero-pad">
        <CheckoutButton label={CTA_LABEL} className="mo-cta mo-cta--hero" location="hero-mobile" />
        <a href="#dt-method" className="mo-hero__cta-ghost">See how it works</a>
        <TrustpilotBadge />
        <div className="mo-hero__meta">
          <span>30 photos</span>
          <span className="mo-hero__meta-dot">·</span>
          <span>5 styles</span>
          <span className="mo-hero__meta-dot">·</span>
          <span>delivered in 24h</span>
        </div>
      </div>
    </section>
  );
}

function DPress() {
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

function DResearch() {
  return (
    <section className="mo-section mo-section--surface">
      <div className="mo-container">
        <div className="mo-section-head--center">
          <p className="mo-section-eyebrow mo-section-eyebrow--center">The research</p>
          <h2 className="mo-section-title" style={{ marginTop: 12 }}>
            We analyzed thousands of top profiles <em>on the main dating apps.</em>
          </h2>
          <p className="dt-research-sub">
            The most-matched profiles share the same photo patterns — lighting, framing,
            context variety. Every set we generate is shot to match those patterns.
          </p>
        </div>
        <div className="dt-research-grid">
          {RESEARCH_CARDS.map((c) => (
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

function DSteps() {
  return (
    <section id="dt-method" className="mo-section">
      <div className="mo-container">
        <div className="mo-section-head">
          <div>
            <div className="mo-section-eyebrow">How it works</div>
            <h2 className="mo-section-title">One upload. <em>Then we shoot.</em></h2>
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

function DStyles() {
  return (
    <section className="mo-section mo-section--surface">
      <div className="mo-container">
        <div className="mo-section-head--center">
          <p className="mo-section-eyebrow mo-section-eyebrow--center">The 6 styles</p>
          <h2 className="mo-section-title" style={{ marginTop: 12 }}>
            One upload. <em>Six shoots.</em>
          </h2>
        </div>
        <div className="dt-styles-grid">
          {STYLES.map((s) => (
            <div key={s.key} className="dt-style-card">
              <div className={`dt-style-card__visual dt-hero-tile--${s.key}`} />
              <div className="dt-style-card__name">{s.name}</div>
              <p className="dt-style-card__desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DBeforeAfter() {
  return (
    <section className="mo-section mo-section--surface">
      <div className="mo-container">
        <div className="mo-section-head--center">
          <p className="mo-section-eyebrow mo-section-eyebrow--center">Before / after</p>
          <h2 className="mo-section-title" style={{ marginTop: 12 }}>
            The selfies you have. <em>The 30 photos you need.</em>
          </h2>
          <p className="dt-research-sub">
            Same face, same features — reframed the way top dating profiles are shot. Below,
            a real member: two phone selfies in, six of thirty out.
          </p>
        </div>

        <div className="dt-ba-grid">
          <div className="dt-ba-col dt-ba-col--before">
            <div className="dt-ba-col__head">
              <span className="dt-ba-col__tag dt-ba-col__tag--before">You upload</span>
              <span className="dt-ba-col__meta">2 of 6–12 selfies</span>
            </div>
            <div className="dt-ba-before-stack">
              {BEFORE_PHOTOS.map((p, i) => (
                <div key={i} className="dt-ba-photo dt-ba-photo--before">
                  <Image src={p.src} alt={p.alt} width={700} height={924} sizes="(max-width: 900px) 42vw, 240px" />
                </div>
              ))}
            </div>
            <p className="dt-ba-col__caption">Phone selfies, mixed light, mixed angles.</p>
          </div>

          <div className="dt-ba-arrow" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <div className="dt-ba-col dt-ba-col--after">
            <div className="dt-ba-col__head">
              <span className="dt-ba-col__tag dt-ba-col__tag--after">You get back</span>
              <span className="dt-ba-col__meta">6 of 30 photos</span>
            </div>
            <div className="dt-ba-after-grid">
              {AFTER_PHOTOS.map((p, i) => (
                <div key={i} className="dt-ba-photo dt-ba-photo--after">
                  <Image src={p.src} alt={p.alt} width={700} height={934} sizes="(max-width: 900px) 30vw, 180px" />
                  <span className="dt-ba-photo__style">{p.style}</span>
                </div>
              ))}
            </div>
            <p className="dt-ba-col__caption">Nature · Casual · Outdoor · Night out · Athletic · Lifestyle.</p>
          </div>
        </div>

        <div className="mo-section-cta">
          <CheckoutButton label={CTA_LABEL} className="mo-cta" location="before-after" />
        </div>
      </div>
    </section>
  );
}

const LIKE_YOU_CARDS = [
  {
    title: "Your lifestyle",
    desc: "Runner, chef, café regular, mountain weekends — your set is shot in the settings you actually live in. Not a rented sports car.",
  },
  {
    title: "Your personality",
    desc: "Reserved or loud, suit or hoodie — outfits, framing and expressions match how you actually come across in person.",
  },
  {
    title: "What makes you, you",
    desc: "Beard, tattoos, glasses, curls, that smile — the details people recognize you by stay exactly as they are.",
  },
];

function DLikeYou() {
  return (
    <section className="mo-section">
      <div className="mo-container">
        <div className="mo-section-head--center">
          <p className="mo-section-eyebrow mo-section-eyebrow--center">Calibrated to you</p>
          <h2 className="mo-section-title" style={{ marginTop: 12 }}>
            Photos that look like you. <em>Not a template.</em>
          </h2>
          <p className="dt-research-sub">
            The fastest way to lose a match is photos that don&rsquo;t look like you. Every set is
            calibrated from the photos you upload — your style, your settings, your details — so
            the person who shows up matches the profile.
          </p>
        </div>
        <div className="dt-research-grid">
          {LIKE_YOU_CARDS.map((c) => (
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

function DFounderStory() {
  return (
    <section className="mo-section">
      <div className="mo-container">
        <div className="dt-founder">
          <svg className="dt-founder__mark" width="28" height="24" viewBox="0 0 13 12" fill="none" aria-hidden="true">
            <path d="M0 12V7.08C0 3.75 0.94 1.23 4.92 0V2.52C3.04 3.16 2.46 4.27 2.52 7.08H4.92V12H0ZM10.3 7.08H12.76V12H7.84V7.08C7.84 3.75 8.72 1.23 12.7 0V2.52C10.83 3.16 10.3 4.27 10.3 7.08Z" fill="currentColor"/>
          </svg>
          <p className="mo-section-eyebrow">From the founder</p>
          <h2 className="mo-section-title" style={{ marginTop: 12 }}>
            A dating photoshoot costs $400. <em>Most people never book one.</em>
          </h2>
          <div className="dt-founder__body">
            <p>
              I&rsquo;m a photographer. I&rsquo;ve shot dozens of dating-profile sessions, and the
              pattern never changed: someone walks in convinced they&rsquo;re not photogenic — two
              hours later they don&rsquo;t recognize their own photos. Nothing about them changed.
              The light, the angles and the direction did.
            </p>
            <p>
              But at $400 a session, the people who need those photos most never book them. So we
              trained our AI studio on everything those shoots taught us — the framing, the light,
              the six styles that get profiles noticed.
            </p>
            <p>
              Same treatment, a tenth of the budget. And the point was never prettier pictures —
              it&rsquo;s matching with people who actually fit you, because your profile finally
              shows who you are.
            </p>
          </div>
          <div className="dt-founder__author">
            <div className="dt-founder__avatar">P</div>
            <div>
              <p className="dt-founder__name">Pierre</p>
              <p className="dt-founder__title">Founder, Protocol Dating</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const OLD_WAY = [
  "$400+ for a half-day shoot",
  "One location, one outfit, one light",
  "20–25 edited photos, delivered in 1–2 weeks",
  "Posing in public while strangers watch",
];

const NEW_WAY = [
  "$39 — ten times less",
  "6 styles, 6 settings, one upload",
  "30 photos in your inbox within 24h",
  "Shot from selfies you already have",
];

function DOldNew() {
  return (
    <section className="mo-section mo-section--surface">
      <div className="mo-container">
        <div className="mo-section-head--center">
          <p className="mo-section-eyebrow mo-section-eyebrow--center">Old way → new way</p>
          <h2 className="mo-section-title" style={{ marginTop: 12 }}>
            The $400 shoot, <em>reinvented.</em>
          </h2>
          <p className="dt-research-sub">
            Same photographer&rsquo;s eye — trained on dating profiles, powered by AI. Same
            result, more photos, a tenth of the price.
          </p>
        </div>
        <div className="dt-oldnew-grid">
          <div className="dt-oldnew-card dt-oldnew-card--old">
            <div className="dt-oldnew-card__tag">The old way</div>
            <h3 className="dt-oldnew-card__name">Book a photographer</h3>
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
            <h3 className="dt-oldnew-card__name">Protocol Dating</h3>
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

function DTestimonials() {
  return (
    <section className="mo-section">
      <div className="mo-container">
        <div className="mo-section-head--center">
          <div className="mo-section-eyebrow mo-section-eyebrow--center">What members say</div>
          <h2 className="mo-section-title" style={{ marginTop: 16 }}><em>Profiles that started landing.</em></h2>
        </div>
        <div className="mo-testimonials-grid">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="mo-testi">
              <div className="mo-testi__stars">
                <StarIcon /><StarIcon /><StarIcon /><StarIcon /><StarIcon />
              </div>
              <p className="mo-testi__quote">&ldquo;{t.quote}&rdquo;</p>
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

function DPricing() {
  return (
    <section id="mo-pricing" className="mo-section mo-section--ink">
      <div className="mo-container">
        <div className="mo-section-head--center">
          <h2 className="mo-section-title" style={{ marginTop: 16, color: "#fff" }}>
            Your 30 photos. <em style={{ color: "rgba(255,255,255,0.5)" }}>$39, once.</em>
          </h2>
        </div>
        <div className="mo-pricing-card">
          <div className="mo-pricing-card__top">
            <div>
              <div className="mo-pricing-card__price-row">
                <span className="mo-pricing-card__price">$39</span>
              </div>
              <div className="mo-pricing-card__tag">one-time</div>
            </div>
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
          <div className="mo-pricing-card__guarantee">Full refund if you don&rsquo;t love them</div>
        </div>
      </div>
    </section>
  );
}

function DGuarantee() {
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
              Look through all 30.{" "}
              <em>If you don&rsquo;t love them, full refund.</em>
            </h2>
          </div>
        </div>
      </div>
    </section>
  );
}

function DFaq() {
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

function DFooter() {
  return (
    <footer className="mo-footer">
      <div className="mo-container">
        <div className="mo-footer__top">
          <div>
            <div className="mo-footer__brand">Protocol <em>Dating</em></div>
          </div>
          <div>
            <div className="mo-footer__col-head">Product</div>
            <a className="mo-footer__link" href="#dt-method">How it works</a>
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
          <span>© {new Date().getFullYear()} Protocol Dating</span>
          <span>hello@protocol-club.com</span>
        </div>
        <p className="mo-footer__disclaimer">
          * Results may vary. Generated photos are for personal use.
        </p>
      </div>
    </footer>
  );
}

function DSticky({ visible }: { visible: boolean }) {
  return (
    <div className={`mo-sticky ${visible ? "mo-sticky--visible" : ""}`}>
      <div className="mo-sticky__mobile">
        <div className="mo-sticky__text">Your 30 photos, in 24h</div>
        <CheckoutButton label={CTA_LABEL} className="mo-sticky__btn" location="sticky-mobile" withArrow={false} />
      </div>
      <div className="mo-sticky__desktop dt-sticky-desktop">
        <div className="mo-sticky__desktop-text">
          <strong>Protocol Dating</strong>
          <span>one-time · $39</span>
        </div>
        <CheckoutButton label={CTA_LABEL} className="mo-sticky__desktop-btn" location="sticky-desktop" withArrow={false} />
      </div>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function DatingOfferPage() {
  const [stickyVisible, setStickyVisible] = useState(false);

  useEffect(() => {
    trackGa4Event("view_offer", { funnel: "dating", page_path: "/dating" });
    trackEvent("view_offer", { funnel: "dating", page_path: "/dating" });

    persistUtmParams(getUtmParams());

    const onScroll = () => setStickyVisible(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="mo-page">
      <DNav />
      <DHero />
      <DPress />
      <DResearch />
      <DSteps />
      <DStyles />
      <DBeforeAfter />
      <DLikeYou />
      <DFounderStory />
      <DOldNew />
      <DTestimonials />
      <DPricing />
      <DGuarantee />
      <DFaq />
      <DFooter />
      <DSticky visible={stickyVisible} />
    </div>
  );
}
