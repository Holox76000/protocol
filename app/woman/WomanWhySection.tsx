const WHY_GROUPS = [
  {
    title: "Consider <strong>this...</strong>",
    items: [
      "Your body is one of your clearest signals of vitality, discipline, and self-respect",
      "First impressions form fast, and your shape speaks before you say a word",
      "It influences how partners, employers, and peers perceive your presence",
      "Even a few weeks of visible progress can completely change how you carry yourself",
    ],
  },
  {
    title: "The key is approaching <strong>it intelligently</strong>",
    items: [
      "Not chasing extremes or unrealistic social-media standards",
      "Not copying someone else’s cut, cleanse, or burnout routine",
      "Not punishing your body into compliance",
      "Just becoming the leanest, strongest, most radiant version of your own body",
    ],
  },
];

export default function WomanWhySection() {
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
            A lot of women feel guilty for wanting to look better, like it means they are vain or superficial. In
            reality, caring about your body can be one of the healthiest, most grounded forms of self-respect.
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
