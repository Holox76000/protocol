import Image from "next/image";

const ADVICE_STEPS = [
  { number: "01/", title: "Get your expert body analysis" },
  { number: "02/", title: "Visualize your target physique" },
  { number: "03/", title: "Get your personalized body protocol" },
  { number: "04/", title: "Track your progress and transform your body" },
];

type ExpertAdviceSectionProps = {
  beforeSrc?: string;
  afterSrc?: string;
};

export default function ExpertAdviceSection({
  beforeSrc = "/assets/7-before.png",
  afterSrc = "/assets/7-after.png",
}: ExpertAdviceSectionProps = {}) {
  return (
    <section className="program-advice" aria-labelledby="program-advice-title">
      <div className="program-advice__inner">
        <header className="program-advice__header">
          <p className="program-advice__eyebrow">Expert Advice Enhanced by Technology</p>
          <h2 id="program-advice-title" className="program-advice__title">
            Get a Proven <span>Protocol</span> Plan
          </h2>
          <p className="program-advice__subtitle">
            Understand your body composition and start your transformation today
            <span>with a proven action plan—no surgery needed.</span>
          </p>
        </header>

        <div className="program-advice__visual-shell">
          <div className="program-advice__visual">
            <div className="program-advice__orbit" aria-hidden="true">
              <svg viewBox="0 0 1000 420" preserveAspectRatio="none">
                <path
                  className="program-advice__orbit-path"
                  d="M24 8H336C349.255 8 360 18.745 360 32V210H640V32C640 18.745 650.745 8 664 8H976C989.255 8 1000 18.745 1000 32V388C1000 401.255 989.255 412 976 412H664C650.745 412 640 401.255 640 388V210H360V388C360 401.255 349.255 412 336 412H24C10.745 412 0 401.255 0 388V32C0 18.745 10.745 8 24 8Z"
                />
                <circle className="program-advice__orbit-dot" r="6">
                  <animateMotion
                    dur="22.5s"
                    repeatCount="indefinite"
                    rotate="auto"
                    path="M24 8H336C349.255 8 360 18.745 360 32V210H640V32C640 18.745 650.745 8 664 8H976C989.255 8 1000 18.745 1000 32V388C1000 401.255 989.255 412 976 412H664C650.745 412 640 401.255 640 388V210H360V388C360 401.255 349.255 412 336 412H24C10.745 412 0 401.255 0 388V32C0 18.745 10.745 8 24 8Z"
                  />
                </circle>
              </svg>
            </div>
            <article className="program-advice__card">
              <span className="program-advice__label">Before</span>
              <div className="program-advice__image">
                <Image
                  src={beforeSrc}
                  alt="Before Protocol plan"
                  fill
                  sizes="(max-width: 767px) 100vw, (max-width: 1099px) 42vw, 28vw"
                  style={{ objectFit: "cover", objectPosition: "center center" }}
                />
              </div>
            </article>
            <div className="program-advice__connector" aria-hidden="true">
              <div className="program-advice__connector-box program-advice__connector-box--top" />
              <div className="program-advice__connector-line" />
              <span className="program-advice__connector-dot" />
              <div className="program-advice__connector-box program-advice__connector-box--bottom" />
            </div>
            <article className="program-advice__card">
              <span className="program-advice__label">After</span>
              <div className="program-advice__image">
                <Image
                  src={afterSrc}
                  alt="After Protocol plan"
                  fill
                  sizes="(max-width: 767px) 100vw, (max-width: 1099px) 42vw, 28vw"
                  style={{ objectFit: "cover", objectPosition: "center center" }}
                />
              </div>
            </article>
          </div>
        </div>

        <div className="program-advice__steps-shell">
          <div className="program-advice__steps">
            {ADVICE_STEPS.map((step, index) => (
              <div key={step.number} className="program-advice__step-wrap">
                <article className="program-advice__step">
                  <p className="program-advice__step-number">{step.number}</p>
                  <p className="program-advice__step-title">{step.title}</p>
                </article>
                {index < ADVICE_STEPS.length - 1 ? (
                  <div className="program-advice__step-arrow" aria-hidden="true">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
