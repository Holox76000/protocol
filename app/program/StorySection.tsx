import Image from "next/image";

const STORY_CARDS = [
  {
    number: "01",
    prefix: "Why ",
    emphasis: "skinny-fat",
    suffix: " happens: your body stores fat preferentially around the belly while staying flat in the chest and shoulders — a hormonal and training pattern we can reverse.",
  },
  {
    number: "02",
    prefix: "Most skinny-fat men have ",
    emphasis: "undertrained upper bodies",
    suffix:
      " and overtrained with cardio — creating a soft, undefined look that neither bulk nor cut fixes alone.",
  },
  {
    number: "03",
    prefix: "The ",
    emphasis: "chest-to-waist ratio",
    suffix:
      " is the #1 visual signal of male attractiveness — and it's the exact ratio we optimize in your protocol.",
  },
  {
    number: "04",
    prefix: "Your ",
    emphasis: "belly fat",
    suffix:
      " isn't just cosmetic — visceral fat signals hormonal imbalance that directly impacts testosterone levels and muscle-building capacity.",
  },
  {
    number: "05",
    prefix: "Most guys attack the ",
    emphasis: "symptom",
    suffix:
      " (belly fat) and ignore the cause (undertrained frame, poor muscle-to-fat ratio) — that's why nothing works long-term.",
  },
  {
    number: "06",
    prefix: "Why ",
    emphasis: "skinny-fat",
    suffix: " happens: your body stores fat preferentially around the belly while staying flat in the chest and shoulders — a hormonal and training pattern we can reverse.",
  },
  {
    number: "07",
    prefix: "Most skinny-fat men have ",
    emphasis: "undertrained upper bodies",
    suffix:
      " and overtrained with cardio — creating a soft, undefined look that neither bulk nor cut fixes alone.",
  },
  {
    number: "08",
    prefix: "The ",
    emphasis: "chest-to-waist ratio",
    suffix:
      " is the #1 visual signal of male attractiveness — and it's the exact ratio we optimize in your protocol.",
  },
  {
    number: "09",
    prefix: "Your ",
    emphasis: "belly fat",
    suffix:
      " isn't just cosmetic — visceral fat signals hormonal imbalance that directly impacts testosterone levels and muscle-building capacity.",
  },
  {
    number: "10",
    prefix: "Most guys attack the ",
    emphasis: "symptom",
    suffix:
      " (belly fat) and ignore the cause (undertrained frame, poor muscle-to-fat ratio) — that's why nothing works long-term.",
  },
];

export default function StorySection() {
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
            Learn about why your body stores fat and lacks muscle —
            <br />
            and exactly what to do about it.
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
