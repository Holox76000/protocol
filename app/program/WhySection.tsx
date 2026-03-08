const WHY_GROUPS = [
  {
    title: "Consider <strong>this...</strong>",
    items: [
      "Your body is your most visible signal of discipline and health",
      "First impressions are formed in seconds — your physique speaks before you do",
      "It directly impacts how women, employers, and peers perceive you",
      "Even 8 weeks of visible progress can completely change how you carry yourself",
    ],
  },
  {
    title: "The key is approaching <strong>it intelligently</strong>",
    items: [
      "Not trying to look like a roided Instagram model",
      "Not copying someone else's bulk/cut cycle",
      "Not chasing perfection",
      "Just becoming the leanest, most muscular version of your own body",
    ],
  },
];

export default function WhySection() {
  return (
    <section className="program-why" aria-labelledby="program-why-title">
      <div className="program-why__inner">
        <header className="program-why__header">
          <p className="program-why__eyebrow">The Why Behind It</p>
          <h2 id="program-why-title" className="program-why__title">
            Is It Shallow to Want
            <span>a Better Body?</span>
          </h2>
          <p className="program-why__subtitle">
            A lot of guys feel guilty for wanting to look better — like it means they're vain or shallow. But
            caring about your physique is one of the most natural, healthy drives a man can have.
          </p>
        </header>

        <div className="program-why__groups">
          {WHY_GROUPS.map((group) => (
            <section key={group.title} className="program-why__group">
              <h3
                className="program-why__group-title"
                dangerouslySetInnerHTML={{ __html: group.title }}
              />
              <div className="program-why__panel">
                {group.items.map((item) => (
                  <p key={item} className="program-why__item">
                    {item}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
