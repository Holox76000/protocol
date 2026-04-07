import Image from "next/image";

const NO_SURGERY_CASES = [
  {
    before: "/assets/14-before.png",
    after: "/assets/14-after.png",
    duration: "12 Weeks",
    items: [
      {
        title: "Chest development protocol",
        description:
          "Targeted pressing movements to build upper chest thickness and create a powerful, masculine silhouette",
      },
      {
        title: "Shoulder width protocol",
        description: "Lateral raises and overhead press programming to broaden your frame and create a V-taper",
      },
      {
        title: "Belly fat reduction",
        description: "Caloric and training strategy to strip the soft layer covering your abs without losing muscle",
      },
    ],
  },
  {
    before: "/assets/8-before.png",
    after: "/assets/8-after.png",
    duration: "6 Months",
    items: [
      {
        title: "Glute growth protocol",
        description:
          "Lower-body training and progressive overload designed to build fuller glutes and create a more athletic silhouette.",
      },
      {
        title: "Waist tightening strategy",
        description: "Nutrition and training adjustments to reduce softness around the waist and improve overall proportions.",
      },
      {
        title: "Leg shaping protocol",
        description:
          "Targeted lower-body work to build more defined legs and create a balanced, toned look.",
      },
    ],
  },
];

const TIMELINE_ITEMS = [
  { label: "Initial results", value: "2 weeks" },
  { label: "Full transformation", value: "6 months" },
];

export default function NoSurgerySection() {
  return (
    <section className="program-no-surgery" aria-labelledby="program-no-surgery-title">
      <div className="program-no-surgery__inner">
        <header className="program-no-surgery__header">
          <h2 id="program-no-surgery-title" className="program-no-surgery__title">
            No steroids. No <span>surgery.</span>
          </h2>
          <p className="program-no-surgery__subtitle">
            All of our recommendations are 100% natural. Dramatic recomposition is possible without any of that.
          </p>
        </header>

        <div className="program-no-surgery__cases">
          {NO_SURGERY_CASES.map((item) => (
            <article key={item.duration} className="program-no-surgery__case">
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
                Protocol is disruptive and eliminates so much of the bluster in the aesthetics space.
              </p>
              <p className="program-no-surgery__quote-author">Jonathan Zelken, MD</p>
            </div>
          </blockquote>
        </div>
      </div>
    </section>
  );
}
