const OLD_WAY_STEPS = [
  "Fixates on One Feature",
  "Visit a Clinic",
  "No Assessment",
  "Unnecessary Surgery",
  "Poor Results",
];

const NEW_WAY_STEPS = [
  "Focus on Overall Body Proportions",
  "Protocol Analysis",
  "See Your Future Self",
  "Personalised Protocol",
  "Real Results, No Surgery",
];

function CrossIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
      <path d="M21.5 8.5L8.5 21.5M8.5 8.5L21.5 21.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
      <path d="M22 10.5L13.25 19.25L9 15" stroke="url(#program-approach-check)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <defs>
        <linearGradient id="program-approach-check" x1="15.5" y1="10.5" x2="15.5" y2="19.25" gradientUnits="userSpaceOnUse">
          <stop stopColor="#9AAEB5" />
          <stop offset="1" stopColor="#CDDBE1" />
        </linearGradient>
      </defs>
    </svg>
  );
}

type ApproachCardProps = {
  tone: "old" | "new";
  title: string;
  steps: string[];
};

function ApproachCard({ tone, title, steps }: ApproachCardProps) {
  const isNew = tone === "new";

  return (
    <article className={`program-approach__card program-approach__card--${tone}`}>
      <div className="program-approach__card-title">
        <div className={`program-approach__icon program-approach__icon--${tone}`}>{isNew ? <CheckIcon /> : <CrossIcon />}</div>
        <h3>{title}</h3>
      </div>
      <div className="program-approach__rail">
        {steps.map((step, index) => (
          <div key={step} className="program-approach__step">
            <div className="program-approach__step-top">
              <div className="program-approach__step-number">{index + 1}</div>
              {index < steps.length - 1 ? <div className="program-approach__step-line" aria-hidden="true" /> : null}
            </div>
            <p>{step}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

export default function NewApproachSection() {
  return (
    <section className="program-approach" aria-labelledby="program-approach-title">
      <div className="program-approach__inner">
        <header className="program-approach__header">
          <p className="program-approach__eyebrow">New Approach</p>
          <h2 id="program-approach-title" className="program-approach__title">
            A New Way to <span>Glow-Up</span>
          </h2>
          <p className="program-approach__subtitle">
            Studies show your body influence almost everything, from your career to your romantic life.
            Unfortunately, most people waste effort on &quot;improvements&quot; that don&apos;t fit their unique morphology.
          </p>
        </header>

        <div className="program-approach__cards">
          <ApproachCard tone="old" title="The Old Way" steps={OLD_WAY_STEPS} />
          <ApproachCard tone="new" title="The New Way" steps={NEW_WAY_STEPS} />
        </div>
      </div>
    </section>
  );
}
