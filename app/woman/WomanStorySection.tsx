import Image from "next/image";

const STORY_CARDS = [
  {
    number: "01",
    prefix: "Why ",
    emphasis: "softness settles in stubborn areas",
    suffix:
      " like the lower belly, waist, arms, or hips: your training, recovery, and hormone environment shape where your body stores fat.",
  },
  {
    number: "02",
    prefix: "Many women have ",
    emphasis: "underbuilt glutes and shoulders",
    suffix:
      " from generic cardio-heavy routines, which leaves the whole body looking less sculpted than it could.",
  },
  {
    number: "03",
    prefix: "The ",
    emphasis: "waist-to-hip and shoulder balance",
    suffix:
      " strongly affects how toned, athletic, and feminine your physique reads, and it can be trained much more strategically.",
  },
  {
    number: "04",
    prefix: "Lower-belly and waist ",
    emphasis: "softness",
    suffix:
      " are not just aesthetic frustrations. They often reflect stress load, inconsistent training stimulus, sleep, and nutrition patterns.",
  },
  {
    number: "05",
    prefix: "Most women attack the ",
    emphasis: "symptom",
    suffix:
      " instead of the structure. Endless cardio and random workouts rarely fix the proportions underneath.",
  },
  {
    number: "06",
    prefix: "Why ",
    emphasis: "definition stalls",
    suffix:
      " even when you are trying hard: the body needs the right combination of stimulus, recovery, and nutrition, not just more effort.",
  },
  {
    number: "07",
    prefix: "Many women are ",
    emphasis: "training hard but not shaping strategically",
    suffix:
      " which is why they get tired, not transformed.",
  },
  {
    number: "08",
    prefix: "The right plan improves ",
    emphasis: "shape, posture, and proportions",
    suffix:
      " at the same time, so the whole body starts reading more lifted, tighter, and more balanced.",
  },
  {
    number: "09",
    prefix: "Your ",
    emphasis: "current body pattern",
    suffix:
      " is not random. It is readable, and once it is readable, it becomes much easier to change.",
  },
  {
    number: "10",
    prefix: "What matters most is replacing ",
    emphasis: "guesswork",
    suffix:
      " with a protocol built around your frame, goals, and lifestyle.",
  },
];

export default function WomanStorySection() {
  return (
    <section className="program-story" aria-labelledby="program-story-title">
      <div className="program-story__inner">
        <div className="program-story__copy">
          <h2 id="program-story-title" className="program-story__title">
            Your Body Tells
            <br />
            Your <span>Story</span>
          </h2>
          <p className="program-story__subtitle">
            Learn why your body stores softness where it does,
            <br />
            and exactly how to create a more sculpted shape.
          </p>
        </div>

        <div className="program-story__map">
          <Image
            src="/program/static/landing/images/home/ancestors-story/map.webp"
            alt="World map"
            width={1541}
            height={936}
          />
        </div>
      </div>

      <div className="program-story__marquee">
        <div className="program-story__track">
          {[0, 1].map((groupIndex) => (
            <div className="program-story__group" key={groupIndex} aria-hidden={groupIndex === 1}>
              {STORY_CARDS.map((card) => (
                <article className="program-story__card" key={`${groupIndex}-${card.number}`}>
                  <p className="program-story__card-number">{card.number}</p>
                  <p className="program-story__card-text">
                    {card.prefix}
                    <strong>{card.emphasis}</strong>
                    {card.suffix}
                  </p>
                </article>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
