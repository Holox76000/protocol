import Image from "next/image";

export default function ExpertsSection() {
  return (
    <section className="program-experts" aria-labelledby="program-experts-quote">
      <div className="program-experts__inner">
        <div className="program-experts__image">
          <Image
            src="/program/static/landing/images/home/experts-think/dr-ashkenazi.png"
            alt="Dr Sven Ashkenazi"
            width={520}
            height={640}
          />
        </div>

        <div className="program-experts__content">
          <p className="program-experts__eyebrow">What experts think about Protocol</p>
          <blockquote id="program-experts-quote" className="program-experts__quote">
            “I am excited to be partnering with Protocol, an innovative state of the art body analysis system
            that I believe represents the future of personalized body transformation.”
          </blockquote>
          <div className="program-experts__author">
            <p className="program-experts__name">
              Dr Sven <span>Ashkenazi</span>
            </p>
            <p className="program-experts__bio">
              Dr. Ashkenazi is known for combining aesthetic judgment with a modern, evidence-aware view of body
              transformation and presentation.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
