import Image from "next/image";

const INFORMATIVE_ITEMS = [
  {
    title: "Your body composition biometrics",
    description: "Your current scores and your realistic transformation potential.",
    image: "/program/static/landing/images/home/informative/informative-1.webp",
  },
  {
    title: "How each body zone impacts your overall look",
    description: "Detailed breakdown of chest, shoulders, waist, and belly.",
    image: "/assets/front-analysis.png",
  },
  {
    title: "The harmony of your body",
    description: "How your chest-to-waist ratio, posture, and muscle distribution work together.",
    image: "/assets/profil-analysis.png",
  },
  {
    title: "Your zones with the most potential",
    description: "Where you can see the fastest visible change.",
    image: "/assets/analysis-screenshot.png",
  },
];

export default function InformativeSection() {
  return (
    <section className="program-informative" aria-labelledby="program-informative-title" style={{ paddingTop: "80px" }}>
      <div className="program-informative__shell">
        <header className="program-informative__header">
          <p className="program-informative__eyebrow">Informative</p>
          <h2 id="program-informative-title" className="program-informative__title">
            You will improve...
          </h2>
        </header>

        <div className="program-informative__panel">
          {INFORMATIVE_ITEMS.map((item) => (
            <article key={item.title} className="program-informative__item">
              <div className="program-informative__image-wrap">
                <Image
                  src={item.image}
                  alt=""
                  fill
                  sizes="140px"
                  className="program-informative__image"
                  style={{ objectFit: "cover", transform: item.image.includes("analysis-screenshot") ? "scale(0.97)" : "none", transformOrigin: "center" }}
                />
              </div>
              <div className="program-informative__copy">
                <h3 className="program-informative__item-title">{item.title}</h3>
                <p className="program-informative__item-description">{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
