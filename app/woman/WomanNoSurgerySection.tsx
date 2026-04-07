import Image from "next/image";

const CASES = [
  {
    before: "/assets/woman-1-before.png",
    after: "/assets/woman-1-after.png",
    duration: "12 Weeks",
    items: [
      {
        title: "Waist tightening strategy",
        description: "Nutrition, steps, and training adjustments to create a tighter midsection without crash dieting.",
      },
      {
        title: "Glute-focused training",
        description: "A structured lower-body plan to build fuller glutes and make the whole physique look more sculpted.",
      },
      {
        title: "Posture and upper-body shaping",
        description: "Targeted work to improve posture, shoulder carriage, and the overall balance of your silhouette.",
      },
    ],
  },
  {
    before: "/assets/woman-2-before.png",
    after: "/assets/woman-2-after.png",
    duration: "6 Months",
    items: [
      {
        title: "Leg shaping protocol",
        description: "Lower-body programming designed to create a more athletic, balanced look over time.",
      },
      {
        title: "Waist-to-hip enhancement",
        description: "A smarter body-recomposition strategy that improves proportions instead of chasing scale weight.",
      },
      {
        title: "Sustainable body recomposition",
        description: "Changes that fit real life and keep working long after the first few weeks.",
      },
    ],
  },
];

const TIMELINE_ITEMS = [
  { label: "Initial results", value: "2 weeks" },
  { label: "Full transformation", value: "6 months" },
];

export default function WomanNoSurgerySection() {
  return (
    <section className="program-no-surgery" aria-labelledby="program-no-surgery-title">
      <div className="program-no-surgery__inner">
        <header className="program-no-surgery__header">
          <h2 id="program-no-surgery-title" className="program-no-surgery__title">
            No extremes. No <span>surgery.</span>
          </h2>
          <p className="program-no-surgery__subtitle">
            Our recommendations are built around natural body recomposition and realistic changes you can sustain.
          </p>
        </header>

        <div className="program-no-surgery__cases">
          {CASES.map((item) => (
            <article key={item.duration + item.before} className="program-no-surgery__case">
              <div className="program-no-surgery__shell">
                <div className="program-no-surgery__compare">
                  <div className="program-no-surgery__photo">
                    <Image src={item.before} alt="" fill sizes="(max-width: 767px) 100vw, 50vw" />
                  </div>
                  <div className="program-no-surgery__photo">
                    <Image src={item.after} alt="" fill sizes="(max-width: 767px) 100vw, 50vw" />
                  </div>
                </div>
                <div className="program-no-surgery__divider">
                  <span />
                  <p>{item.duration}</p>
                  <span />
                </div>
                <div className="program-no-surgery__list">
                  {item.items.map((listItem) => (
                    <div key={listItem.title} className="program-no-surgery__list-item">
                      <h3>{listItem.title}</h3>
                      <span className="program-no-surgery__arrow" aria-hidden="true">
                        <svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M18 8.16113L22 12.1611M22 12.1611L18 16.1611M22 12.1611H2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      <p>{listItem.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="program-no-surgery__bottom">
          <div className="program-no-surgery__timeline">
            <p className="program-no-surgery__timeline-title">
              Real results from the <span>comfort of your home.</span>
            </p>
            <div className="program-no-surgery__timeline-card">
              {TIMELINE_ITEMS.map((item) => (
                <div key={item.label} className="program-no-surgery__timeline-row">
                  <p>{item.label}</p>
                  <p>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <blockquote className="program-no-surgery__quote">
            <div className="program-no-surgery__quote-image">
              <Image
                src="/program/static/landing/images/home/no-surgery/doctor.webp"
                alt="Jonathan Zelken, MD"
                fill
                sizes="96px"
              />
            </div>
            <div className="program-no-surgery__quote-copy">
              <p className="program-no-surgery__quote-mark" aria-hidden="true">“</p>
              <p className="program-no-surgery__quote-text">
                Protocol removes the confusion and replaces it with a credible, personalized body-transformation path.
              </p>
              <p className="program-no-surgery__quote-author">Jonathan Zelken, MD</p>
            </div>
          </blockquote>
        </div>
      </div>
    </section>
  );
}
