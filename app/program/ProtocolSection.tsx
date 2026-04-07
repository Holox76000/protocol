import Image from "next/image";

const PROTOCOL_FEATURES = [
  "Full breakdown of what to train, eat, and supplement — specific to your body",
  "Realistic body visualizations showing your transformation target",
  "Multiple protocol options based on your schedule and lifestyle",
  "Ask any questions directly to your transformation team via chat",
];

export default function ProtocolSection({
  interfaceSrc = "/assets/interface.png",
}: {
  interfaceSrc?: string | { src: string };
}) {
  const resolvedInterfaceSrc = typeof interfaceSrc === "string" ? interfaceSrc : interfaceSrc.src;

  return (
    <section className="program-protocol" aria-labelledby="program-protocol-title">
      <div className="program-protocol__inner">
        <header className="program-protocol__header">
          <p className="program-protocol__eyebrow">Transformation protocol</p>
          <h2 id="program-protocol-title" className="program-protocol__title">
            Simply Follow Your Plan
            <span>Watch Your Body Transform</span>
          </h2>
          <p className="program-protocol__subtitle">
            We provide you with a detailed transformation plan, giving you
            <span>the exact steps to improve your appearance without any surgeries.</span>
          </p>
        </header>

        <div className="program-protocol__canvas">
          <div className="program-protocol__main-frame">
            <Image
              src={resolvedInterfaceSrc}
              alt="Protocol dashboard"
              fill
              sizes="(max-width: 767px) 100vw, 92vw"
            />
          </div>
        </div>

        <div className="program-protocol__bottom">
          <div className="program-protocol__copy">
            <h3>
              Reach your full
              <span>physical potential</span>
            </h3>
            <p>
              We provide you with a detailed body recomposition protocol based on
              <strong> 2000+ </strong>
              academic studies.
            </p>
          </div>

          <div className="program-protocol__list-shell">
            <ul className="program-protocol__list">
              {PROTOCOL_FEATURES.map((feature) => (
                <li key={feature}>
                  <span className="program-protocol__check" aria-hidden="true">
                    <svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16.6666 5.45117L7.49992 14.6178L3.33325 10.4512" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <p>{feature}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
