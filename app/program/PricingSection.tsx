import Image from "next/image";
import type { FunnelVariant } from "../../lib/funnels";
import TrackedLink from "../tracked-link";

const PRICING_FEATURES = [
  {
    title: "Complete body composition analysis",
    description: "Get an in-depth breakdown of your body composition, proportions, and weak points.",
    featured: false,
  },
  {
    title: "Personalized 12-week recomposition protocol",
    description: "Receive a step-by-step plan on how to improve your body aesthetics.",
    featured: true,
  },
  {
    title: "Body metrics scores and progress tracking",
    description: "Understand your current body metrics and track your progress over time.",
    featured: false,
  },
  {
    title: "Before-and-after visualization of your transformation target",
    description: "See what your body could accurately look like after your transformation.",
    featured: false,
  },
  {
    title: "Ask our team any questions",
    description: "Ask any questions to our team directly from your dashboard.",
    featured: false,
  },
];

const PAYMENT_LOGOS = [
  { src: "/program/static/landing/images/home/pricing/visa.webp", alt: "Visa", width: 60, height: 20 },
  { src: "/program/static/landing/images/home/pricing/mastercard.webp", alt: "Mastercard", width: 42, height: 20 },
  { src: "/program/static/landing/images/home/pricing/stripe.webp", alt: "Stripe", width: 52, height: 20 },
  { src: "/program/static/landing/images/home/pricing/paypal.webp", alt: "PayPal", width: 22, height: 20 },
  { src: "/program/static/landing/images/home/pricing/amazon.webp", alt: "Amazon", width: 52, height: 20 },
  { src: "/program/static/landing/images/home/pricing/applepay.webp", alt: "Apple Pay", width: 20, height: 20 },
];

const PRICING_ASSURANCES = [
  {
    title: "No Questions Asked\nMoney-Back Guarantee",
    description:
      "Try it risk-free. If you’re not satisfied, request a refund within 14 days of receiving your order — no hassle.",
    icon: "spark" as const,
  },
  {
    title: "Secure Payment\nProcessing",
    description: "No hidden fees.",
    icon: "lock" as const,
  },
  {
    title: "Your Data Is\nPrivate & Safe",
    description: "Your images and data are secure and confidential.",
    icon: "shield" as const,
  },
];

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 21" fill="none" aria-hidden="true">
      <path d="M16.667 5.45117L7.50033 14.6178L3.33366 10.4512" stroke="#1B7C3A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path d="M4.75 11H17.25M17.25 11L11 4.75M17.25 11L11 17.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AssuranceIcon({ icon }: { icon: "spark" | "lock" | "shield" }) {
  if (icon === "lock") {
    return (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <path
          d="M9.33333 12.8333V9.91667C9.33333 7.33934 11.4227 5.25 14 5.25C16.5773 5.25 18.6667 7.33934 18.6667 9.91667V12.8333M8.16667 12.8333H19.8333C20.4777 12.8333 21 13.3557 21 14V20.4167C21 21.061 20.4777 21.5833 19.8333 21.5833H8.16667C7.52233 21.5833 7 21.061 7 20.4167V14C7 13.3557 7.52233 12.8333 8.16667 12.8333Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (icon === "shield") {
    return (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <path
          d="M14 4.6665L20.4167 7.58317V13.1258C20.4167 17.0202 17.7107 20.6492 14 21.5832C10.2893 20.6492 7.58334 17.0202 7.58334 13.1258V7.58317L14 4.6665Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M11.6667 13.9998L13.4167 15.7498L16.9167 12.2498"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <path
        d="M14 5.8335L15.9436 11.0564L21.1665 13L15.9436 14.9436L14 20.1665L12.0564 14.9436L6.8335 13L12.0564 11.0564L14 5.8335Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function PricingSection({
  ctaHref,
  ctaLabel,
  funnel,
}: {
  ctaHref: string;
  ctaLabel: string;
  funnel: FunnelVariant;
}) {
  const eventName = ctaHref.includes("/checkout?") ? "checkout_clicked" : "landing_cta_clicked";

  return (
    <section className="program-pricing" aria-labelledby="program-pricing-title">
      <div className="program-pricing__inner">
        <header className="program-pricing__header">
          <p className="program-pricing__eyebrow">Pricing</p>
          <h2 id="program-pricing-title" className="program-pricing__title">
            What personal trainers charge <span>$300/month</span> for is $19
          </h2>
          <p className="program-pricing__subtitle">Summer Body Prep — one simple payment. No hidden fees.</p>
        </header>

        <div className="program-pricing__panel">
          <div className="program-pricing__features">
            {PRICING_FEATURES.map((feature) => (
              <article
                key={feature.title}
                className={`program-pricing__feature${feature.featured ? " program-pricing__feature--featured" : ""}`}
              >
                <div className="program-pricing__feature-icon">
                  <CheckIcon />
                </div>
                <div className="program-pricing__feature-copy">
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="program-pricing__membership-wrap">
            <div className="program-pricing__membership">
              <div className="program-pricing__membership-top">
                <h3>
                  Body Analysis +
                  <span>Body transformation protocol</span>
                </h3>
              </div>
              <div className="program-pricing__membership-bottom">
                <p className="program-pricing__price">
                  <span className="program-pricing__price-old">$39</span>
                  <strong>$19</strong>
                  <span>one-time</span>
                </p>
                <div className="program-pricing__divider" />
                <p className="program-pricing__note">No hidden fees. One-time payment.</p>
                <TrackedLink
                  href={ctaHref}
                  className="program-pricing__cta"
                  eventName={eventName}
                  eventParams={{
                    funnel,
                    cta_label: ctaLabel,
                    cta_location: "pricing_section",
                    destination: ctaHref,
                  }}
                >
                  <span>{ctaLabel}</span>
                  <span className="program-pricing__cta-sep" aria-hidden="true" />
                  <ArrowIcon />
                </TrackedLink>
              </div>
            </div>

            <div className="program-pricing__payments">
              <span>Supported:</span>
              <div className="program-pricing__payments-logos">
                {PAYMENT_LOGOS.map((logo) => (
                  <div key={logo.alt} className="program-pricing__payment-logo">
                    <Image src={logo.src} alt={logo.alt} width={logo.width} height={logo.height} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="program-pricing__assurances">
          {PRICING_ASSURANCES.map((item) => (
            <article key={item.title} className="program-pricing__assurance">
              <div className="program-pricing__assurance-icon">
                <AssuranceIcon icon={item.icon} />
              </div>
              <h3 className="program-pricing__assurance-title">
                {item.title.split("\n").map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </h3>
              <p className="program-pricing__assurance-copy">{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
