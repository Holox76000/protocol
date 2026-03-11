import Image from "next/image";
import bodyFatDistributionScoreImage from "../../body-fat-distribution copie.png";

const SCORE_CARDS = [
  { src: "/program/static/landing/images/home/more-score/card-1.webp", alt: "Skin score" },
  { src: "/program/static/landing/images/home/more-score/card-3.webp", alt: "Lips score" },
  { src: "/program/static/landing/images/home/more-score/card-2.webp", alt: "Cheek score" },
  { src: "/program/static/landing/images/home/more-score/card-4.webp", alt: "Eyebrow score" },
  { src: "/program/static/landing/images/home/more-score/card-5.webp", alt: "Jaw score" },
  { src: "/program/static/landing/images/home/more-score/card-6.webp", alt: "Eye score" },
];

export default function MoreScoresSection() {
  return (
    <section className="program-more-scores" aria-labelledby="program-more-scores-title">
      <div className="program-more-scores__shell">
        <div className="program-more-scores__stage">
          <div className="program-more-scores__bg">
            <Image
              src="/program/static/landing/images/home/more-score/bg.webp"
              alt=""
              fill
              sizes="100vw"
              style={{ objectFit: "cover" }}
            />
          </div>

          <div className="program-more-scores__cards">
            {SCORE_CARDS.slice(0, 3).map((card, index) => (
              <div key={card.src} className={`program-more-scores__card program-more-scores__card--left-${index + 1}`}>
                <Image src={card.src} alt={card.alt} fill sizes="(max-width: 767px) 44vw, 20vw" />
              </div>
            ))}

            <div className="program-more-scores__main">
              <Image
                src={bodyFatDistributionScoreImage}
                alt="Body fat distribution score improvement over time"
                fill
                sizes="(max-width: 767px) 92vw, (max-width: 1099px) 78vw, 58vw"
              />
            </div>

            {SCORE_CARDS.slice(3).map((card, index) => (
              <div key={card.src} className={`program-more-scores__card program-more-scores__card--right-${index + 1}`}>
                <Image src={card.src} alt={card.alt} fill sizes="(max-width: 767px) 44vw, 20vw" />
              </div>
            ))}
          </div>
        </div>

        <header className="program-more-scores__header">
          <p className="program-more-scores__eyebrow">And 30+ more scores</p>
          <h2 id="program-more-scores-title" className="program-more-scores__title">
            Track Your Progress &amp;
            <span>Predict the Future</span>
          </h2>
          <p className="program-more-scores__subtitle">
            Track your progress over time and see how different changes,
            <span>products or treatment improve your appearance.</span>
          </p>
        </header>
      </div>
    </section>
  );
}
