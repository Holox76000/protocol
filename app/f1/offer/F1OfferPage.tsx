"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { trackGa4Event } from "../../../lib/ga4Event";
import { trackEvent } from "../../../lib/analytics";
import { getUtmParams, persistUtmParams, appendUtmToPath } from "../../../lib/utm";
import "../f1.css";
import "./f1-offer.css";

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
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
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
    desc: "Front, side, back. 60 seconds, stays private. We pull 100+ markers — shoulder width, waist, torso angle, posture.",
    img: "/assets/body-scan.png",
  },
  {
    num: "02",
    time: "60 SEC",
    title: "We analyse",
    desc: "AI benchmarks your ratios against the research, then your coach reviews the output and writes the protocol.",
    img: "/assets/analysis-card.png",
  },
  {
    num: "03",
    time: "12 WEEKS",
    title: "Get your protocol",
    desc: "Front, side, back. 60 seconds, stays private. We pull 100+ markers — shoulder width, waist, torso angle, posture.",
    img: "/assets/connor-protocol.png",
  },
];

const RESULTS = [
  { name: "Ryan, 27", ratio: "ATTRACTIVENESS SCORE 45 → 67", before: "/assets/5-before.png", after: "/assets/5-after.png" },
  { name: "Jake, 34", ratio: "ATTRACTIVENESS SCORE 45 → 67", before: "/assets/2-before.png", after: "/assets/2-after.png" },
  { name: "Marcus, 31", ratio: "ATTRACTIVENESS SCORE 45 → 67", before: "/assets/14-before.png", after: "/assets/14-after.png" },
];

const SCIENCE_VARS = [
  { num: "01", name: "Shoulder-to-waist", sub: "V-taper indicator", val: "1.29 → 1.44" },
  { num: "02", name: "Chest-to-waist", sub: "Upper proportion", val: "1.18 → 1.32" },
  { num: "03", name: "Torso index", sub: "Length × width", val: "3.8 → 5.1" },
  { num: "04", name: "Hip-to-shoulder", sub: "Lower anchor", val: "0.74 → 0.69" },
  { num: "05", name: "Posture grade", sub: "Cervical + thoracic", val: "C+ → A−" },
  { num: "01", name: "Shoulder-to-waist", sub: "V-taper indicator", val: "measured" },
];

const COMPARE_ROWS = [
  { feature: "Personalised to your frame", app: <XIcon />, pt: "Sometimes", us: <><CheckIcon /> Yes</> },
  { feature: "Backed by research", app: "Partial", pt: <XIcon />, us: <><CheckIcon /> Measured</> },
  { feature: "Direct coach access", app: <XIcon />, pt: "In person", us: <><CheckIcon /> WhatsApp</> },
  { feature: "Refund if no result", app: <XIcon />, pt: <XIcon />, us: <><CheckIcon /> 90 days</> },
  { feature: "Commitment", app: "Sub", pt: "$200/sess", us: "$89 once" },
];

const TESTIMONIALS = [
  { quote: ["I didn't lose weight. ", { em: "I changed shape." }] as TitlePart[], name: "Ryan, 27", meta: "13 weeks" },
  { quote: ["Same suit. ", { em: "Different fit." }] as TitlePart[], name: "Jake, 34", meta: "12 weeks" },
  { quote: ["First thing that named the actual problem."] as TitlePart[], name: "Marcus, 31", meta: "16 weeks" },
];

const PRICING_BULLETS = [
  "15+ structural variables analysed by AI + coach review",
  "15+ structural variables analysed by AI + coach review",
  "15+ structural variables analysed by AI + coach review",
  "Weekly check-ins, weekly adjustments",
  "Full refund if your ratios haven't moved in 90 days",
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
      <div className="mo-nav__brand">
        Protocol <em>Club</em>
      </div>
      <a href={href} className="mo-nav__cta">
        Start — $89
      </a>
    </nav>
  );
}

function MHeroV1({ href }: { href: string }) {
  return (
    <section className="mo-hero mo-hero-v1">
      <div className="mo-hero-pad">
        <div className="mo-hero__eyebrow">Expert advice, enhanced by science</div>
        <h1 className="mo-hero__title">
          Reach your full <em>potential</em>
        </h1>
        <p className="mo-hero__desc">
          A measured, 12-week protocol built around the published research on what the eye reads as attractive.
        </p>
      </div>
      <div className="mo-hero-v1__stack">
        <Image
          className="mo-hero-v1__product"
          src="/assets/connor-protocol.png"
          alt="Connor's Protocol"
          width={600}
          height={450}
          priority
        />
        <div className="mo-hero-v1__floating mo-hero-v1__floating--ratio">
          <div className="mo-ratio-label">ATTRACTIVENESS</div>
          <div className="mo-ratio-val">
            54 <em>→</em> 77
          </div>
          <div className="mo-ratio-delta">+23</div>
        </div>
      </div>
      <div className="mo-hero-pad">
        <CtaButton label="Start your Protocol — $89" className="mo-cta--hero" location="hero" href={href} />
        <a href="#mo-method" className="mo-hero__cta-ghost">
          See the method
        </a>
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
      <span className="mo-press__label">As featured in</span>
      <div className="mo-press__row">
        {PRESS_LOGOS.map((logo) => (
          <Image key={logo.alt} src={logo.src} alt={logo.alt} width={100} height={32} />
        ))}
      </div>
    </div>
  );
}

function MSteps() {
  return (
    <section id="mo-method" className="mo-section mo-section--surface">
      <div className="mo-cont">
        <div className="mo-head">
          <div className="mo-eyebrow">The method</div>
          <h2 className="mo-title">
            Three steps. <em>Then it runs.</em>
          </h2>
          <p className="mo-lede">
            Most body programs ask you to start lifting on day one. We start with your actual shape — where it is,
            where it could go — then build the plan around that.
          </p>
        </div>
        <div className="mo-steps">
          {STEPS.map((s, i) => (
            <div key={i} className="mo-step">
              <div className="mo-step__head">
                <div className="mo-step__num">{s.num} /</div>
                <div className="mo-step__time">{s.time}</div>
              </div>
              <h3 className="mo-step__title">{s.title}</h3>
              <p className="mo-step__desc">{s.desc}</p>
              <div className="mo-step__visual">
                <Image src={s.img} alt={s.title} width={400} height={260} />
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
    <section className="mo-section">
      <div className="mo-cont">
        <div className="mo-head--rule">
          <div>
            <div className="mo-eyebrow">Members, 13 weeks in</div>
            <h2 className="mo-title">
              Real photos. <em>Real ratios.</em>
            </h2>
          </div>
        </div>
      </div>
      <div className="mo-results">
        {RESULTS.map((r, i) => (
          <div key={i} className="mo-result">
            <div className="mo-result__split">
              <Image src={r.before} alt="Before" width={200} height={280} />
              <Image src={r.after} alt="After" width={200} height={280} />
            </div>
            <div className="mo-result__divider" />
            <div className="mo-result__labels">
              <span>Before</span>
              <span>After</span>
            </div>
            <div className="mo-result__caption">
              <div className="mo-result__name">{r.name}</div>
              <div className="mo-result__ratio">{r.ratio}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mo-results-foot">Average attractiveness score gain : +27</div>
      <div className="mo-section-cta">
        <CtaButton label="Start your Protocol — $89" location="results" href={href} />
      </div>
    </section>
  );
}

function MScience() {
  return (
    <section className="mo-section mo-section--warm">
      <div className="mo-cont">
        <div className="mo-head">
          <div className="mo-eyebrow">What we measure</div>
          <h2 className="mo-title">
            Hundreds structural variables. <em>One protocol per body.</em>
          </h2>
          <p className="mo-lede">
            Every plan starts with the same forensic read of your frame. The same data points used in published
            attractiveness research.
          </p>
        </div>
        <div className="mo-science__visual">
          <Image src="/assets/2-after.png" alt="Body analysis" width={400} height={500} />
          <div className="mo-science__marker" style={{ top: "30%", left: "24%" }}>
            <div className="mo-science__dot" />
            <div className="mo-science__line" />
            <div className="mo-science__tag">SHL 51</div>
          </div>
          <div className="mo-science__marker" style={{ top: "50%", left: "74%" }}>
            <div className="mo-science__tag">CWR 1.32</div>
            <div className="mo-science__line" />
            <div className="mo-science__dot" />
          </div>
          <div className="mo-science__marker" style={{ top: "68%", left: "22%" }}>
            <div className="mo-science__dot" />
            <div className="mo-science__line" />
            <div className="mo-science__tag">WST 78</div>
          </div>
        </div>
        <div className="mo-science__list">
          {SCIENCE_VARS.map((v, i) => (
            <div key={i} className="mo-science__item">
              <div className="mo-science__item-num">{v.num}</div>
              <div className="mo-science__item-name">
                {v.name}
                <span>{v.sub}</span>
              </div>
              <div className="mo-science__item-val">{v.val}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MCompare() {
  return (
    <section className="mo-section">
      <div className="mo-cont">
        <div className="mo-head mo-head--center">
          <div className="mo-eyebrow mo-eyebrow--center">Why this works</div>
          <h2 className="mo-title">
            Gym programs build muscle. <em>We build attractiveness Protocol for you.</em>
          </h2>
        </div>
        {[
          { label: "Generic app", vals: COMPARE_ROWS.map((r) => r.app), isUs: false },
          { label: "Personal trainer", vals: COMPARE_ROWS.map((r) => r.pt), isUs: false },
          { label: "Protocol Club", vals: COMPARE_ROWS.map((r) => r.us), isUs: true },
        ].map((group) => (
          <div key={group.label} className="mo-compare__group">
            <div className={`mo-compare__head ${group.isUs ? "mo-compare__head--us" : ""}`}>{group.label}</div>
            {COMPARE_ROWS.map((row, i) => (
              <div key={i} className="mo-compare__row">
                <div className="mo-compare__row-label">{row.feature}</div>
                <div className={`mo-compare__row-val ${!group.isUs ? "mo-compare__row-val--x" : ""} ${group.isUs ? "mo-compare__row-val--check" : ""}`}>
                  {group.vals[i]}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function MTestimonials() {
  return (
    <section className="mo-section mo-section--surface">
      <div className="mo-cont">
        <div className="mo-head mo-head--center">
          <div className="mo-eyebrow mo-eyebrow--center">What club members say</div>
          <h2 className="mo-title">
            <em>A change of shape.</em>
          </h2>
        </div>
        <div className="mo-testimonials">
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
      <div className="mo-cont">
        <div className="mo-head mo-head--center">
          <div className="mo-eyebrow mo-eyebrow--inv mo-eyebrow--center">One plan, one price</div>
          <h2 className="mo-title" style={{ color: "#fff" }}>
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
              <div className="mo-pricing-card__tag">one-time · 12 weeks</div>
            </div>
            <div className="mo-pricing-card__badge">Save $60</div>
          </div>
          <ul className="mo-pricing-card__list">
            {PRICING_BULLETS.map((b, i) => (
              <li key={i}>
                <span className="mo-pricing-card__check">
                  <CheckIcon size={10} />
                </span>
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
      <div className="mo-cont">
        <div className="mo-guarantee__seal">
          <div className="mo-guarantee__seal-num">90</div>
          <div className="mo-guarantee__seal-label">Day Refund</div>
        </div>
        <h2 className="mo-guarantee__title">
          Follow the protocol for 90 days. Measure your proportions.{" "}
          <em>If the data hasn&apos;t moved, full refund.</em>
        </h2>
        <p className="mo-guarantee__desc">
          No conditions. No back-and-forth. We name the metric up front — your shoulder-to-waist ratio, your torso
          index — and we move it, or we hand you back the $89.
        </p>
      </div>
    </section>
  );
}

function MFaq() {
  const [open, setOpen] = useState<number>(-1);
  return (
    <section className="mo-section">
      <div className="mo-cont">
        <div className="mo-head">
          <div className="mo-eyebrow">FAQ</div>
          <h2 className="mo-title">
            Short answers <em>to real questions.</em>
          </h2>
        </div>
        <div>
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
    </section>
  );
}

function MFooter() {
  return (
    <footer className="mo-footer">
      <div className="mo-footer__brand">
        Protocol <em>Club</em>
      </div>
      <p className="mo-footer__desc">
        Body design based on research. A measured, 12-week protocol for your frame — built with coaches, informed by
        the published science.
      </p>
      <div className="mo-footer__cols">
        <div>
          <div className="mo-footer__col-head">Product</div>
          <a className="mo-footer__link" href="#mo-method">Method</a>
          <a className="mo-footer__link" href="#mo-pricing">Pricing</a>
        </div>
        <div>
          <div className="mo-footer__col-head">Legal</div>
          <a className="mo-footer__link" href="/privacy-policy">Privacy</a>
          <a className="mo-footer__link" href="/terms-of-service">Terms</a>
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
    </footer>
  );
}

function MSticky({ href, visible }: { href: string; visible: boolean }) {
  return (
    <div className={`mo-sticky ${visible ? "mo-sticky--visible" : ""}`}>
      <div className="mo-sticky__text">
        The full Protocol
        <span></span>
      </div>
      <a href={href} className="mo-sticky__btn">
        Start — $89 <ArrowIcon size={12} />
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
