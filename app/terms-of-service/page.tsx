import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Protocol",
};

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-white px-6 py-16 lg:px-0">
      <div className="mx-auto max-w-[720px]">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-mute">
          Legal /
        </p>
        <h1 className="font-display text-[36px] font-normal leading-tight text-void">
          Terms of Service
        </h1>
        <p className="mt-3 text-[13px] text-dim">Last updated: April 12, 2025</p>

        <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-dim">

          <section>
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-void">
              1. Agreement to Terms
            </h2>
            <p>
              By accessing or using Protocol, you agree to be bound by these Terms of Service. Protocol is operated by <strong className="text-void">PAP CONSULTING FZ LLE</strong>, registered in the Fujairah Free Zone, United Arab Emirates (Twin Towers, Fujairah, UAE).
            </p>
            <p className="mt-3">
              If you do not agree to these terms, do not use our services.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-void">
              2. Description of Service
            </h2>
            <p>
              Protocol provides a personalized body and facial attractiveness assessment service for informational and self-improvement purposes. Our service includes:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>A digital questionnaire and photo-based assessment</li>
              <li>A personalized written report with recommendations</li>
              <li>Access to your results through a member dashboard</li>
            </ul>
            <p className="mt-3">
              Protocol is not a medical service. Our assessments do not constitute medical advice, diagnosis, or treatment.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-void">
              3. Account Registration
            </h2>
            <p>
              You must create an account to access Protocol services. You agree to provide accurate information and keep your account credentials secure. You are responsible for all activity that occurs under your account.
            </p>
            <p className="mt-3">
              You must be at least 18 years old to use Protocol.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-void">
              4. Payment and Billing
            </h2>
            <p>
              Protocol charges a one-time fee of $89 USD for access to your personalized assessment. Payment is processed securely through Stripe. All fees are charged in USD and are non-refundable except as described in our Refund Policy.
            </p>
            <p className="mt-3">
              By completing payment, you authorize PAP CONSULTING FZ LLE to charge your payment method for the agreed amount.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-void">
              5. Intellectual Property
            </h2>
            <p>
              All content, methodology, reports, and materials provided through Protocol are the intellectual property of PAP CONSULTING FZ LLE. You may not reproduce, distribute, or create derivative works without explicit written permission.
            </p>
            <p className="mt-3">
              Your Protocol report is licensed to you for personal use only. Sharing, reselling, or publishing your report is prohibited.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-void">
              6. Acceptable Use
            </h2>
            <p>You agree not to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Use Protocol for any unlawful purpose</li>
              <li>Submit false or misleading information</li>
              <li>Attempt to access accounts or data that are not yours</li>
              <li>Interfere with the security or proper functioning of the service</li>
              <li>Use automated tools to scrape or extract content</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-void">
              7. Disclaimers
            </h2>
            <p>
              Protocol is provided "as is" without warranty of any kind. We do not guarantee specific results. Individual outcomes vary based on genetics, lifestyle, consistency of effort, and other factors outside our control.
            </p>
            <p className="mt-3">
              Protocol is not a substitute for professional medical, nutritional, or psychological advice. Always consult qualified professionals before making significant changes to your health or lifestyle.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-void">
              8. Limitation of Liability
            </h2>
            <p>
              To the fullest extent permitted by law, PAP CONSULTING FZ LLE shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of Protocol. Our total liability to you for any claim shall not exceed the amount you paid for the service.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-void">
              9. Governing Law
            </h2>
            <p>
              These Terms are governed by the laws of the United Arab Emirates. Any disputes shall be subject to the exclusive jurisdiction of the courts of the Emirate of Fujairah, UAE.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-void">
              10. Changes to Terms
            </h2>
            <p>
              We reserve the right to modify these Terms at any time. Continued use of Protocol after changes constitutes acceptance of the updated Terms. We will notify registered users of material changes via email.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-void">
              11. Contact
            </h2>
            <div className="rounded-xl border border-wire bg-pebble px-5 py-4 text-[14px]">
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
