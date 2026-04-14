import Image from "next/image";

const PERSONALIZED_ITEMS = [
  {
    title: "Body type & fat distribution pattern",
    description: "Considers unique body traits, proportions, and patterns common to your demographic.",
    image: "/program/static/landing/images/home/personalized/personalized-1.webp",
  },
  {
    title: "Social environment context",
    description: "Takes into account your individual aesthetic style.",
    image: "/program/static/landing/images/home/personalized/personalized-2.webp",
  },
  {
    title: "Hormonal baseline & age",
    description: "Considers how skin, bone, and fat distribution change over time.",
    image: "/program/static/landing/images/home/personalized/personalized-3.webp",
  },
  {
    title: "Diet, stress, sleep, and habits",
    description: "Considers diet, climate, stress, sleep, and habits.",
    image: "/program/static/landing/images/home/personalized/personalized-4.webp",
  },
  {
    title: "Physique goals (athletic, lean, muscular)",
    description: "Adapts to regional and societal ideals.",
    image: "/program/static/landing/images/home/personalized/personalized-5.webp",
  },
  {
    title: "Genetic predispositions to fat storage",
    description: "Takes into account genetic factors and how they might impact your body aesthetics.",
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
