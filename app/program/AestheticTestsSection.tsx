import Image from "next/image";

const TEST_CATEGORIES = [
  {
    title: "General Morphology",
    count: 8,
    image: "/program/static/landing/images/home/aesthetics-tests/face-shape.webp",
  },
  {
    title: "Chest Structure",
    count: 14,
    image: "/program/static/landing/images/home/aesthetics-tests/eyebrows.webp",
  },
  {
    title: "Shoulder-to-Waist Ratio",
    count: 26,
    image: "/program/static/landing/images/home/aesthetics-tests/eyes.webp",
  },
  {
    title: "Belly Composition",
    count: 17,
    image: "/program/static/landing/images/home/aesthetics-tests/nose.webp",
  },
  {
    title: "Posture & Frame",
    count: 16,
    image: "/program/static/landing/images/home/aesthetics-tests/lips.webp",
  },
  {
    title: "Body Fat Distribution",
    count: 13,
    image: "/program/static/landing/images/home/aesthetics-tests/cheeks.webp",
  },
  {
    title: "Core Strength Indicators",
    count: 11,
    image: "/program/static/landing/images/home/aesthetics-tests/jaw.webp",
  },
  {
    title: "Hormonal Profile Markers",
    count: 8,
    image: "/program/static/landing/images/home/aesthetics-tests/chin.webp",
  },
  {
    title: "Muscle Symmetry",
    count: 13,
    image: "/program/static/landing/images/home/aesthetics-tests/smile.webp",
  },
  {
    title: "Upper Body Development",
    count: 11,
    image: "/program/static/landing/images/home/aesthetics-tests/neck.webp",
  },
  {
    title: "Lower Chest / Rib Cage",
    count: 12,
    image: "/program/static/landing/images/home/aesthetics-tests/ear.webp",
  },
  {
    title: "Skin & Subcutaneous Fat",
    count: 20,
    image: "/program/static/landing/images/home/aesthetics-tests/skin.webp",
  },
];

function MetaIcon({ kind }: { kind: "home" | "annual" }) {
  if (kind === "home") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M8 4h6l2 2v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M14 4v3h3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M10 11h4M10 14h3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 17V7M6 17h12M6 17l3-3 2 1 4-5 3 2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function QovesMark() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className="program-tests__mark">
      <path
        d="M16 3.5C9.64873 3.5 4.5 8.64873 4.5 15C4.5 21.3513 9.64873 26.5 16 26.5C17.8136 26.5 19.5292 26.0798 21.0546 25.3323L24.5 28.7777L28.7426 24.535L25.2393 21.0317C26.3626 19.3053 27 17.2446 27 15C27 8.64873 21.8513 3.5 15.5 3.5H16Z"
        fill="#22343B"
      />
      <path
        d="M14.6975 4.12109C11.8651 4.12109 9.47461 6.29733 9.47461 9.98913C9.47461 15.0084 13.8985 21.9356 19.689 25.3626C18.6303 25.8737 17.4419 26.1613 16.1864 26.1613C9.52878 26.1613 4.13281 20.7653 4.13281 14.1077C4.13281 7.45008 9.52878 2.05411 16.1864 2.05411C19.5193 2.05411 22.5362 3.40793 24.7207 5.59246C23.058 4.66688 21.0319 4.12109 18.8442 4.12109H14.6975Z"
        fill="#EEF4F4"
      />
    </svg>
  );
}

export default function AestheticTestsSection() {
  return (
    <section className="program-tests" aria-labelledby="program-tests-title">
      <div className="program-tests__shell">
        <header className="program-tests__header">
          <QovesMark />
          <h2 id="program-tests-title" className="program-tests__title">
            <span>100+</span> Body Composition Tests
          </h2>
          <p className="program-tests__subtitle">The following assessments are included in your analysis.</p>
          <div className="program-tests__meta">
            <div className="program-tests__meta-item">
              <span className="program-tests__meta-icon">
                <MetaIcon kind="home" />
              </span>
              <span>From home</span>
            </div>
            <div className="program-tests__meta-item">
              <span className="program-tests__meta-icon">
                <MetaIcon kind="annual" />
              </span>
              <span>Tested 1x a year</span>
            </div>
          </div>
        </header>

        <div className="program-tests__panel">
          {TEST_CATEGORIES.map((item) => (
            <article key={item.title} className="program-tests__row">
              <div className="program-tests__row-main">
                <div className="program-tests__thumb">
                  <Image src={item.image} alt="" fill sizes="64px" />
                </div>
                <h3 className="program-tests__row-title">{item.title}</h3>
              </div>
              <div className="program-tests__row-side">
                <p className="program-tests__count">{item.count} Tests Available</p>
                <span className="program-tests__plus" aria-hidden="true">
                  +
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
