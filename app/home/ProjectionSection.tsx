"use client";


type Props = {
  signupHref: string;
};

export default function ProjectionSection({ signupHref }: Props) {
  return (
    <section className="projection-section f1-section">
      <div className="projection-section__inner">
        <div className="projection-section__header">
          <p className="projection-section__eyebrow">The projection principle</p>
          <h2 className="projection-section__title">
            See yourself at your<br />
            <span>peak potential and reach it.</span>
          </h2>
          <p className="projection-section__sub">
            Protocol starts with a question no fitness program asks:{" "}
            <strong>what image do you want to project?</strong>{" "}
            Your protocol is calibrated to that answer — not just to generic muscle gain.
          </p>
        </div>

        <a href={signupHref} className="projection-section__cta">
          Define my projection — $89 →
        </a>
      </div>
    </section>
  );
}
