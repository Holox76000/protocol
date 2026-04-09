"use client";

const FAQ_GROUPS = [
  {
    title: "Results & Timeline",
    items: [
      {
        question: "How long does it take to see visible results?",
        answer:
          "Most men notice early changes in the first few weeks when they fix sleep, protein intake, training structure, and daily activity. More dramatic body recomposition usually takes a few months of consistent execution.",
      },
      {
        question: "Can I really get results without surgery or steroids?",
        answer:
          "Yes. Protocol is built around natural body transformation: training, nutrition, recovery, supplementation, posture, and smart lifestyle changes. That is enough for the vast majority of men to transform their physique.",
      },
      {
        question: "Can I see what my body could look like?",
        answer:
          "Yes. Alongside your protocol, we provide a realistic visualization of what your body could look like with the recommended changes so you have a clear target to work toward.",
      },
      {
        question: "Do I have to follow everything perfectly for it to work?",
        answer:
          "No. You do not need perfection. The goal is to follow the highest-impact parts of your protocol consistently enough to create momentum and measurable progress.",
      },
    ],
  },
  {
    title: "Experience & Use",
    items: [
      {
        question: "How do I get started?",
        answer:
          "You start directly from the site, complete the questionnaire, and upload your photos. Then our team prepares your analysis and personalized body protocol.",
      },
      {
        question: "Do I need special photos?",
        answer:
          "No. We guide you through the process. You just need clear front, side, and full-body photos in good lighting so we can assess posture, frame, proportions, and body composition.",
      },
      {
        question: "Do I need an app?",
        answer: "No. Protocol works directly in your browser on desktop or mobile.",
      },
      {
        question: "I live outside the US. Can I still use Protocol?",
        answer: "Yes. Protocol is fully online and available worldwide.",
      },
      {
        question: "I don’t know anything about body transformation. Is that okay?",
        answer:
          "Yes. Protocol is specifically designed to remove guesswork for beginners and intermediate men who want a clear, practical plan.",
      },
    ],
  },
  {
    title: "Pricing & Membership",
    items: [
      {
        question: "How much does it cost?",
        answer: "Protocol currently costs $19 as a one-time payment.",
      },
      {
        question: "What’s included in the analysis?",
        answer:
          "You receive a body analysis, a personalized transformation protocol, biometric scores, realistic visualizations, and direct access to our team for clarification and follow-up.",
      },
      {
        question: "Are the recommendations expensive?",
        answer:
          "Not necessarily. Some recommendations are free, some are low-cost, and some require more investment. The point is to stop wasting money on random products, useless cardio, and generic plans that do not fit your body.",
      },
      {
        question: "Do I get a refund if I’m not satisfied?",
        answer: "Yes. You can request a refund within 14 days of receiving your order.",
      },
    ],
  },
  {
    title: "Mindset",
    items: [
      {
        question: "Is wanting to improve my body shallow?",
        answer:
          "No. Improving your body is one of the most practical forms of self-improvement. It affects confidence, health, dating, first impressions, and how you carry yourself in the world.",
      },
      {
        question: "Will this make me feel worse about myself?",
        answer:
          "Usually the opposite. Most insecurity comes from uncertainty. A clear diagnosis and a clear plan replace confusion with direction.",
      },
      {
        question: "Isn’t this promoting toxic standards?",
        answer:
          "No. We do not push one body type for everyone. We help you improve your physique while respecting your frame, genetics, health, and lifestyle.",
      },
      {
        question: "Do I really need this to look better?",
        answer:
          "You can improve on your own, but Protocol helps you do it faster and with fewer mistakes by focusing only on the changes that actually matter for your body.",
      },
    ],
  },
  {
    title: "Support & Privacy",
    items: [
      {
        question: "Can I talk to a real person?",
        answer: "Yes. You can message our team directly from your dashboard.",
      },
      {
        question: "What if a recommendation doesn’t work for me?",
        answer:
          "We adjust. If something does not fit your schedule, budget, recovery, or preferences, we can point you toward better alternatives.",
      },
      {
        question: "How can I contact Protocol if I need help?",
        answer: "You can reach us via your member dashboard or at contact@protocol-club.com.",
      },
      {
        question: "Will my photos and data stay private?",
        answer:
          "Yes. Your data is stored securely and only accessible to the people who need it to deliver your analysis and support.",
      },
    ],
  },
];

export default function FAQSection() {
  return (
    <section className="program-faq" id="faq" aria-labelledby="program-faq-title">
      <div className="program-faq__inner">
        <header className="program-faq__header">
          <h2 id="program-faq-title" className="program-faq__title">
            Frequently Asked <span>Questions</span>
          </h2>
        </header>

        <div className="program-faq__groups">
          {FAQ_GROUPS.map((group) => (
            <section key={group.title} className="program-faq__group">
              <h3 className="program-faq__group-title">{group.title}</h3>
              <div className="program-faq__items">
                {group.items.map((item) => (
                  <details key={item.question} className="program-faq__item">
                    <summary className="program-faq__summary">
                      <span>{item.question}</span>
                      <span className="program-faq__icon" aria-hidden="true">
                        +
                      </span>
                    </summary>
                    <div className="program-faq__answer">
                      <p>{item.answer}</p>
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
