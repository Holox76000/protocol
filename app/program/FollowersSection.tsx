import Image from "next/image";

const FOLLOWERS_CARDS = [
  {
    title: "Recommended by Leading Fitness Scientists",
    description: "Supported by world-renowned experts.",
    image: "/program/static/landing/images/home/experts-think/doctor.webp",
    imageFit: "contain" as const,
    imagePosition: "center center",
  },
  {
    title: "Steroid-Free",
    description: "Effective enhancements, no surgery required.",
    image: "/program/static/landing/images/home/no-surgery/woman-after.webp",
    imageFit: "contain" as const,
    imagePosition: "center center",
  },
  {
    title: "100% Personalised",
    description: "Every recommendation is tailored to you.",
    image: "/program/static/landing/images/home/transformation-protocol/steps.webp",
    imageFit: "contain" as const,
    imagePosition: "center center",
  },
  {
    title: "Science-Backed",
    description: "Backed by research, proven by results.",
    image: "/program/static/landing/images/home/facial-analysis/averageness.webp",
    imageFit: "contain" as const,
    imagePosition: "center center",
  },
];

export default function FollowersSection() {
  return (
    <section className="program-followers" aria-labelledby="program-followers-title">
      <div className="program-followers__inner">
        <aside
          className="program-followers__hero"
          style={{ ["--followers-bg" as string]: "url(/program/static/landing/images/home/features-grid/background.webp)" }}
        >
          <div className="program-followers__hero-top">
            <p className="program-followers__num">2M+</p>
            <p className="program-followers__label">Followers</p>
          </div>
          <h2 id="program-followers-title" className="program-followers__hero-copy">
            <span>The world&apos;s largest</span> male body transformation science community.
          </h2>
        </aside>

        <div className="program-followers__grid">
          {FOLLOWERS_CARDS.map((card) => (
            <article key={card.title} className="program-followers__card">
              <div className="program-followers__media">
                <Image
                  src={card.image}
                  alt=""
                  fill
                  sizes="(max-width: 767px) 100vw, (max-width: 1099px) 50vw, 33vw"
                  style={{ objectFit: card.imageFit, objectPosition: card.imagePosition }}
                />
              </div>
              <div className="program-followers__text">
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
