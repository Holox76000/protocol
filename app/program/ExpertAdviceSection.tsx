import Image from "next/image";
import beforeSevenImage from "../../7-before.png";
import afterSevenImage from "../../7-after.png";

const ADVICE_STEPS = [
  { number: "01/", title: "Get your expert body analysis" },
  { number: "02/", title: "Visualize your target physique" },
  { number: "03/", title: "Get your personalized body protocol" },
  { number: "04/", title: "Track your progress and transform your body" },
];

export default function ExpertAdviceSection() {
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
            <article className="program-advice__card">
              <span className="program-advice__label">Before</span>
              <div className="program-advice__image">
                <Image
                  src={beforeSevenImage}
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
              <div className="program-advice__connector-box program-advice__connector-box--bottom" />
            </div>
            <article className="program-advice__card">
              <span className="program-advice__label">After</span>
              <div className="program-advice__image">
                <Image
                  src={afterSevenImage}
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
