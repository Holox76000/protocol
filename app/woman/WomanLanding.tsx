import Image from "next/image";
import dynamic from "next/dynamic";
import TrackedLink from "../tracked-link";
import { getFunnelConfig } from "../../lib/funnels";
import "../program/program.css";
import type { ResearchTab } from "../program/ResearchImpactSection";
import type { ClientTransformationItem } from "../program/ClientTransformationsSection";
import ExpertsSection from "../program/ExpertsSection";
import NewApproachSection from "../program/NewApproachSection";
import ClientTransformationsSection from "../program/ClientTransformationsSection";
import ProtocolSection from "../program/ProtocolSection";
import GaryLinkovQuoteSection from "../program/GaryLinkovQuoteSection";
import TransformationSection from "../program/TransformationSection";
import HeroComparison from "../program/HeroComparison";
import WomanWhySection from "./WomanWhySection";
import WomanStorySection from "./WomanStorySection";
import WomanVisualizationSection from "./WomanVisualizationSection";
import WomanNoSurgerySection from "./WomanNoSurgerySection";
import WomanFAQSection from "./WomanFAQSection";

const ResearchImpactSection = dynamic(() => import("../program/ResearchImpactSection"), { ssr: false });

const HERO_GOALS = [
  "Tighten your waist and create a more sculpted shape",
  "Get a personalized 12-week protocol",
  "See your transformation before you start",
];

const CLIENT_TESTIMONIALS = [
  {
    name: "Sophia M.",
    age: 29,
    quote:
      "Protocol showed me why my body wasn’t changing despite working out so much. The plan made everything feel specific, calm, and finally doable.",
    result: "Tighter waist in 9 weeks",
  },
  {
    name: "Emma R.",
    age: 34,
    quote:
      "Seeing a realistic preview made the whole thing click for me. It stopped feeling abstract and started feeling achievable.",
    result: "Visible shape change in 8 weeks",
  },
  {
    name: "Chloe D.",
    age: 27,
    quote:
      "The analysis explained exactly what to focus on instead of sending me into another cycle of random workouts.",
    result: "Full-body recomposition in 12 weeks",
  },
];

const HERO_LOGOS = [
  { src: "/program/static/landing/images/home/logo/usa-today.webp", alt: "USA Today" },
  { src: "/program/static/landing/images/home/logo/the-guardian.webp", alt: "The Guardian" },
  { src: "/program/static/landing/images/home/logo/daily-mail.webp", alt: "Daily Mail" },
  { src: "/program/static/landing/images/home/logo/business-insider.webp", alt: "Business Insider" },
  { src: "/program/static/landing/images/home/logo/cosmopolitan.webp", alt: "Cosmopolitan" },
  { src: "/program/static/landing/images/home/logo/mit-technology-review.webp", alt: "MIT Technology Review" },
  { src: "/program/static/landing/images/home/logo/wired.webp", alt: "Wired" },
  { src: "/program/static/landing/images/home/logo/new-york-post.webp", alt: "New York Post" },
];

const BODY_FAT_DISTRIBUTION_IMAGE_SRC = "/dev-static/body-fat-distribution-copie.png";
const YOU_GET_CLARITY_IMAGE_SRC = "/dev-static/you-get-clarity.png";
const YOU_GAIN_CONTROL_IMAGE_SRC = "/dev-static/you-gain-control.png";
const WOMAN_ONE_BEFORE_IMAGE_SRC = "/dev-static/woman-1-before.png";
const WOMAN_ONE_AFTER_IMAGE_SRC = "/dev-static/woman-1-after.png";
const WOMAN_TWO_BEFORE_IMAGE_SRC = "/dev-static/woman-2-before.png";
const WOMAN_TWO_AFTER_IMAGE_SRC = "/dev-static/woman-2-after.png";
const WOMAN_INTERFACE_IMAGE_SRC = "/dev-static/woman-interface.png";

const FACIAL_ANALYSIS_ITEMS = [
  {
    number: "1",
    title: "You learn exactly what is happening with your body.",
    description:
      "Many things that frustrate you about your shape are highly fixable. Our analysis helps women stop guessing and start making precise changes.",
    image: BODY_FAT_DISTRIBUTION_IMAGE_SRC,
  },
  {
    number: "2",
    title: "You get clarity on what can actually change — and how fast.",
    description:
      "For example, waist softness, posture, glute shape, and upper-body balance all respond differently. We show you where the highest leverage is for your body.",
    image: YOU_GET_CLARITY_IMAGE_SRC,
  },
  {
    number: "3",
    title: "You gain control through knowledge.",
    description:
      "A clear, science-based plan replaces confusion with a practical path that actually fits your body and lifestyle.",
    image: YOU_GAIN_CONTROL_IMAGE_SRC,
  },
];

const WOMAN_CLIENT_TRANSFORMATIONS: ClientTransformationItem[] = [
  {
    id: "woman-1",
    beforeSrc: WOMAN_ONE_BEFORE_IMAGE_SRC,
    afterSrc: WOMAN_ONE_AFTER_IMAGE_SRC,
  },
  {
    id: "woman-2",
    beforeSrc: WOMAN_TWO_BEFORE_IMAGE_SRC,
    afterSrc: WOMAN_TWO_AFTER_IMAGE_SRC,
  },
];

const RESEARCH_TABS: ResearchTab[] = [
  {
    label: "Finances",
    items: [
      {
        titleHtml: "Higher <strong>earnings</strong>",
        description: "Women perceived as healthier and more attractive often see measurable workplace advantages.",
        source: "Hamermesh, D. S., and J. E. Biddle. (1994). The American Economic Review.",
      },
      {
        titleHtml: "More <strong>respect</strong>",
        description: "Appearance strongly shapes assumptions about competence, discipline, and social value.",
        source: "Puleo, R. (2006). Journal of Undergraduate Psychological Research.",
      },
      {
        titleHtml: "More <strong>interest</strong>",
        description: "Lean, healthy-looking physiques consistently drive stronger romantic attention.",
        source: "Parrett, M. (2015). Journal of Economic Psychology.",
      },
      {
        titleHtml: "More <strong>confidence</strong>",
        description: "Women who feel good about their bodies report substantially higher self-esteem.",
        source: "Reingen, P. H., & Kernan, J. B. (1993). Journal of Consumer Psychology.",
      },
    ],
  },
  {
    label: "Dating",
    items: [
      {
        titleHtml: "More <strong>matches</strong>",
        description: "On dating apps, appearance still dominates first-pass decisions.",
        source: "Witmer, J., Rosenbusch, H., & Meral, E. O. (2025). Computers in Human Behavior Reports.",
      },
      {
        titleHtml: "More <strong>second-dates</strong>",
        description: "Physical attraction consistently predicts early dating success.",
        source: "Eastwick, P. W., & Finkel, E. J. (2008). Journal of Personality and Social Psychology; Luo, S., & Zhang, G. (2009).",
      },
      {
        titleHtml: "More desirable <strong>partners</strong>",
        description: "People usually partner with someone close to their own perceived attractiveness level.",
        source: "Luo, S. Social & Personality Psychology. 2017.",
      },
      {
        titleHtml: "More <strong>important</strong> than we admit",
        description: "People routinely understate how much looks influence romantic choices.",
        source: "Eastwick et al. (2024). Journal of Personality and Social Psychology.",
      },
    ],
  },
  {
    label: "Socializing",
    items: [
      {
        titleHtml: "<strong>Warmer</strong>",
        description: "Attractive people are judged more positively across everyday social contexts.",
        source: "Cowan, M. L., & Little, A. C. (2013). Personality and Individual Differences.",
      },
      {
        titleHtml: "<strong>Healthier</strong>",
        description: "Attractive people are often perceived as healthier at a glance.",
        source: "Zebrowitz, L. A., & Franklin Jr, R. G. (2014). Experimental Aging Research.",
      },
      {
        titleHtml: "<strong>More capable</strong>",
        description: "Appearance spills into assumptions about intelligence and competence.",
        source: "Moore, F. R., Filippou, D., & Perrett, D. I. (2011). Journal of Evolutionary Psychology.",
      },
      {
        titleHtml: "<strong>More trusted</strong>",
        description: "Attractive people are often treated as more trustworthy and socially valued.",
        source: "Shinners, E. (2009). UW-L Journal of Undergraduate Research; Klebl et al. (2022). Journal of Nonverbal Behavior.",
      },
    ],
  },
  {
    label: "Health",
    items: [
      {
        titleHtml: "Better <strong>treatment</strong>",
        description: "Appearance can affect how seriously people are taken in health settings.",
        source: "Tsiga, E., Panagopoulou, E., & Benos, A. (2016). European Journal for Person Centered Healthcare.",
      },
      {
        titleHtml: "Healthier <strong>lifestyle</strong>",
        description: "The behaviors that improve body composition are often the same ones that improve long-term health.",
        source: "Arnocky, S., & Davis, A. C. (2024). Frontiers in Psychology.",
      },
      {
        titleHtml: "Longer <strong>lives</strong>",
        description: "Attractive people appear to live longer, likely due in part to treatment and lifestyle differences.",
        source: "Henderson, J.J.A., & Anglin, J.M. (2003). Evolution and Human Behavior.",
      },
    ],
  },
];

export default function WomanLanding() {
  const funnel = "woman" as const;
  const funnelConfig = getFunnelConfig(funnel);
  const landingAnchorBase = funnelConfig.landingHref;
  const primaryCtaEventParams = {
    funnel,
    cta_label: funnelConfig.landingPrimaryLabel,
    cta_location: "header",
    destination: funnelConfig.landingPrimaryHref,
  };
  const heroCtaEventParams = {
    funnel,
    cta_label: funnelConfig.landingSecondaryLabel,
    cta_location: "hero",
    destination: funnelConfig.landingPrimaryHref,
  };
  const footerCtaEventParams = {
    funnel,
    cta_label: funnelConfig.footerCtaLabel,
    cta_location: "footer",
    destination: funnelConfig.landingPrimaryHref,
  };

  return (
    <div className="program-page program-page--theme-test">
      <header className="program-nav">
        <div className="program-nav__inner">
          <a href={funnelConfig.landingHref} className="program-nav__logo" aria-label="Protocol women home">
            <Image
              src="/program/static/landing/images/shared/Prtcl.png"
              alt="Protocol"
              width={44}
              height={44}
              className="program-nav__logo-image"
            />
          </a>
          <nav className="program-nav__links" aria-label="Primary">
            <a href={`${landingAnchorBase}#why-glowup`}>Why transform</a>
            <a href={`${landingAnchorBase}#how-it-works`}>How it works</a>
            <a href={`${landingAnchorBase}#faq`}>FAQ</a>
          </nav>
          <div className="program-nav__actions">
            <a href="/login" className="program-nav__login">Login</a>
            <TrackedLink
              href={funnelConfig.landingPrimaryHref}
              className="program-nav__cta"
              eventName="landing_cta_clicked"
              eventParams={primaryCtaEventParams}
            >
              {funnelConfig.landingPrimaryLabel}
            </TrackedLink>
          </div>
        </div>
      </header>

      <section className="program-hero" aria-labelledby="program-hero-title">
        <div className="program-hero__shell">
          <div className="program-hero__copy">
            <p className="program-hero__eyebrow">For Women Who Want a Leaner, Stronger, More Sculpted Body</p>
            <h1 id="program-hero-title" className="program-hero__title">
              Stop Looking “Soft” <span>— Get Lean and Toned.</span>
            </h1>
            <p className="program-hero__subtitle">
              Get your personalized body analysis and 12-week protocol.
            </p>
            <div className="program-hero__actions">
              <TrackedLink
                href={funnelConfig.landingPrimaryHref}
                className="program-hero__cta"
                eventName="landing_cta_clicked"
                eventParams={heroCtaEventParams}
              >
                <span>{funnelConfig.landingSecondaryLabel}</span>
                <span className="program-hero__cta-icon" aria-hidden="true">
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 14H22M22 14L14 6M22 14L14 22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </TrackedLink>
            </div>
            <p className="program-hero__trust">
              <span className="program-hero__trust-item">25,000+ women analyzed</span>
              <span className="program-hero__trust-dot" aria-hidden="true" />
              <span className="program-hero__trust-item">100% natural</span>
            </p>
          </div>
        </div>
        <div className="program-hero__stage">
          <ol className="program-hero__benefits">
            {HERO_GOALS.map((goal, index) => (
              <li key={goal}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{goal}</p>
              </li>
            ))}
          </ol>
          <div className="program-hero__gallery">
            <HeroComparison
              funnel={funnel}
              subject="Woman"
              defaultBeforeSrc={WOMAN_ONE_BEFORE_IMAGE_SRC}
              defaultAfterSrc={WOMAN_ONE_AFTER_IMAGE_SRC}
              beforePosition="50% 44%"
              afterPosition="50% 44%"
              beforeScale={1.02}
              afterScale={1.02}
            />
          </div>
        </div>
        <div className="program-hero__logos">
          <p className="program-hero__logos-label">As seen in</p>
          {HERO_LOGOS.map((logo) => (
            <div key={logo.alt} className="program-hero__logo">
              <Image src={logo.src} alt={logo.alt} width={140} height={44} />
            </div>
          ))}
        </div>
      </section>

      <ResearchImpactSection
        tabs={RESEARCH_TABS}
        subtitle="Research consistently shows that fitter, healthier-looking women are perceived differently in work, dating, and everyday life. Below is a curated collection of studies."
      />
      <WomanStorySection />
      <ClientTransformationsSection items={WOMAN_CLIENT_TRANSFORMATIONS} />

      <section className="program-testimonials" aria-label="Client testimonials">
        <div className="program-testimonials__inner">
          <div className="program-testimonials__grid">
            {CLIENT_TESTIMONIALS.map((t) => (
              <article key={t.name} className="program-testimonials__card">
                <div className="program-testimonials__stars" aria-label="5 stars">
                  {"★★★★★"}
                </div>
                <blockquote className="program-testimonials__quote">&ldquo;{t.quote}&rdquo;</blockquote>
                <div className="program-testimonials__meta">
                  <p className="program-testimonials__name">
                    {t.name}, {t.age}
                  </p>
                  <p className="program-testimonials__result">{t.result}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <WomanVisualizationSection />
      <WomanNoSurgerySection />
      <NewApproachSection />
      <WomanWhySection />
      <ExpertsSection />
      <GaryLinkovQuoteSection />
      <TransformationSection ctaHref={funnelConfig.landingPrimaryHref} ctaLabel={funnelConfig.transformationCtaLabel} funnel={funnel} />
      <ProtocolSection interfaceSrc={WOMAN_INTERFACE_IMAGE_SRC} />

      <section className="program-analysis" aria-labelledby="program-analysis-title">
        <div className="program-analysis__shell">
          <header className="program-analysis__header">
            <p className="program-analysis__eyebrow">Body Analysis</p>
            <h2 id="program-analysis-title" className="program-analysis__title">
              Will Analyzing My <span>Body Make Me Feel Worse About Myself?</span>
            </h2>
            <p className="program-analysis__subtitle">
              Most insecurity comes from uncertainty, not from seeing reality clearly. A grounded analysis gives you
              a path forward instead of another cycle of guessing.
            </p>
          </header>
          <div className="program-analysis__grid">
            {FACIAL_ANALYSIS_ITEMS.map((item) => (
              <article key={item.number} className="program-analysis__card">
                <div className="program-analysis__card-top">
                  <div>
                    <p className="program-analysis__number">{item.number}</p>
                    <h3 className="program-analysis__card-title">{item.title}</h3>
                  </div>
                  <div className="program-analysis__image" style={{ backgroundImage: `url(${item.image})` }} />
                </div>
                <p className="program-analysis__description">{item.description}</p>
              </article>
            ))}
          </div>
          <blockquote className="program-analysis__quote">
            Think of it like getting a body composition scan from a sports scientist. The goal is not to shame you,
            it is to show you exactly what can change and how.
          </blockquote>
        </div>
      </section>

      <WomanFAQSection />

      <div className="program-sticky-cta">
        <TrackedLink
          href={funnelConfig.landingPrimaryHref}
          className="program-sticky-cta__button"
          eventName="landing_cta_clicked"
          eventParams={{ ...heroCtaEventParams, cta_location: "sticky_mobile" }}
        >
          {funnelConfig.landingPrimaryLabel}
        </TrackedLink>
      </div>

      <footer className="program-footer">
        <div className="program-footer__cta">
          <div>
            <h2 className="program-footer__cta-title">Join thousands of women already building a more sculpted body.</h2>
          </div>
          <TrackedLink
            href={funnelConfig.landingPrimaryHref}
            className="program-footer__cta-button"
            eventName="landing_cta_clicked"
            eventParams={footerCtaEventParams}
          >
            {funnelConfig.footerCtaLabel}
          </TrackedLink>
        </div>

        <div className="program-footer__main">
          <div className="program-footer__brand">
            <div className="program-footer__mark" aria-hidden="true">
              <Image
                src="/program/static/landing/images/shared/Prtcl.png"
                alt=""
                width={56}
                height={56}
                className="program-footer__mark-image"
              />
            </div>
            <div className="program-footer__info-block">
              <p className="program-footer__heading">Protocol /</p>
              <a href="mailto:support@protocol-club.com">support@protocol-club.com</a>
            </div>
            <div className="program-footer__info-block">
              <p className="program-footer__heading">Disclaimer /</p>
              <p>
                Some body visualizations are digitally generated to illustrate potential changes. Individual results
                may vary based on consistency and adherence to the protocol.
              </p>
            </div>
          </div>

          <nav className="program-footer__nav" aria-label="Footer">
            <div className="program-footer__column">
              <p className="program-footer__heading">Company /</p>
              <a href={funnelConfig.landingHref}>Products</a>
              <a href="/program/resources">Research</a>
              <a href="/program/contact-us.html">Contact Us</a>
              <a href="/program/for-doctors.html">Protocol for Clinics</a>
            </div>
            <div className="program-footer__column">
              <p className="program-footer__heading">Others /</p>
              <a href="/program/legal/privacy-policy">Privacy Policy</a>
              <a href="/program/legal">Terms of Service</a>
            </div>
          </nav>
        </div>
      </footer>
    </div>
  );
}
