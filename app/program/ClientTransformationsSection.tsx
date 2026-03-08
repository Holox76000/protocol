import Image from "next/image";

const CLIENT_TRANSFORMATIONS = Array.from({ length: 10 }, (_, index) => {
  const item = index + 1;
  return {
    id: String(item),
    beforeSrc: `/program/static/landing/images/home/client-transformations/${item}-before.webp`,
    afterSrc: `/program/static/landing/images/home/client-transformations/${item}-after.webp`,
  };
});

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
