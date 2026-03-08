import InternalPageShell from "../InternalPageShell";

const RESOURCE_GROUPS = [
  {
    label: "Research",
    title: "Body composition, aesthetics, and real-world outcomes",
    description:
      "The program references research on body fat, muscle gain, attractiveness, perception, and the social impact of physique.",
  },
  {
    label: "Education",
    title: "Protocol breakdowns and implementation guides",
    description:
      "Members receive practical guidance on training structure, nutrition priorities, presentation, and sustainable body recomposition.",
  },
  {
    label: "Support",
    title: "Questions about access or your purchase",
    description:
      "For help with billing, login access, or product delivery, contact support@protocol-club.com and include the email used for checkout.",
  },
];

export default function ProgramResourcesPage() {
  return (
    <InternalPageShell
      eyebrow="Resources"
      title="Everything supporting the program in one place."
      subtitle="A simple internal resources hub replacing the mirrored legacy research page."
    >
      <section className="program-internal__grid">
        {RESOURCE_GROUPS.map((item) => (
          <article key={item.title} className="program-internal__card">
            <p className="program-internal__card-label">{item.label}</p>
            <h2>{item.title}</h2>
            <p>{item.description}</p>
          </article>
        ))}
      </section>

      <section className="program-internal__stack">
        <article className="program-internal__panel">
          <p className="program-internal__section-label">What this page is for</p>
          <h2>Internal routing only</h2>
          <p>
            This page exists so the site no longer depends on the mirrored external Protocol resources page for
            footer navigation and legal housekeeping.
          </p>
        </article>
      </section>
    </InternalPageShell>
  );
}
