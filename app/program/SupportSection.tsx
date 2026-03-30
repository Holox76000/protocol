import Image from "next/image";
import closingNoteImage from "../../closing-note.png";
import protocolChatImage from "../../protocol-tchat.png";

const SUPPORT_CARDS = [
  {
    title: "Ask Any <strong>Question to our Team</strong>",
    description:
      "You'll have direct access to our team—just open the chat on your dashboard for concerns, questions, or clarification.",
    background: "/program/static/landing/images/home/support-system/bg-1.webp",
    image: protocolChatImage,
    imageFit: "contain" as const,
  },
  {
    title: "Get your <strong>Aesthetic Note</strong>",
    description:
      "You'll get an aesthetic letter detailing your protocol, progress observations, and recommendations, all with scientific context.",
    background: "/program/static/landing/images/home/support-system/bg-2.webp",
    image: closingNoteImage,
    imageFit: "contain" as const,
  },
  {
    title: "Lifetime <strong>Tracking</strong>",
    description:
      "We track your progress continuously, with lifetime monitoring. You can rebook an analysis whenever you like to ensure you maintain your results and stay the best-looking version of yourself for years to come.",
    background: "/program/static/landing/images/home/support-system/bg-3.webp",
    image: "/program/static/landing/images/home/support-system/image-3.webp",
    imageFit: "contain" as const,
  },
];

export default function SupportSection() {
  return (
    <section className="program-support" aria-labelledby="program-support-title">
      <div className="program-support__inner">
        <header className="program-support__header">
          <h2 id="program-support-title" className="program-support__title">
            The Support <span>System</span>
          </h2>
        </header>

        <div className="program-support__grid">
          {SUPPORT_CARDS.map((card) => (
            <article key={card.title} className="program-support__card">
              <div className="program-support__visual">
                <Image
                  className="program-support__visual-bg"
                  src={card.background}
                  alt=""
                  fill
                  sizes="(max-width: 767px) 100vw, (max-width: 1099px) 50vw, 33vw"
                />
                <div className="program-support__visual-fade" />
                <Image
                  className="program-support__visual-image"
                  src={card.image}
                  alt=""
                  fill
                  sizes="(max-width: 767px) 100vw, (max-width: 1099px) 50vw, 33vw"
                  style={{ objectFit: card.imageFit }}
                />
              </div>
              <div className="program-support__content">
                <h3 dangerouslySetInnerHTML={{ __html: card.title }} />
                <p>{card.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
