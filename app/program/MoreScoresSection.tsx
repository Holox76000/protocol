import Image from "next/image";
import type { CSSProperties } from "react";

const SCORE_CARDS = [
  { src: "/program/static/landing/images/home/more-score/card-1.webp", alt: "Skin score", ratio: "687 / 536" },
  { src: "/program/static/landing/images/home/more-score/card-3.webp", alt: "Lips score", ratio: "687 / 536" },
  { src: "/program/static/landing/images/home/more-score/card-4.webp", alt: "Eyebrow score", ratio: "687 / 536" },
  { src: "/program/static/landing/images/home/more-score/card-5.webp", alt: "Jaw score", ratio: "550 / 429" },
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
            <div className="program-more-scores__main">
              <Image
                src="/assets/body-fat-distribution copie.png"
                alt="Body fat distribution score improvement over time"
                fill
                sizes="(max-width: 767px) 92vw, (max-width: 1099px) 78vw, 58vw"
              />
            </div>

            <div className="program-more-scores__rail" aria-label="Additional score previews">
              {SCORE_CARDS.slice(0, 2).map((card, index) => (
                <div
                  key={card.src}
                  className={`program-more-scores__card program-more-scores__card--left-${index + 1}`}
                  style={{ "--card-ratio": card.ratio } as CSSProperties}
                >
                  <Image src={card.src} alt={card.alt} fill sizes="(max-width: 767px) 78vw, 20vw" />
                </div>
              ))}

              {SCORE_CARDS.slice(2).map((card, index) => (
                <div
                  key={card.src}
                  className={`program-more-scores__card program-more-scores__card--right-${index + 1}`}
                  style={{ "--card-ratio": card.ratio } as CSSProperties}
                >
                  <Image src={card.src} alt={card.alt} fill sizes="(max-width: 767px) 78vw, 20vw" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <header className="program-more-scores__header">
          <p className="program-more-scores__eyebrow">And 30+ more scores</p>
          <h2 id="program-more-scores-title" className="program-more-scores__title">
            Track Your Progress &amp;{" "}
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
