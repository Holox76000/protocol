import Image from "next/image";

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


      </div>
    </section>
  );
}
