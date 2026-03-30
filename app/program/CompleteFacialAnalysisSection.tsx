import Image from "next/image";
import manImage from "../../man.png";

const ANALYSIS_CARDS = [
  {
    image: "/program/static/landing/images/home/facial-analysis/smoothness.webp",
    modifier: "program-complete-analysis__card--smoothness",
  },
  {
    image: "/program/static/landing/images/home/facial-analysis/facial-third.webp",
    modifier: "program-complete-analysis__card--thirds",
  },
  {
    image: "/program/static/landing/images/home/facial-analysis/averageness.webp",
    modifier: "program-complete-analysis__card--average",
  },
  {
    image: "/program/static/landing/images/home/facial-analysis/scatterplot.webp",
    modifier: "program-complete-analysis__card--scatter",
  },
  {
    image: "/program/static/landing/images/home/facial-analysis/colors-chart.webp",
    modifier: "program-complete-analysis__card--colors",
  },
  {
    image: "/program/static/landing/images/home/facial-analysis/bellcurve.webp",
    modifier: "program-complete-analysis__card--bell",
  },
  {
    image: "/program/static/landing/images/home/facial-analysis/symmetrical.webp",
    modifier: "program-complete-analysis__card--symmetry",
  },
];

export default function CompleteFacialAnalysisSection() {
  return (
    <section className="program-complete-analysis" aria-labelledby="program-complete-analysis-title">
      <div className="program-complete-analysis__shell">
        <header className="program-complete-analysis__header">
          <p className="program-complete-analysis__eyebrow">Body Analysis</p>
          <h2 id="program-complete-analysis-title" className="program-complete-analysis__title">
            Your Complete <span>Body Analysis</span>
          </h2>
          <p className="program-complete-analysis__subtitle">
            Every body is unique. We analyze over 100 aspects of your body to understand your personal body
            aesthetics.
          </p>
        </header>

        <div
          className="program-complete-analysis__stage program-complete-analysis__stage--desktop"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(187, 206, 214, 0.28) 0%, rgba(171, 192, 201, 0.7) 100%), url('/program/static/landing/images/home/facial-analysis/background.webp')",
          }}
        >
          <article className={`program-complete-analysis__card ${ANALYSIS_CARDS[0].modifier}`}>
            <Image src={ANALYSIS_CARDS[0].image} alt="" fill className="program-complete-analysis__card-art" sizes="430px" />
          </article>

          <article className={`program-complete-analysis__card ${ANALYSIS_CARDS[1].modifier}`}>
            <Image src={ANALYSIS_CARDS[1].image} alt="" fill className="program-complete-analysis__card-art" sizes="530px" />
          </article>

          <article className={`program-complete-analysis__card ${ANALYSIS_CARDS[2].modifier}`}>
            <Image src={ANALYSIS_CARDS[2].image} alt="" fill className="program-complete-analysis__card-art" sizes="430px" />
          </article>

          <article className={`program-complete-analysis__card ${ANALYSIS_CARDS[3].modifier}`}>
            <Image src={ANALYSIS_CARDS[3].image} alt="" fill className="program-complete-analysis__card-art" sizes="430px" />
          </article>

          <div className="program-complete-analysis__portrait">
            <Image
              src={manImage}
              alt="Body analysis portrait"
              fill
              sizes="760px"
              className="program-complete-analysis__portrait-image"
            />
          </div>

          <article className={`program-complete-analysis__card ${ANALYSIS_CARDS[4].modifier}`}>
            <Image src={ANALYSIS_CARDS[4].image} alt="" fill className="program-complete-analysis__card-art" sizes="430px" />
          </article>

          <article className={`program-complete-analysis__card ${ANALYSIS_CARDS[5].modifier}`}>
            <Image src={ANALYSIS_CARDS[5].image} alt="" fill className="program-complete-analysis__card-art" sizes="430px" />
          </article>

          <article className={`program-complete-analysis__card ${ANALYSIS_CARDS[6].modifier}`}>
            <Image src={ANALYSIS_CARDS[6].image} alt="" fill className="program-complete-analysis__card-art" sizes="430px" />
          </article>
        </div>

        <div
          className="program-complete-analysis__stage program-complete-analysis__stage--mobile"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(187, 206, 214, 0.18) 0%, rgba(171, 192, 201, 0.34) 100%)",
          }}
        >
          <div className="program-complete-analysis__portrait-panel">
            <div className="program-complete-analysis__portrait">
              <Image
                src={manImage}
                alt="Body analysis portrait"
                width={manImage.width}
                height={manImage.height}
                sizes="(max-width: 767px) 88vw, (max-width: 1280px) 70vw, 760px"
                className="program-complete-analysis__portrait-image"
              />
            </div>
          </div>

          <div className="program-complete-analysis__mobile-cards">
            {ANALYSIS_CARDS.map((card) => (
              <article key={card.image} className={`program-complete-analysis__card ${card.modifier}`}>
                <Image
                  src={card.image}
                  alt=""
                  fill
                  className="program-complete-analysis__card-art"
                  sizes="(max-width: 767px) 44vw, (max-width: 1280px) 32vw, 430px"
                />
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
