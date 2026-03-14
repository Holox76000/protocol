import Image from "next/image";
import dynamic from "next/dynamic";
import TrackedLink from "../tracked-link";
import heroBeforeImage from "../../2-before.png";
import heroAfterImage from "../../2-after.png";
import bodyFatDistributionScoreImage from "../../body-fat-distribution copie.png";
import bodyScanImage from "../../body-scan.png";
import youGetClarityImage from "../../you-get-clarity.png";
import youGainControlImage from "../../you-gain-control.png";
import { getFunnelConfig, type FunnelVariant } from "../../lib/funnels";
import "./program.css";
import type { ResearchTab } from "./ResearchImpactSection";
import NewApproachSection from "./NewApproachSection";
import PricingSection from "./PricingSection";
import ExpertsSection from "./ExpertsSection";
import StorySection from "./StorySection";
import VisualizationSection from "./VisualizationSection";
import WhySection from "./WhySection";
import TransformationSection from "./TransformationSection";
import ClientTransformationsSection from "./ClientTransformationsSection";
import TechnologySection from "./TechnologySection";
import MoreScoresSection from "./MoreScoresSection";
import SupportSection from "./SupportSection";
import NoSurgerySection from "./NoSurgerySection";
import ProtocolSection from "./ProtocolSection";
import ExpertAdviceSection from "./ExpertAdviceSection";
import GaryLinkovQuoteSection from "./GaryLinkovQuoteSection";
import FollowersSection from "./FollowersSection";
import AestheticTestsSection from "./AestheticTestsSection";
import InformativeSection from "./InformativeSection";
import PersonalizedSection from "./PersonalizedSection";
import CompleteFacialAnalysisSection from "./CompleteFacialAnalysisSection";
import FAQSection from "./FAQSection";
import HeroComparison from "./HeroComparison";

const ResearchImpactSection = dynamic(() => import("./ResearchImpactSection"), { ssr: false });

const HERO_GOALS = [
  "Finally look good shirtless",
  "Kill the skinny-fat look for good",
  "Make a stronger first impression",
  "Improve your dating life",
  "Get a better salary",
];

const HERO_LOGOS = [
  { src: "/program/static/landing/images/home/logo/usa-today.webp", alt: "USA Today" },
  { src: "/program/static/landing/images/home/logo/the-guardian.webp", alt: "The Guardian" },
  { src: "/program/static/landing/images/home/logo/daily-mail.webp", alt: "Daily Mail" },
  { src: "/program/static/landing/images/home/logo/business-insider.webp", alt: "Business Insider" },
  { src: "/program/static/landing/images/home/logo/the-sun.webp", alt: "The Sun" },
  { src: "/program/static/landing/images/home/logo/cosmopolitan.webp", alt: "Cosmopolitan" },
  { src: "/program/static/landing/images/home/logo/mit-technology-review.webp", alt: "MIT Technology Review" },
  { src: "/program/static/landing/images/home/logo/gq.webp", alt: "GQ" },
  { src: "/program/static/landing/images/home/logo/wired.webp", alt: "Wired" },
  { src: "/program/static/landing/images/home/logo/new-york-post.webp", alt: "New York Post" },
];

const FACIAL_ANALYSIS_ITEMS = [
  {
    number: "1",
    title: "You learn exactly what's happening with your body.",
    description:
      "Many things you hate about your physique are 100% fixable. Our analysis helps men stop guessing and start acting.",
    image: bodyScanImage.src,
  },
  {
    number: "2",
    title: "You get clarity on what can actually change — and how fast.",
    description:
      "For example, some belly fat is hormonal and clears up in weeks with the right protocol. Flat chest responds to specific loading patterns most guys never use.",
    image: youGetClarityImage.src,
  },
  {
    number: "3",
    title: "You gain control through knowledge.",
    description: "A clear, science-based plan removes the paralysis of cut vs bulk forever.",
    image: youGainControlImage.src,
  },
];

const RESEARCH_TABS: ResearchTab[] = [
  {
    label: "Finances",
    items: [
      {
        titleHtml: "Higher <strong>salary</strong>",
        description: "Lean, muscular men earn 10-15% more",
        source: "Hamermesh, D. S., and J. E. Biddle. (1994). The American Economic Review.",
      },
      {
        titleHtml: "More <strong>respect</strong>",
        description: "Men with athletic builds are perceived as more competent and dominant",
        source: "Puleo, R. (2006). Journal of Undergraduate Psychological Research.",
      },
      {
        titleHtml: "More <strong>dates</strong>",
        description: "Men with visible muscle and low body fat receive 40% more matches",
        source: "Parrett, M. (2015). Journal of Economic Psychology.",
      },
      {
        titleHtml: "More <strong>confidence</strong>",
        description: "Men who feel good about their body report 2x higher self-esteem scores",
        source: "Reingen, P. H., & Kernan, J. B. (1993). Journal of Consumer Psychology.",
      },
    ],
  },
  {
    label: "Dating",
    items: [
      {
        titleHtml: "More <strong>swipes</strong>",
        description: "On dating apps, looks matter about 9 times more than biographies",
        source:
          "Witmer, J., Rosenbusch, H., & Meral, E. O. (2025). Computers in Human Behavior Reports.",
      },
      {
        titleHtml: "More <strong>second-dates</strong>",
        description: "In speed-dating studies, looks consistently predict success",
        source:
          "Eastwick, P. W., & Finkel, E. J. (2008). Journal of Personality and Social Psychology; Luo, S., & Zhang, G. (2009).",
      },
      {
        titleHtml: "More desirable <strong>partners</strong>",
        description: 'People usually end up with someone “in their league,” looks-wise',
        source: "Luo, S. Social & Personality Psychology. 2017.",
      },
      {
        titleHtml: "More <strong>important</strong> than we think",
        description: "People understate how much looks affect their romantic choices",
        source: "Eastwick et al. (2024). Journal of Personality and Social Psychology.",
      },
    ],
  },
  {
    label: "Socializing",
    items: [
      {
        titleHtml: "<strong>Funnier</strong>",
        description: "Attractive people are found funnier on video than in audio",
        source: "Cowan, M. L., & Little, A. C. (2013). Personality and Individual Differences.",
      },
      {
        titleHtml: "<strong>Healthier</strong>",
        description: "Attractive people are perceived to be healthier",
        source: "Zebrowitz, L. A., & Franklin Jr, R. G. (2014). Experimental Aging Research.",
      },
      {
        titleHtml: "<strong>Smarter</strong>",
        description: "Attractive people are thought to be more intelligent",
        source: "Moore, F. R., Filippou, D., & Perrett, D. I. (2011). Journal of Evolutionary Psychology.",
      },
      {
        titleHtml: "<strong>Better</strong>",
        description: "Attractive people are perceived as more moral and trustworthy",
        source:
          "Shinners, E. (2009). UW-L Journal of Undergraduate Research; Klebl et al. (2022). Journal of Nonverbal Behavior.",
      },
    ],
  },
  {
    label: "Health",
    items: [
      {
        titleHtml: "Better <strong>treatment</strong>",
        description: "Doctors miss 3.67 times more diagnoses for unattractive patients",
        source:
          "Tsiga, E., Panagopoulou, E., & Benos, A. (2016). European Journal for Person Centered Healthcare.",
      },
      {
        titleHtml: "Healthier <strong>lifestyle</strong>",
        description: "Activities that make you more attractive are often good for you",
        source: "Arnocky, S., & Davis, A. C. (2024). Frontiers in Psychology.",
      },
      {
        titleHtml: "Longer <strong>lives</strong>",
        description: "Attractive people live longer (perhaps, partially, due to the above reasons)",
        source: "Henderson, J.J.A., & Anglin, J.M. (2003). Evolution and Human Behavior.",
      },
    ],
  },
  {
    label: "Education",
    items: [
      {
        titleHtml: "Better teacher <strong>perceptions</strong>",
        description: "Attractive students are perceived more positively by teachers",
        source:
          "Ritts, V., Patterson, M. L., & Tubbs, M. E. (1992). Review of Educational Research; Talamas, S. N., Mavor, K. I., & Perrett, D. I. (2016). PLoS ONE.",
      },
      {
        titleHtml: "Better student <strong>perceptions</strong>",
        description: "Attractive professors receive stronger student evaluations",
        source: "Theyson, K. C. (2015). Practical Assessment, Research, and Evaluation.",
      },
      {
        titleHtml: "Higher <strong>grades</strong>",
        description: "Attractive students get higher grades in-person than in online classes",
        source:
          "Hernández-Julián, R., & Peters, C. (2017). Journal of Human Capital; Mehic, A. (2022). Economics Letters.",
      },
    ],
  },
  {
    label: "Law",
    items: [
      {
        titleHtml: "Fewer <strong>arrests</strong>",
        description: "Attractive people are less likely to get arrested",
        source:
          "Beaver, K. M., Boccio, C., Smith, S., & Ferguson, C. J. (2019). Psychiatry, Psychology and Law.",
      },
      {
        titleHtml: "Fewer <strong>convictions</strong>",
        description: "Attractive people are less likely to be convicted",
        source:
          "Beaver, K. M., Boccio, C., Smith, S., & Ferguson, C. J. (2019). Psychiatry, Psychology and Law.",
      },
      {
        titleHtml: "Lighter <strong>sentences</strong>",
        description: "If convicted, attractive people are given lighter sentences",
        source: "Mazzella, R., & Feingold, A. (1994). Journal of Applied Social Psychology.",
      },
    ],
  },
  {
    label: "Influence",
    items: [
      {
        titleHtml: "Better <strong>networking</strong>",
        description: "Attractive people build denser social networks",
        source: "O’Connor, K. M., & Gladstone, E. (2018). Social Networks.",
      },
      {
        titleHtml: "More <strong>leadership</strong>",
        description: "Attractive politicians get more votes",
        source: "Jaeger et al. (2021). Social Psychology.",
      },
      {
        titleHtml: "More <strong>promotions</strong>",
        description: "Attractive people are more likely to get promoted",
        source:
          "Morrow, P. C., McElroy, J. C., Stamper, B. G., & Wilson, M. A. (1990). Journal of Management.",
      },
      {
        titleHtml: "More <strong>followers</strong>",
        description: "Attractive people get more favorable social media engagement",
        source:
          "Gladstone, E. C., & O'Connor, K. (2013). Academy of Management Proceedings; Strey, S. (2019). MSc dissertation; Lund University.",
      },
    ],
  },
  {
    label: "Happiness",
    items: [
      {
        titleHtml: "Higher <strong>well-being</strong>",
        description: "Attractive people report higher well-being",
        source: "Datta Gupta, N., Etcoff, N. L., & Jaeger, M. M. (2016). Journal of Happiness Studies.",
      },
      {
        titleHtml: "Lower <strong>mental illness</strong>",
        description: "Mentally healthier people are more attractive, on average",
        source:
          "Farina et al. (1977). Journal of Abnormal Psychology; Borráz-León et al. (2021). Adaptive Human Behavior and Physiology.",
      },
    ],
  },
];

export default function ProgramLanding({
  funnel = "main",
  previewId,
}: {
  funnel?: FunnelVariant;
  previewId?: string;
}) {
  const funnelConfig = getFunnelConfig(funnel);
  const landingAnchorBase = funnelConfig.landingHref;
  const primaryCtaEventName = funnelConfig.landingPrimaryHref.includes("/checkout?")
    ? "checkout_clicked"
    : "landing_cta_clicked";
  const primaryCtaEventParams = {
    funnel,
    cta_label: funnelConfig.landingPrimaryLabel,
    cta_location: "header",
    destination: funnelConfig.landingPrimaryHref,
  };
  const heroCtaEventName = funnelConfig.landingPrimaryHref.includes("/checkout?")
    ? "checkout_clicked"
    : "landing_cta_clicked";
  const heroCtaEventParams = {
    funnel,
    cta_label: funnelConfig.landingSecondaryLabel,
    cta_location: "hero",
    destination: funnelConfig.landingPrimaryHref,
  };
  const footerCtaEventName = funnelConfig.landingPrimaryHref.includes("/checkout?")
    ? "checkout_clicked"
    : "landing_cta_clicked";
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
          <a href={funnelConfig.landingHref} className="program-nav__logo" aria-label="Protocol home">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <mask id="program-logo-mask">
                  <rect width="32" height="32" fill="black" />
                  <circle cx="14" cy="14" r="12" fill="none" stroke="white" strokeWidth="24" />
                </mask>
              </defs>
              <g mask="url(#program-logo-mask)">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M9.11495 19.1086C5.42092 12.6972 5.16924 5.91332 8.55161 3.9569C11.934 1.9993 17.6708 5.61043 21.3649 12.0218C22.8785 14.65 23.8146 17.3407 24.1592 19.7356C25.2647 17.9984 25.9021 15.9571 25.9021 13.7744C25.9021 7.43368 20.5299 2.29395 13.9015 2.29395C7.27441 2.29395 1.90213 7.43368 1.90213 13.7744C1.90213 20.1139 7.27441 25.2536 13.9015 25.2536C14.0039 25.2536 14.1062 25.2524 14.2085 25.2501C12.3715 23.7604 10.5827 21.6554 9.11495 19.1086Z"
                  fill="#233137"
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M24.1592 19.7354C22.1023 22.9658 18.4259 25.1485 14.2085 25.2499C16.9946 27.5104 19.8889 28.353 21.9282 27.1733C23.924 26.0195 24.6543 23.1838 24.1592 19.7354Z"
                  fill="#233137"
                />
              </g>
            </svg>
          </a>
          <nav className="program-nav__links" aria-label="Primary">
            <a href={`${landingAnchorBase}#why-glowup`}>Why Glow-up</a>
            <a href={`${landingAnchorBase}#how-it-works`}>How it works</a>
            <a href={funnelConfig.visualizationHref}>Visualizer</a>
            <a href={`${landingAnchorBase}#faq`}>FAQ</a>
          </nav>
          <div className="program-nav__actions">
            <a href="/login" className="program-nav__login">Login</a>
            <TrackedLink
              href={funnelConfig.landingPrimaryHref}
              className="program-nav__cta"
              eventName={primaryCtaEventName}
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
            <p className="program-hero__eyebrow">Science-Based Body Transformation</p>
            <h1 id="program-hero-title" className="program-hero__title">
              From Skinny Fat <span>to Athletic.</span>
            </h1>
            <p className="program-hero__subtitle">
              Get your personalized body analysis and transformation plan based on 2000+ academic studies.
              Updated every year.
            </p>
            <div className="program-hero__actions">
              <TrackedLink
                href={funnelConfig.landingPrimaryHref}
                className="program-hero__cta"
                eventName={heroCtaEventName}
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
              previewId={previewId}
              defaultBeforeSrc={heroBeforeImage.src}
              defaultAfterSrc={heroAfterImage.src}
            />
          </div>
        </div>
        <div className="program-hero__logos" aria-label="Featured in">
          {HERO_LOGOS.map((logo) => (
            <div key={logo.alt} className="program-hero__logo">
              <Image src={logo.src} alt={logo.alt} width={140} height={44} />
            </div>
          ))}
        </div>
      </section>
      <ResearchImpactSection tabs={RESEARCH_TABS} />
      <NoSurgerySection />
      <SupportSection />
      <MoreScoresSection />
      <TechnologySection />
      <VisualizationSection />
      <StorySection />
      <ExpertsSection />
      <ClientTransformationsSection />
      <NewApproachSection />
      <GaryLinkovQuoteSection />
      <TransformationSection ctaHref={funnelConfig.landingPrimaryHref} ctaLabel={funnelConfig.transformationCtaLabel} funnel={funnel} />
      <ProtocolSection />
      <FollowersSection />
      <AestheticTestsSection />
      <InformativeSection />
      <PersonalizedSection />
      <CompleteFacialAnalysisSection />
      <section className="program-analysis" aria-labelledby="program-analysis-title">
        <div className="program-analysis__shell">
          <header className="program-analysis__header">
            <p className="program-analysis__eyebrow">Body Analysis</p>
            <h2 id="program-analysis-title" className="program-analysis__title">
              Will Analyzing My <span>Body Make Me Feel Worse About Myself?</span>
            </h2>
            <p className="program-analysis__subtitle">
              Most insecurity comes from uncertainty — not knowing if your body can actually change, or if
              you're just stuck like this. When you're guessing, your mind assumes the worst.
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
            Think of it like getting a body composition scan from a sports scientist. The goal isn't to shame you
            — it's to give you the exact data you need to transform.
          </blockquote>
        </div>
      </section>
      <WhySection />
      <ExpertAdviceSection />
      <PricingSection ctaHref={funnelConfig.landingPrimaryHref} ctaLabel={funnelConfig.pricingCtaLabel} funnel={funnel} />
      <FAQSection />
      <footer className="program-footer">
        <div className="program-footer__cta">
          <div>
            <h2 className="program-footer__cta-title">Join Thousands of Men Already Escaping the Skinny-Fat Trap.</h2>
          </div>
          <TrackedLink
            href={funnelConfig.landingPrimaryHref}
            className="program-footer__cta-button"
            eventName={footerCtaEventName}
            eventParams={footerCtaEventParams}
          >
            {funnelConfig.footerCtaLabel}
          </TrackedLink>
        </div>

        <div className="program-footer__main">
          <div className="program-footer__brand">
            <div className="program-footer__mark" aria-hidden="true">
              <svg width="44" height="44" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <mask id="program-footer-logo-mask">
                    <rect width="32" height="32" fill="black" />
                    <circle cx="14" cy="14" r="12" fill="none" stroke="white" strokeWidth="24" />
                  </mask>
                </defs>
                <g mask="url(#program-footer-logo-mask)">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M9.11495 19.1086C5.42092 12.6972 5.16924 5.91332 8.55161 3.9569C11.934 1.9993 17.6708 5.61043 21.3649 12.0218C22.8785 14.65 23.8146 17.3407 24.1592 19.7356C25.2647 17.9984 25.9021 15.9571 25.9021 13.7744C25.9021 7.43368 20.5299 2.29395 13.9015 2.29395C7.27441 2.29395 1.90213 7.43368 1.90213 13.7744C1.90213 20.1139 7.27441 25.2536 13.9015 25.2536C14.0039 25.2536 14.1062 25.2524 14.2085 25.2501C12.3715 23.7604 10.5827 21.6554 9.11495 19.1086Z"
                    fill="currentColor"
                  />
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M24.1592 19.7354C22.1023 22.9658 18.4259 25.1485 14.2085 25.2499C16.9946 27.5104 19.8889 28.353 21.9282 27.1733C23.924 26.0195 24.6543 23.1838 24.1592 19.7354Z"
                    fill="currentColor"
                  />
                </g>
              </svg>
            </div>
            <div className="program-footer__info-block">
              <p className="program-footer__heading">Protocol /</p>
              <a href="mailto:support@protocol-club.com">support@protocol-club.com</a>
            </div>
            <div className="program-footer__info-block">
              <p className="program-footer__heading">Disclaimer /</p>
              <p>
                Some body visualizations are digitally generated to illustrate potential changes. Individual
                results may vary based on consistency and adherence to the protocol.
              </p>
            </div>
          </div>

          <nav className="program-footer__nav" aria-label="Footer">
            <div className="program-footer__column">
              <p className="program-footer__heading">Company /</p>
              <a href={funnelConfig.landingHref}>Products</a>
              <a href={funnelConfig.visualizationHref}>Visualizer</a>
              <a href="/program/resources">Research</a>
              <a href="/program/contact-us.html">Contact Us</a>
              <a href="/program/for-doctors.html">Protocol for Clinics</a>
            </div>
            <div className="program-footer__column">
              <p className="program-footer__heading">Others /</p>
              <a href="/program/legal/privacy-policy">Privacy Policy</a>
              <a href="/program/legal">Terms of Service</a>
            </div>
            <div className="program-footer__column">
              <p className="program-footer__heading">Connect /</p>
              <a href="https://www.linkedin.com/company/qoves" target="_blank" rel="noreferrer">
                LinkedIn
              </a>
              <a href="https://www.youtube.com/@QOVESStudio" target="_blank" rel="noreferrer">
                YouTube
              </a>
              <a href="https://www.instagram.com/qoves" target="_blank" rel="noreferrer">
                Instagram
              </a>
            </div>
          </nav>
        </div>
      </footer>
    </div>
  );
}
