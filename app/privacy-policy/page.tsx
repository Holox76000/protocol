import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Protocol",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-16 lg:px-0">
      <div className="mx-auto max-w-[720px]">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-mute">
          Legal /
        </p>
        <h1 className="font-display text-[36px] font-normal leading-tight text-void">
          Privacy Policy
        </h1>
        <p className="mt-3 text-[13px] text-dim">Last updated: April 12, 2025</p>

        <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-dim">

          <section>
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-void">
              1. Who We Are
            </h2>
            <p>
              Protocol is operated by <strong className="text-void">PAP CONSULTING FZ LLE</strong>, a company registered in the Fujairah Free Zone, United Arab Emirates. Our registered address is Twin Towers, Fujairah, UAE.
            </p>
            <p className="mt-3">
              This Privacy Policy explains how we collect, use, and protect your personal information when you use our website and services.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-void">
              2. Information We Collect
            </h2>
            <p>We collect information you provide directly:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Name and email address when you create an account</li>
              <li>Payment information (processed securely through Stripe — we do not store card details)</li>
              <li>Questionnaire responses and assessment inputs</li>
            </ul>
            <p className="mt-3">We also collect information automatically:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>IP address, browser type, and device information</li>
              <li>Pages visited, time spent, and referring URLs</li>
              <li>Cookies and similar tracking technologies (see Section 6)</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-void">
              3. How We Use Your Information
            </h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>To create and manage your account</li>
              <li>To deliver your personalized Protocol assessment</li>
              <li>To process payments and send receipts</li>
              <li>To send transactional emails related to your account</li>
              <li>To improve our services through aggregated analytics</li>
              <li>To comply with legal obligations</li>
            </ul>
            <p className="mt-3">
              We do not sell your personal data to third parties. We do not use your data for automated decision-making that produces legal effects.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-void">
              4. Third-Party Services
            </h2>
            <p>We share data with the following trusted third parties to operate our service:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li><strong className="text-void">Stripe</strong> — payment processing</li>
              <li><strong className="text-void">Google Analytics</strong> — usage analytics</li>
              <li><strong className="text-void">Meta (Facebook)</strong> — advertising and conversion tracking</li>
              <li><strong className="text-void">Klaviyo</strong> — email communications</li>
            </ul>
            <p className="mt-3">
              Each of these providers operates under their own privacy policy and data processing agreements.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-void">
              5. Data Retention
            </h2>
            <p>
              We retain your personal data for as long as your account is active or as needed to provide you services. If you request account deletion, we will remove your personal data within 30 days, except where retention is required by law.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-void">
              6. Cookies
            </h2>
            <p>
              We use cookies and similar technologies to recognize you, remember your preferences, and measure the effectiveness of our advertising. You can control cookie settings through your browser. Disabling cookies may affect the functionality of certain features.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-void">
              7. Your Rights
            </h2>
            <p>Depending on your jurisdiction, you may have the right to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt out of marketing communications at any time</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, contact us at{" "}
              <a href="mailto:contact@protocol-club.com" className="text-void underline underline-offset-2">
                contact@protocol-club.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-void">
              8. Security
            </h2>
            <p>
              We use industry-standard security measures including SSL encryption, access controls, and secure data storage. No method of transmission over the internet is 100% secure. We cannot guarantee absolute security but commit to protecting your data with reasonable safeguards.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-void">
              9. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. When we do, we will revise the "Last updated" date at the top of this page. Continued use of Protocol after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-void">
              10. Contact
            </h2>
            <p>
              For privacy-related inquiries, contact us at:
            </p>
            <div className="mt-3 rounded-xl border border-wire bg-pebble px-5 py-4 text-[14px]">
              <p className="font-semibold text-void">PAP CONSULTING FZ LLE</p>
              <p>Twin Towers, Fujairah, UAE</p>
              <p className="mt-1">
                <a href="mailto:contact@protocol-club.com" className="text-void underline underline-offset-2">
                  contact@protocol-club.com
                </a>
              </p>
            </div>
          </section>

        </div>
      </div>
    </main>
  );
}
