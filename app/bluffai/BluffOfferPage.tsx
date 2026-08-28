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
import "./bluffai.css";

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

const PLANS = EXPERIMENTS.bluffai.plans;
const DEFAULT_PLAN_KEY = EXPERIMENTS.bluffai.defaultPlanKey;

// The selected plan is shared across every CTA on the page (nav, hero, sticky,
// pricing selector) so any button checks out the tier the visitor picked.
const PlanContext = createContext<{
  plan: string;
  setPlan: (key: string) => void;
}>({ plan: DEFAULT_PLAN_KEY, setPlan: () => {} });

/* ─── Checkout ──────────────────────────────────────────────────────────── */

async function startCheckout(location: string, label: string, plan: string): Promise<boolean> {
  trackGa4Event("bluffai_offer_cta_clicked", {
    funnel: "bluffai",
    cta_location: location,
    cta_label: label,
    plan,
  });
  trackEvent("offer_cta_clicked", { funnel: "bluffai", cta_location: location, plan });

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
        funnel: "bluffai",
        landing_page: "/bluffai",
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

const CTA_LABEL = "Start 3-day free trial";

const STEPS = [
  {
    num: "01",
    time: "PICK",
    title: "Pick a template",
    desc: "Fake tattoo, fake couple, bald, you at 80, a new hair color. 60+ to choose from. Tap the one you want.",
  },
  {
    num: "02",
    time: "UPLOAD",
    title: "Upload one photo",
    desc: "A normal selfie from your camera roll. No good lighting, no setup. Just the face you want to prank with.",
  },
  {
    num: "03",
    time: "60 SEC",
    title: "Get a result that looks real",
    desc: "A photoreal render comes back to your inbox. Text it to whoever you want and watch the replies roll in.",
  },
];

const TEMPLATES = [
  { img: "/bluffai/t-tattoo.jpg", name: "Fake tattoo", desc: "A full sleeve overnight. Nobody buys it until they zoom in." },
  { img: "/bluffai/t-couple.jpg", name: "Fake couple", desc: "You and a stranger, arm in arm. Send it and say nothing." },
  { img: "/bluffai/t-aged.jpg", name: "You at 80", desc: "Age yourself 50 years. Your group chat won't recover." },
  { img: "/bluffai/t-bald.jpg", name: "Bald you", desc: "Shave the whole thing off. Text it to your barber." },
  { img: "/bluffai/t-haircolor.jpg", name: "New hair color", desc: "Go platinum, red, or blue before you touch the dye." },
  { img: "/bluffai/t-cartoon.jpg", name: "Cartoon you", desc: "Turn yourself into an animated character in one tap." },
];

const REACTIONS = [
  { text: "wait is that REAL??", meta: "the mom" },
  { text: "since when do you have that 😭", meta: "the best friend" },
  { text: "who is SHE", meta: "the ex" },
  { text: "call me right now", meta: "the sister" },
  { text: "you did NOT", meta: "the roommate" },
  { text: "i'm actually shaking", meta: "the group chat" },
];

const WHY_CARDS = [
  {
    title: "It looks real",
    desc: "Not a sticker, not a filter. A photoreal render built from your actual photo — the reason people fall for it.",
  },
  {
    title: "One photo is enough",
    desc: "No app to learn, no editing. Send one selfie, pick a style, get it back ready to text.",
  },
  {
    title: "Built for the reply",
    desc: "The point isn't the photo. It's the panic, the double-take, the \"wait what\" you screenshot and keep.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "Sent the fake tattoo one to my mom. She called in under a minute. Best $7 I've ever spent on a Tuesday.",
    name: "Maya, 22",
    meta: "August 2026",
  },
  {
    quote:
      "Did the fake couple one and posted it. Three people texted asking who he was. I still haven't told them.",
    name: "Jordan, 24",
    meta: "July 2026",
  },
  {
    quote:
      "Aged myself to 80 and put it in the group chat. Nobody could tell it was fake. Chaos for an hour.",
    name: "Devon, 19",
    meta: "August 2026",
  },
];

const PRICING_BULLETS = [
  "60+ prank templates, new ones added",
  "Photoreal results from one photo",
  "Fresh credits every week",
  "Results back within minutes",
  "Works from any phone, no app to install",
  "Cancel anytime — reply \"cancel\" to any email",
  "Your photos deleted after each render",
];

const FAQS = [
  {
    q: "Does it actually look real?",
    a: "That's the whole product. The result is a photoreal render built from your photo, not a filter or a sticker slapped on top. Most people can't tell until you admit it.",
  },
  {
    q: "How fast do I get my result?",
    a: "Within minutes. Upload one photo, pick a template, and the finished render comes back to your inbox ready to text.",
  },
  {
    q: "What photo should I send?",
    a: "A normal selfie works. Clear face, decent light. No pro camera, no setup — the same photo you'd post to your story.",
  },
  {
    q: "How many can I make?",
    a: "You get a batch of credits every week. Use them on any templates you want — one big prank or a whole run of them.",
  },
  {
    q: "How does the free trial work?",
    a: "You get 3 days free. Cancel before they're up and you're never charged. To cancel, reply \"cancel\" to any email from us — handled the same day, no calls or forms.",
  },
  {
    q: "What happens to my photos?",
    a: "They're used once to make your render, then deleted. Never posted, never shared, never used for anything else.",
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
        <p className="mo-tp-badge__meta"><strong>45,000+</strong> images created</p>
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

/* ─── iMessage hero mock (the hook: the reaction, not the tech) ──────────── */

function BluffChatMock() {
  return (
    <div className="bf-phone">
      <div className="bf-phone__notch" aria-hidden="true" />
      <div className="bf-phone__head">
        <div className="bf-phone__avatar">M</div>
        <div className="bf-phone__name">Mom</div>
      </div>
      <div className="bf-phone__thread" role="img" aria-label="Text thread: an AI before-and-after fake tattoo photo gets a shocked reaction">
        {/* Sent: the template render, shown as a before -> after so the fake is legible */}
        <div className="bf-msg bf-msg--out">
          <div className="bf-photo">
            <div className="bf-photo__frame">
              <span className="bf-photo__tag">FAKE TATTOO</span>
              <span className="bf-photo__ai">AI result</span>
              <div className="bf-ba">
                <div className="bf-ba__panel">
                  <span className="bf-ba__cap">Before</span>
                  <div className="bf-photo__img"><img src="/bluffai/arm-before.jpg" alt="" /></div>
                </div>
                <span className="bf-ba__arrow" aria-hidden="true">→</span>
                <div className="bf-ba__panel">
                  <span className="bf-ba__cap">After</span>
                  <div className="bf-photo__img"><img src="/bluffai/arm-after.jpg" alt="" /></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Received reactions */}
        <div className="bf-msg bf-msg--in">
          <div className="bf-bubble bf-bubble--in">wait is that real?? 👀</div>
        </div>
        <div className="bf-msg bf-msg--in">
          <div className="bf-bubble bf-bubble--in">since when do you have that 😭</div>
        </div>
        <div className="bf-msg bf-msg--in">
          <div className="bf-bubble bf-bubble--in">call me RIGHT now</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Sections ──────────────────────────────────────────────────────────── */

function BNav() {
  return (
    <nav className="mo-nav">
      <div className="mo-nav__brand">Bluff <em>AI</em></div>
      <div className="mo-nav__links">
        <a href="#bf-method">How it works</a>
        <a href="#mo-pricing">Pricing</a>
      </div>
      <CheckoutButton label={CTA_LABEL} className="mo-nav__cta" location="nav" withArrow={false} />
    </nav>
  );
}

function BHero() {
  return (
    <section className="mo-hero mo-hero-v1">
      <div className="mo-hero-v1__left">
        <div className="mo-hero-v1__copy">
          <h1 className="mo-hero__title">Text this to your mom. <em>Watch the panic.</em></h1>
          <p className="mo-hero__desc">
            Pick a style. Upload one photo. Get back a result nobody can tell is fake.
            Fake tattoos, fake couples, you at 80, and 60+ more. Ready to text in 60 seconds.
          </p>
          <div className="mo-hero__ctas">
            <CheckoutButton label={CTA_LABEL} className="mo-cta mo-cta--hero" location="hero" />
            <a href="#bf-method" className="mo-hero__cta-ghost">See how it works</a>
          </div>
          <TrustpilotBadge />
          <div className="mo-hero__meta">
            <span>3 days free</span>
            <span className="mo-hero__meta-dot">·</span>
            <span>then $6.99/week</span>
            <span className="mo-hero__meta-dot">·</span>
            <span>cancel anytime</span>
          </div>
        </div>
      </div>

      {/* Mobile: copy above the visual */}
      <div className="mo-hero-v1__mobile-ctas mo-hero-pad">
        <h1 className="mo-hero__title">Text this to your mom. <em>Watch the panic.</em></h1>
        <p className="mo-hero__desc">
          Pick a style. Upload one photo. Get back a result nobody can tell is fake.
          Fake tattoos, fake couples, you at 80, and 60+ more. Ready to text in 60 seconds.
        </p>
      </div>

      {/* Right column: iMessage mock */}
      <div className="mo-hero-v1__right bf-hero-right">
        <div className="mo-hero-v1__product-stack">
          <div className="bf-chat-wrap">
            <BluffChatMock />
            <div className="mo-hero-v1__fc mo-hero-v1__fc--ratio">
              <div className="mo-fc-label">One photo in</div>
              <div className="mo-fc-val">60 <em>sec</em></div>
              <div className="mo-fc-delta">looks real</div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: CTA strip below the visual */}
      <div className="mo-hero-v1__mobile-cta-strip mo-hero-pad">
        <CheckoutButton label={CTA_LABEL} className="mo-cta mo-cta--hero" location="hero-mobile" />
        <a href="#bf-method" className="mo-hero__cta-ghost">See how it works</a>
        <TrustpilotBadge />
      </div>
    </section>
  );
}

function BSteps() {
  return (
    <section id="bf-method" className="mo-section">
      <div className="mo-container">
        <div className="mo-section-head">
          <div>
            <div className="mo-section-eyebrow">How it works</div>
            <h2 className="mo-section-title">One photo in. <em>A perfect prank out.</em></h2>
          </div>
        </div>

        {/* Mini visual flow: pick a template → upload a selfie → result back */}
        <div className="bf-flow">
          <div className="bf-flow__step">
            <div className="bf-flow__thumb">
              <div className="bf-flow__mini">
                <img src="/bluffai/t-couple.jpg" alt="" />
                <span className="bf-flow__mini-pick">
                  <img src="/bluffai/t-tattoo.jpg" alt="" />
                  <span className="bf-flow__tap" aria-hidden="true" />
                </span>
                <img src="/bluffai/t-bald.jpg" alt="" />
                <img src="/bluffai/t-haircolor.jpg" alt="" />
              </div>
            </div>
            <div className="bf-flow__cap">Pick</div>
          </div>
          <span className="bf-ba__arrow bf-flow__arrow" aria-hidden="true">→</span>
          <div className="bf-flow__step">
            <div className="bf-flow__thumb">
              <img className="bf-flow__img" src="/bluffai/arm-before.jpg" alt="" />
              <span className="bf-flow__tag">Camera roll</span>
            </div>
            <div className="bf-flow__cap">Upload</div>
          </div>
          <span className="bf-ba__arrow bf-flow__arrow" aria-hidden="true">→</span>
          <div className="bf-flow__step">
            <div className="bf-flow__thumb bf-flow__thumb--chat">
              <div className="bf-flow__bubble"><img src="/bluffai/arm-after.jpg" alt="" /></div>
            </div>
            <div className="bf-flow__cap">60 sec</div>
          </div>
        </div>

        {/* Speed chrono */}
        <div className="bf-chrono" role="img" aria-label="Upload at 0 seconds, photoreal result back at 58 seconds">
          <div className="bf-chrono__end">
            <span className="bf-chrono__label">Upload</span>
            <span className="bf-chrono__time">0:00</span>
          </div>
          <div className="bf-chrono__track">
            <span className="bf-chrono__fill" />
            <span className="bf-chrono__dot bf-chrono__dot--start" aria-hidden="true" />
            <span className="bf-chrono__dot bf-chrono__dot--end" aria-hidden="true" />
          </div>
          <div className="bf-chrono__end bf-chrono__end--right">
            <span className="bf-chrono__label">Result</span>
            <span className="bf-chrono__time">0:58</span>
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

function BTemplates() {
  return (
    <section className="mo-section mo-section--surface">
      <div className="mo-container">
        <div className="mo-section-head--center">
          <p className="mo-section-eyebrow mo-section-eyebrow--center">60+ templates</p>
          <h2 className="mo-section-title" style={{ marginTop: 12 }}>
            Pick your prank. <em>We make it look real.</em>
          </h2>
          <p className="dt-research-sub">
            A few of the most-sent ones. New templates drop every week — you get
            credits to try as many as you want.
          </p>
        </div>
        <div className="bf-template-grid">
          {TEMPLATES.map((t) => (
            <div key={t.name} className="bf-template-card">
              <div className="bf-template-card__photo"><img src={t.img} alt={t.name} /></div>
              <h3 className="bf-template-card__name">{t.name}</h3>
              <p className="bf-template-card__desc">{t.desc}</p>
            </div>
          ))}
        </div>
        {/* Materialize the 60+ promise: 6 shown, 54 more stacked behind */}
        <div className="bf-ghost-row" role="img" aria-label="54 more templates, with new ones added every week">
          <span className="bf-ghost__badge">New this week</span>
          <div className="bf-ghost-stack" aria-hidden="true">
            <div className="bf-ghost"><img src="/bluffai/t-aged.jpg" alt="" /></div>
            <div className="bf-ghost"><img src="/bluffai/t-cartoon.jpg" alt="" /></div>
            <div className="bf-ghost"><img src="/bluffai/t-haircolor.jpg" alt="" /></div>
            <div className="bf-ghost"><img src="/bluffai/t-bald.jpg" alt="" /></div>
          </div>
          <div className="bf-ghost bf-ghost--more">
            <span className="bf-ghost__count">+54</span>
            <span className="bf-ghost__more">more</span>
          </div>
        </div>
        <div className="mo-section-cta">
          <CheckoutButton label={CTA_LABEL} className="mo-cta" location="templates" />
        </div>
      </div>
    </section>
  );
}

function BReactions() {
  return (
    <section className="mo-section">
      <div className="mo-container">
        <div className="mo-section-head--center">
          <p className="mo-section-eyebrow mo-section-eyebrow--center">The replies</p>
          <h2 className="mo-section-title" style={{ marginTop: 12 }}>
            You&rsquo;re not buying a photo. <em>You&rsquo;re buying the reaction.</em>
          </h2>
        </div>
        <div className="bf-reaction-grid">
          {REACTIONS.map((r) => (
            <div key={r.text} className="bf-reaction">
              <div className="bf-reaction__bubble">{r.text}</div>
              <div className="bf-reaction__meta">{r.meta}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BWhyItWorks() {
  return (
    <section className="mo-section mo-section--surface">
      <div className="mo-container">
        <div className="mo-section-head--center">
          <p className="mo-section-eyebrow mo-section-eyebrow--center">Why it lands</p>
          <h2 className="mo-section-title" style={{ marginTop: 12 }}>
            Filters get ignored. <em>This one gets a phone call.</em>
          </h2>
        </div>
        {/* Proof of "It looks real": a real photo vs its AI render, side by side */}
        <div className="bf-proof">
          <div className="bf-proof__ba">
            <div className="bf-proof__panel">
              <span className="bf-ba__cap">Real photo</span>
              <img src="/bluffai/arm-before.jpg" alt="" />
            </div>
            <span className="bf-ba__arrow" aria-hidden="true">→</span>
            <div className="bf-proof__panel">
              <span className="bf-ba__cap">AI render</span>
              <img src="/bluffai/arm-after.jpg" alt="" />
            </div>
          </div>
          <div className="bf-proof__tag">Spot the fake?</div>
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

const OLD_WAY = [
  "Hours in Photoshop for one edit",
  "Filters everyone can spot instantly",
  "Face-swap apps that look plastic",
  "A photographer and a whole setup",
];

const NEW_WAY = [
  "3 days free, then $6.99/week, cancel anytime",
  "Photoreal — nobody can tell it's fake",
  "60+ templates, tap and send",
  "One selfie, back in 60 seconds",
];

function BOldNew() {
  return (
    <section className="mo-section">
      <div className="mo-container">
        <div className="mo-section-head--center">
          <p className="mo-section-eyebrow mo-section-eyebrow--center">Old way → new way</p>
          <h2 className="mo-section-title" style={{ marginTop: 12 }}>
            Nobody can tell, <em>and you never touched an editor.</em>
          </h2>
        </div>
        <CompareBars metrics={[{ label: "Time per edit", oldVal: "Hours", newVal: "60 sec", newPct: 3 }]} />
        <div className="dt-oldnew-grid">
          <div className="dt-oldnew-card dt-oldnew-card--old">
            <div className="dt-oldnew-card__tag">The old way</div>
            <h3 className="dt-oldnew-card__name">Fake it yourself, badly</h3>
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
            <h3 className="dt-oldnew-card__name">Bluff AI</h3>
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

function BTestimonials() {
  return (
    <section className="mo-section">
      <div className="mo-container">
        <div className="mo-section-head--center">
          <div className="mo-section-eyebrow mo-section-eyebrow--center">What people say</div>
          <h2 className="mo-section-title" style={{ marginTop: 16 }}><em>Pranks that got a phone call.</em></h2>
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

function BPricing() {
  const { plan, setPlan } = useContext(PlanContext);
  const active = PLANS.find((p) => p.key === plan) ?? PLANS[0];
  const disclosure = active.trialDays
    ? `${active.trialDays} days free, then ${active.priceLabel}/week. Cancel anytime.`
    : `Billed yearly at ${active.priceLabel}. Cancel anytime.`;
  return (
    <section id="mo-pricing" className="mo-section mo-section--ink">
      <div className="mo-container">
        <div className="mo-section-head--center">
          <h2 className="mo-section-title" style={{ marginTop: 16, color: "#fff" }}>
            Every template, every week. <em style={{ color: "rgba(255,255,255,0.5)" }}>Pick your plan.</em>
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
          <div className="mo-pricing-card__guarantee">{disclosure}</div>
        </div>
      </div>
    </section>
  );
}

function BGuarantee() {
  return (
    <section className="mo-guarantee">
      <div className="mo-container">
        <div className="mo-guarantee__inner">
          <div className="mo-guarantee__seal">
            <div className="mo-guarantee__seal-num">3</div>
            <div className="mo-guarantee__seal-label">Days free</div>
          </div>
          <div>
            <h2 className="mo-guarantee__title">
              Make your first prank on the house.{" "}
              <em>Not for you? Cancel before day 3 and pay nothing.</em>
            </h2>
          </div>
        </div>

        {/* Peace-of-mind band: exactly when you're charged + how to cancel */}
        <div className="bf-assure">
          <div className="bf-assure__card">
            <div className="bf-assure__head">When you&rsquo;re charged</div>
            <div className="bf-billing">
              <div className="bf-billing__step">
                <span className="bf-billing__dot bf-billing__dot--now" aria-hidden="true" />
                <span className="bf-billing__day">Today</span>
                <span className="bf-billing__amt">$0</span>
                <span className="bf-billing__note">Trial starts</span>
              </div>
              <div className="bf-billing__step">
                <span className="bf-billing__dot" aria-hidden="true" />
                <span className="bf-billing__day">Day 3</span>
                <span className="bf-billing__amt bf-billing__amt--muted">Reminder</span>
                <span className="bf-billing__note">We email you first</span>
              </div>
              <div className="bf-billing__step">
                <span className="bf-billing__dot" aria-hidden="true" />
                <span className="bf-billing__day">After</span>
                <span className="bf-billing__amt">$6.99</span>
                <span className="bf-billing__note">per week</span>
              </div>
            </div>
          </div>
          <div className="bf-assure__card">
            <div className="bf-assure__head">How to cancel</div>
            <div className="bf-cancel__chat">
              <div className="bf-msg bf-msg--out">
                <div className="bf-bubble bf-bubble--out">cancel</div>
              </div>
              <div className="bf-msg bf-msg--in">
                <div className="bf-bubble bf-bubble--in bf-cancel__done">
                  <CheckIcon size={12} /> Done — same day
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BFaq() {
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

function BFooter() {
  return (
    <footer className="mo-footer">
      <div className="mo-container">
        <div className="mo-footer__top">
          <div>
            <div className="mo-footer__brand">Bluff <em>AI</em></div>
          </div>
          <div>
            <div className="mo-footer__col-head">Product</div>
            <a className="mo-footer__link" href="#bf-method">How it works</a>
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
          <span>© {new Date().getFullYear()} Bluff AI</span>
          <span>hello@protocol-club.com</span>
        </div>
        <p className="mo-footer__disclaimer">
          * For fun only. Images are AI-generated and not real. Don&rsquo;t use Bluff AI to
          deceive, defame, or harm anyone.
        </p>
      </div>
    </footer>
  );
}

function BSticky({ visible }: { visible: boolean }) {
  const { plan } = useContext(PlanContext);
  const active = PLANS.find((p) => p.key === plan) ?? PLANS[0];
  return (
    <div className={`mo-sticky ${visible ? "mo-sticky--visible" : ""}`}>
      <div className="mo-sticky__mobile">
        <div className="mo-sticky__text">60+ templates, {active.priceLabel}{active.perLabel}</div>
        <CheckoutButton label={CTA_LABEL} className="mo-sticky__btn" location="sticky-mobile" withArrow={false} />
      </div>
      <div className="mo-sticky__desktop dt-sticky-desktop">
        <div className="mo-sticky__desktop-text">
          <strong>Bluff AI</strong>
          <span>{active.priceLabel}{active.perLabel} · cancel anytime</span>
        </div>
        <CheckoutButton label={CTA_LABEL} className="mo-sticky__desktop-btn" location="sticky-desktop" withArrow={false} />
      </div>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function BluffOfferPage() {
  const [stickyVisible, setStickyVisible] = useState(false);
  const [plan, setPlan] = useState<string>(DEFAULT_PLAN_KEY);

  useEffect(() => {
    trackGa4Event("view_offer", { funnel: "bluffai", page_path: "/bluffai" });
    trackEvent("view_offer", { funnel: "bluffai", page_path: "/bluffai" });

    persistUtmParams(getUtmParams());

    const onScroll = () => setStickyVisible(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <PlanContext.Provider value={{ plan, setPlan }}>
      <div className="mo-page va-bluffai">
        <UrgencyBar />
        <BNav />
        <BHero />
        <BSteps />
        <BTemplates />
        <BReactions />
        <BWhyItWorks />
        <BOldNew />
        <BTestimonials />
        <BPricing />
        <BGuarantee />
        <BFaq />
        <BFooter />
        <BSticky visible={stickyVisible} />
      </div>
    </PlanContext.Provider>
  );
}
