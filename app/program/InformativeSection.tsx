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
    image: "/program/static/landing/images/home/informative/informative-2.webp",
  },
  {
    title: "The harmony of your physique",
    description: "How your chest-to-waist ratio, posture, and muscle distribution work together.",
    image: "/program/static/landing/images/home/informative/informative-3.webp",
  },
  {
    title: "Your zones with the most potential",
    description: "Where you can see the fastest visible change.",
    image: "/program/static/landing/images/home/informative/informative-4.webp",
  },
  {
    title: "The science underlying your protocol",
    description: "Peer-reviewed explanations for every recommendation we make.",
    image: "/program/static/landing/images/home/informative/informative-5.webp",
  },
];

export default function InformativeSection() {
  return (
    <section className="program-informative" aria-labelledby="program-informative-title">
      <div className="program-informative__shell">
        <header className="program-informative__header">
          <p className="program-informative__eyebrow">Informative</p>
          <h2 id="program-informative-title" className="program-informative__title">
            You will learn...
          </h2>
        </header>

        <div className="program-informative__panel">
          {INFORMATIVE_ITEMS.map((item) => (
            <article key={item.title} className="program-informative__item">
              <div className="program-informative__image-wrap">
                <Image src={item.image} alt="" fill sizes="140px" className="program-informative__image" />
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
