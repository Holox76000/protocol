import Image from "next/image";
import bellyCompositionImage from "../../belly-composition.png";
import bodyFatDistributionImage from "../../body-fat-distribution.png";
import chestStructureImage from "../../chest-structure.png";
import coreStrengthIndicatorsImage from "../../core-strength-indicators.png";
import generalMorphologyImage from "../../general-morphology.png";
import hormoneImage from "../../hormone.png";
import muscleSymmetryImage from "../../muscle-symmetry.png";
import postureFrameImage from "../../posture-frame.png";
import ribCageImage from "../../rib-cage.png";
import skinImage from "../../skin.png";
import upperBodyDevelopmentImage from "../../upper-body-development.png";

const TEST_CATEGORIES = [
  {
    title: "General Morphology",
    image: generalMorphologyImage.src,
    tests: [
      "Frame width classification",
      "Bone structure profile",
      "Waist-to-shoulder visual balance",
      "Limb proportion check",
      "Torso length analysis",
      "Leg-to-torso ratio review",
      "Overall symmetry screen",
      "Athletic build potential score",
    ],
  },
  {
    title: "Chest Structure",
    image: chestStructureImage.src,
    tests: [
      "Upper chest fullness",
      "Lower chest softness",
      "Sternum depth check",
      "Clavicle spread estimate",
      "Pectoral insertion pattern",
      "Left-right pec balance",
      "Nipple line symmetry",
      "Rib flare visibility",
      "Chest fat accumulation pattern",
      "Pressing response potential",
      "Posture effect on chest look",
      "Push-up baseline strength",
    ],
  },
  {
    title: "Shoulder-to-Waist Ratio",
    image: bodyFatDistributionImage.src,
    tests: [
      "Current V-taper ratio",
      "Deltoid width potential",
      "Lat flare potential",
      "Waist tightness score",
      "Oblique thickness review",
      "Shoulder posture effect",
      "Upper back width estimate",
      "Visual taper projection",
      "Taper after fat loss estimate",
      "Taper after muscle gain estimate",
    ],
  },
  {
    title: "Belly Composition",
    image: bellyCompositionImage.src,
    tests: [
      "Lower belly fat concentration",
      "Upper belly softness",
      "Bloating pattern review",
      "Visceral fat indicators",
      "Ab definition visibility",
      "Waist control score",
      "Digestive stress signals",
      "Core tension baseline",
    ],
  },
  {
    title: "Posture & Frame",
    image: postureFrameImage.src,
    tests: [
      "Forward shoulder severity",
      "Pelvic tilt screening",
      "Rounded upper-back score",
      "Neck alignment check",
      "Rib cage position review",
      "Standing posture baseline",
      "Walking gait posture cues",
      "Frame presentation score",
    ],
  },
  {
    title: "Body Fat Distribution",
    image: bodyFatDistributionImage.src,
    tests: [
      "Chest fat storage",
      "Waist fat storage",
      "Love handle prominence",
      "Lower back fat pattern",
      "Glute-fat storage pattern",
      "Thigh fat storage pattern",
      "Arm leanness score",
      "Leanness bottleneck zone",
    ],
  },
  {
    title: "Core Strength Indicators",
    image: coreStrengthIndicatorsImage.src,
    tests: [
      "Bracing control score",
      "Abdominal wall tension",
      "Rotation stability baseline",
      "Hip stability pattern",
      "Lower back compensation risk",
      "Plank endurance estimate",
      "Core fatigue markers",
      "Strength carryover potential",
    ],
  },
  {
    title: "Hormonal Profile Markers",
    image: hormoneImage.src,
    tests: [
      "Low-testosterone visual markers",
      "High-stress recovery markers",
      "Sleep deprivation markers",
      "Inflammation indicators",
      "Water retention cues",
      "Energy regulation clues",
      "Metabolic slowdown clues",
      "Recovery capacity estimate",
    ],
  },
  {
    title: "Muscle Symmetry",
    image: muscleSymmetryImage.src,
    tests: [
      "Left-right shoulder balance",
      "Arm size symmetry",
      "Chest symmetry",
      "Lat symmetry",
      "Waist symmetry",
      "Quad symmetry",
      "Glute symmetry",
      "Calf symmetry",
    ],
  },
  {
    title: "Upper Body Development",
    image: upperBodyDevelopmentImage.src,
    tests: [
      "Deltoid development",
      "Upper chest development",
      "Lat width score",
      "Trap dominance review",
      "Arm fullness score",
      "Back thickness estimate",
      "Upper body maturity score",
      "Most lagging muscle group",
    ],
  },
  {
    title: "Lower Chest / Rib Cage",
    image: ribCageImage.src,
    tests: [
      "Lower chest shape",
      "Rib cage width",
      "Rib flare severity",
      "Lower pec insertion pattern",
      "Chest-to-waist transition",
      "Vacuum potential",
      "Breathing mechanics clues",
      "Thoracic expansion baseline",
    ],
  },
  {
    title: "Skin & Subcutaneous Fat",
    image: skinImage.src,
    tests: [
      "Skin tightness baseline",
      "Subcutaneous fat thickness",
      "Water retention visibility",
      "Texture consistency",
      "Inflammation markers",
      "Stretch mark review",
      "Cellulite visibility",
      "Skin quality improvement potential",
    ],
  },
] as const;

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

function ProtocolMark() {
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
          <ProtocolMark />
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
            <details key={item.title} className="program-tests__row">
              <summary className="program-tests__summary">
                <div className="program-tests__row-main">
                  <div className="program-tests__thumb">
                    <Image src={item.image} alt="" fill sizes="64px" />
                  </div>
                  <h3 className="program-tests__row-title">{item.title}</h3>
                </div>
                <div className="program-tests__row-side">
                  <p className="program-tests__count">{item.tests.length} Tests Included</p>
                  <span className="program-tests__plus" aria-hidden="true">
                    +
                  </span>
                </div>
              </summary>
              <div className="program-tests__content">
                <ul className="program-tests__list">
                  {item.tests.map((test) => (
                    <li key={test} className="program-tests__list-item">
                      <span className="program-tests__list-dot" aria-hidden="true" />
                      <span>{test}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
