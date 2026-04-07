import Image from "next/image";

export type ClientTransformationItem = {
  id: string;
  beforeSrc: string;
  afterSrc: string;
};

const DEFAULT_CLIENT_TRANSFORMATIONS: ClientTransformationItem[] = [
  { id: "custom-1", beforeSrc: "/assets/1-before.png", afterSrc: "/assets/1-after.png" },
  { id: "custom-2", beforeSrc: "/assets/2-before.png", afterSrc: "/assets/2-after.png" },
  { id: "custom-3", beforeSrc: "/assets/17-before.png", afterSrc: "/assets/17-after.png" },
  { id: "custom-4", beforeSrc: "/assets/15-before.png", afterSrc: "/assets/15-after.png" },
  { id: "custom-5", beforeSrc: "/assets/5-before.png", afterSrc: "/assets/5-after.png" },
  { id: "custom-6", beforeSrc: "/assets/6-before.png", afterSrc: "/assets/6-after.png" },
  { id: "custom-7", beforeSrc: "/assets/7-before.png", afterSrc: "/assets/7-after.png" },
  { id: "custom-8", beforeSrc: "/assets/8-before.png", afterSrc: "/assets/8-after.png" },
  { id: "custom-9", beforeSrc: "/assets/16-before.png", afterSrc: "/assets/16-after.png" },
  { id: "custom-10", beforeSrc: "/assets/18-before.png", afterSrc: "/assets/18-after.png" },
  { id: "custom-14", beforeSrc: "/assets/14-before.png", afterSrc: "/assets/14-after.png" },
];

export default function ClientTransformationsSection({
  items = DEFAULT_CLIENT_TRANSFORMATIONS,
}: {
  items?: ClientTransformationItem[];
}) {
  return (
    <section className="program-social-proof" aria-labelledby="program-social-proof-title">
      <div className="program-social-proof__inner">
        <header className="program-social-proof__header">
          <p className="program-social-proof__eyebrow">Client transformations</p>
          <h2 id="program-social-proof-title" className="program-social-proof__title">
            Real Transformations By
            <span>Protocol Clients</span>
          </h2>
          <p className="program-social-proof__subtitle">
            Our clients achieve remarkable, surgery-free transformations every day.
            <br />
            Here are a few of them.
          </p>
        </header>

        <div className="program-social-proof__grid">
          {items.map((item) => (
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
