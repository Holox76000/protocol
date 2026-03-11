import Image from "next/image";
import analysisCardImage from "../../analysis-card.png";
import technologyCard3Image from "../../technology-card3.png";

const TECHNOLOGY_CARDS = [
  {
    title: "Clinical-grade analysis.",
    description:
      "We use precise body composition metrics and morphological ratios to assess your chest, waist, shoulders and belly — delivering a detailed, accurate physique analysis.",
    image: "/program/images/home/the-technology/medical-grade-analysis.png",
    imagePosition: "center center",
  },
  {
    title: "Unmatched Personalization",
    description:
      "We consider your age, training history, body type, lifestyle, and goals. Every transformation plan is unique.",
    image: "/program/images/home/the-technology/unmatched-personalization.png",
    imagePosition: "center top",
  },
  {
    title: "Evidence-Based Approach",
    description:
      "We use measurable body composition data and peer-reviewed research — not Instagram bro-science.",
    image: technologyCard3Image,
    imagePosition: "center center",
  },
  {
    title: "The Science of Male Physique",
    description:
      "Our database analyzes body composition science across thousands of cases to find what works for your specific body type.",
    image: analysisCardImage,
    imagePosition: "center 18%",
  },
];

export default function TechnologySection() {
  return (
    <section className="program-tech" aria-labelledby="program-tech-title">
      <div className="program-tech__frame">
        <header className="program-tech__header">
          <p className="program-tech__eyebrow">Informative</p>
          <h2 id="program-tech-title" className="program-tech__title">
            The Technology
            <span>Behind Your Transformation</span>
          </h2>
          <p className="program-tech__subtitle">
            Our analysis and expertise create a personalized, science-backed plan —
            <span>no guesswork, no bro-science, just a clear protocol to eliminate your</span>
            <span>skinny-fat physique for good.</span>
          </p>
        </header>

        <div className="program-tech__grid">
          {TECHNOLOGY_CARDS.map((card) => (
            <article key={card.title} className="program-tech__card">
              <div className="program-tech__image">
                <Image
                  src={card.image}
                  alt=""
                  fill
                  sizes="(max-width: 767px) 100vw, (max-width: 1099px) 50vw, 25vw"
                  style={{ objectFit: "cover", objectPosition: card.imagePosition }}
                />
              </div>
              <div className="program-tech__overlay" />
              <div className="program-tech__content">
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
