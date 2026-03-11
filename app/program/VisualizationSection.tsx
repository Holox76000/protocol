import Image from "next/image";
import dynamic from "next/dynamic";
import visualizationBeforeImage from "../../1-before.png";
import visualizationAfterImage from "../../1-after.png";
import realisticVisualisationImage from "../../realistic-visualisation.png";
import visualizeYourResultsImage from "../../visualize-your-results.png";
import withoutSteroidsImage from "../../without-steroids.png";

const BeforeAfterSlider = dynamic(() => import("./BeforeAfterSlider"), { ssr: false });

const VISUALIZATION_CARDS = [
  {
    image: realisticVisualisationImage,
    title: "Realistic Visualisation",
    description:
      "Our technology gives you a realistic preview of what your body looks like after your 12-week transformation.",
  },
  {
    image: withoutSteroidsImage,
    title: "Achievable Without Steroids",
    description: "Every transformation we showcase is 100% natural and achievable.",
  },
  {
    image: "/program/static/landing/images/home/visualization/image-3.webp",
    title: "Body-Type Aware",
    description:
      "We account for your specific skinny-fat phenotype, rejecting one-size-fits-all programs.",
  },
  {
    image: visualizeYourResultsImage,
    title: "Visualize Your Results Before You Start",
    description: "It's like seeing the finish line before the race.",
  },
];

export default function VisualizationSection() {
  return (
    <section className="program-visualization" aria-labelledby="program-visualization-title">
      <div className="program-visualization__inner">
        <header className="program-visualization__header">
          <p className="program-visualization__eyebrow">Visualization</p>
          <h2 id="program-visualization-title" className="program-visualization__title">
            Ever wondered what your body could look like?
          </h2>
          <div className="program-visualization__divider" aria-hidden="true" />
          <h3 className="program-visualization__subtitle">
            See Your <span>Future Body</span>
          </h3>
        </header>

        <div className="program-visualization__content">
          <BeforeAfterSlider
            className="program-visualization__slider"
            subject="Future you"
            beforeSrc={visualizationBeforeImage.src}
            afterSrc={visualizationAfterImage.src}
            beforePosition="50% 46%"
            afterPosition="50% 46%"
            beforeScale={1}
            beforeTranslateX="0%"
          />

          <div className="program-visualization__cards">
            {VISUALIZATION_CARDS.map((card) => (
              <article key={card.title} className="program-visualization__card">
                <div className="program-visualization__card-image">
                  <Image src={card.image} alt="" width={130} height={88} />
                </div>
                <div className="program-visualization__card-copy">
                  <h4>{card.title}</h4>
                  <p>{card.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
