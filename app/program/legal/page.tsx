import Link from "next/link";
import InternalPageShell from "../InternalPageShell";

export default function ProgramLegalPage() {
  return (
    <InternalPageShell
      eyebrow="Legal"
      title="Internal legal pages for the Protocol experience."
      subtitle="These pages replace the mirrored legacy Protocol pages for core legal and policy navigation."
    >
      <section className="program-internal__grid">
        <article className="program-internal__card">
          <p className="program-internal__card-label">Company</p>
          <h2>Protocol</h2>
          <p>
            This program is operated under the Protocol brand. For support, billing questions, or access issues,
            contact <a href="mailto:support@protocol-club.com">support@protocol-club.com</a>.
          </p>
        </article>

        <article className="program-internal__card">
          <p className="program-internal__card-label">Policies</p>
          <h2>Privacy and terms</h2>
          <p>
            Use the links below to review how data is handled and the general legal terms attached to the
            program experience.
          </p>
          <div className="program-internal__links">
            <Link href="/program/legal/privacy-policy">Privacy Policy</Link>
            <Link href="/">Product page</Link>
          </div>
        </article>
      </section>

      <section className="program-internal__stack">
        <article className="program-internal__panel">
          <p className="program-internal__section-label">Terms of Service</p>
          <h2>Use of the site and recommendations</h2>
          <p>
            The body analysis and protocol content are informational and educational. They are not medical
            advice, diagnosis, or treatment, and results vary based on compliance, training history, sleep,
            recovery, and nutrition.
          </p>
          <p>
            By using the site, you agree not to misuse the content, copy paid materials without authorization,
            or rely on aesthetic recommendations as a substitute for professional medical care.
          </p>
        </article>

        <article className="program-internal__panel">
          <p className="program-internal__section-label">Disclaimers</p>
          <h2>Transformation previews and examples</h2>
          <p>
            Some visualizations on the site are digitally generated or curated to illustrate plausible outcomes.
            They do not guarantee a specific result. Client examples reflect individual cases and should not be
            interpreted as typical outcomes for every customer.
          </p>
        </article>
      </section>
    </InternalPageShell>
  );
}
