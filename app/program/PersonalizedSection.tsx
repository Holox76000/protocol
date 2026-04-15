import Image from "next/image";

const PERSONALIZED_ITEMS = [
  {
    title: "Fat distribution pattern",
    description: "Shapes your silhouette and perceived proportions.",
    image: "/program/static/landing/images/home/personalized/personalized-1.webp",
  },
  {
    title: "Social environment",
    description: "Your social circle and lifestyle define your attractiveness context.",
    image: "/program/static/landing/images/home/personalized/personalized-2.webp",
  },
  {
    title: "Hormonal baseline & age",
    description: "Affects muscle retention, fat distribution, and skin quality.",
    image: "/program/static/landing/images/home/personalized/personalized-3.webp",
  },
  {
    title: "Diet, stress, sleep, and habits",
    description: "Impact body composition and appearance beyond training alone.",
    image: "/program/static/landing/images/home/personalized/personalized-4.webp",
  },
  {
    title: "Physique goals (athletic, lean, muscular)",
    description: "The same body optimized differently depending on your goal.",
    image: "/program/static/landing/images/home/personalized/personalized-5.webp",
  },
  {
    title: "Genetic predispositions to fat storage",
    description: "Determines where fat accumulates first and comes off last.",
    image: "/program/static/landing/images/home/personalized/personalized-6.webp",
  },
];

export default function PersonalizedSection() {
  return (
    <section className="program-personalized" aria-labelledby="program-personalized-title">
      <div className="program-personalized__shell">
        <header className="program-personalized__header">
          <h2 id="program-personalized-title" className="program-personalized__title">
            Taking into account your...
          </h2>
        </header>

        <div className="program-personalized__panel">
          {PERSONALIZED_ITEMS.map((item) => (
            <article key={item.title} className="program-personalized__item">
              <div className="program-personalized__image-wrap">
                <Image src={item.image} alt="" fill sizes="140px" className="program-personalized__image" />
              </div>
              <div className="program-personalized__copy">
                <h3 className="program-personalized__item-title">{item.title}</h3>
                <p className="program-personalized__item-description">{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
