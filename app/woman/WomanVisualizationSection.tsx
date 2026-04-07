import Image from "next/image";
import dynamic from "next/dynamic";

const BeforeAfterSlider = dynamic(() => import("../program/BeforeAfterSlider"), { ssr: false });

const VISUALIZATION_CARDS = [
  {
    image: "/assets/realistic-visualisation.png",
    title: "Realistic Visualization",
    description: "Preview a tighter, more sculpted body based on your real frame and proportions.",
  },
  {
    image: "/assets/without-steroids.png",
    title: "Achievable Naturally",
    description: "Everything we recommend is designed to be attainable without extremes or shortcuts.",
  },
  {
    image: "/program/static/landing/images/home/visualization/image-3.webp",
    title: "Built Around Your Shape",
    description: "We account for your current fat distribution, structure, and lifestyle instead of guessing.",
  },
  {
    image: "/assets/visualize-your-results.png",
    title: "See the Outcome First",
    description: "A realistic preview gives you a concrete target instead of another vague promise.",
  },
];

export default function WomanVisualizationSection() {
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
            See Your <span>Future Shape</span>
          </h3>
        </header>

        <div className="program-visualization__content">
          <BeforeAfterSlider
            className="program-visualization__slider"
            subject="Future you"
            beforeSrc="/assets/woman-2-before.png"
            afterSrc="/assets/woman-2-after.png"
            beforePosition="50% 48%"
            afterPosition="50% 48%"
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
