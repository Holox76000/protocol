const TRANSFORMATION_STEPS = [
  { number: "1", label: ["Answer Questions", "About Your Body"] },
  { number: "2", label: ["Upload Front & Side", "Photos"] },
  { number: "3", label: ["Our Team Builds", "Your Protocol"] },
  { number: "4", label: ["Start Your 12-Week", "Recomposition"] },
];

export default function TransformationSection({ ctaHref, ctaLabel }: { ctaHref: string; ctaLabel: string }) {
  return (
    <section className="program-transformation" aria-labelledby="program-transformation-title">
      <div className="program-transformation__inner">
        <div className="program-transformation__panel">
          <div className="program-transformation__hero">
            <div className="program-transformation__copy">
              <h2 id="program-transformation-title" className="program-transformation__title">
                Get Your $19 <span>Body Analysis Today</span>
              </h2>
            </div>
            <a href={ctaHref} className="program-transformation__cta">
              <span>{ctaLabel}</span>
              <span className="program-transformation__cta-separator" aria-hidden="true" />
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M5 12H19M19 12L13 6M19 12L13 18"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>
          <div className="program-transformation__steps" aria-label="Transformation steps">
            {TRANSFORMATION_STEPS.map((step, index) => (
              <div key={step.number} className="program-transformation__step">
                <div className="program-transformation__step-top">
                  <span className="program-transformation__step-number">{step.number}</span>
                  {index < TRANSFORMATION_STEPS.length - 1 ? (
                    <span className="program-transformation__step-line" aria-hidden="true" />
                  ) : null}
                </div>
                <p>
                  {step.label.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
