import Image from "next/image";
import customBeforeOne from "../../1-before.png";
import customAfterOne from "../../1-after.png";
import customBeforeTwo from "../../2-before.png";
import customAfterTwo from "../../2-after.png";
import customBeforeThree from "../../3-before.png";
import customAfterThree from "../../3-after.png";
import customBeforeFour from "../../4-before.png";
import customAfterFour from "../../4-after.png";
import customBeforeFive from "../../5-before.png";
import customAfterFive from "../../5-after.png";
import customBeforeSix from "../../6-before.png";
import customAfterSix from "../../6-after.png";
import customBeforeSeven from "../../7-before.png";
import customAfterSeven from "../../7-after.png";
import customBeforeEight from "../../8-before.png";
import customAfterEight from "../../8-after.png";
import customBeforeNine from "../../9-before.png";
import customAfterNine from "../../9-after.png";
import customBeforeTen from "../../10-before.png";
import customAfterTen from "../../10-after.png";

const CLIENT_TRANSFORMATIONS = [
  {
    id: "custom-1",
    beforeSrc: customBeforeOne.src,
    afterSrc: customAfterOne.src,
  },
  {
    id: "custom-2",
    beforeSrc: customBeforeTwo.src,
    afterSrc: customAfterTwo.src,
  },
  {
    id: "custom-3",
    beforeSrc: customBeforeThree.src,
    afterSrc: customAfterThree.src,
  },
  {
    id: "custom-4",
    beforeSrc: customBeforeFour.src,
    afterSrc: customAfterFour.src,
  },
  {
    id: "custom-5",
    beforeSrc: customBeforeFive.src,
    afterSrc: customAfterFive.src,
  },
  {
    id: "custom-6",
    beforeSrc: customBeforeSix.src,
    afterSrc: customAfterSix.src,
  },
  {
    id: "custom-7",
    beforeSrc: customBeforeSeven.src,
    afterSrc: customAfterSeven.src,
  },
  {
    id: "custom-8",
    beforeSrc: customBeforeEight.src,
    afterSrc: customAfterEight.src,
  },
  {
    id: "custom-9",
    beforeSrc: customBeforeNine.src,
    afterSrc: customAfterNine.src,
  },
  {
    id: "custom-10",
    beforeSrc: customBeforeTen.src,
    afterSrc: customAfterTen.src,
  },
  {
    id: "6",
    beforeSrc: "/program/static/landing/images/home/client-transformations/6-before.webp",
    afterSrc: "/program/static/landing/images/home/client-transformations/6-after.webp",
  },
];

export default function ClientTransformationsSection() {
  return (
    <section className="program-social-proof" aria-labelledby="program-social-proof-title">
      <div className="program-social-proof__inner">
        <header className="program-social-proof__header">
          <p className="program-social-proof__eyebrow">Client transformations</p>
          <h2 id="program-social-proof-title" className="program-social-proof__title">
            Real Transformations By
            <span>Qoves™ Clients</span>
          </h2>
          <p className="program-social-proof__subtitle">
            Our clients achieve remarkable, surgery-free transformations every day.
            <br />
            Here are a few of them.
          </p>
        </header>

        <div className="program-social-proof__grid">
          {CLIENT_TRANSFORMATIONS.map((item) => (
            <article key={item.id} className="program-social-proof__card">
              <div className="program-social-proof__pair">
                <div className="program-social-proof__image-wrap">
                  <Image src={item.beforeSrc} alt={`Client transformation ${item.id} before`} fill sizes="(max-width: 900px) 100vw, 50vw" />
                </div>
                <div className="program-social-proof__image-wrap">
                  <Image src={item.afterSrc} alt={`Client transformation ${item.id} after`} fill sizes="(max-width: 900px) 100vw, 50vw" />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
