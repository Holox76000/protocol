import InternalPageShell from "../../InternalPageShell";

const PRIVACY_SECTIONS = [
  {
    title: "Information we collect",
    body:
      "We may collect contact details, checkout information, support messages, analytics data, and basic technical information needed to operate the site and deliver the program.",
  },
  {
    title: "How information is used",
    body:
      "Information is used to process purchases, deliver access, answer support requests, improve the product experience, and monitor site performance and security.",
  },
  {
    title: "Sharing and storage",
    body:
      "We only share data with service providers needed to operate the site, such as payment, hosting, analytics, or customer support tools. Data is retained only as long as reasonably necessary for operations, compliance, and fraud prevention.",
  },
  {
    title: "Your choices",
    body:
      "You can contact support to request account help, correction of inaccurate information, or deletion requests where legally and operationally appropriate.",
  },
];

export default function ProgramPrivacyPolicyPage() {
  return (
    <InternalPageShell
      eyebrow="Privacy Policy"
      title="How data is handled inside the Protocol site."
      subtitle="A lightweight internal privacy page replacing the mirrored legacy policy page."
    >
      <section className="program-internal__stack">
        {PRIVACY_SECTIONS.map((section) => (
          <article key={section.title} className="program-internal__panel">
            <p className="program-internal__section-label">{section.title}</p>
            <p>{section.body}</p>
          </article>
        ))}

        <article className="program-internal__panel">
          <p className="program-internal__section-label">Contact</p>
          <p>
            For privacy-related questions, email <a href="mailto:support@protocol-club.com">support@protocol-club.com</a>.
          </p>
        </article>
      </section>
    </InternalPageShell>
  );
}
