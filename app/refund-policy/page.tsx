import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy | Protocol",
};

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-16 lg:px-0">
      <div className="mx-auto max-w-[720px]">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-mute">
          Legal /
        </p>
        <h1 className="font-display text-[36px] font-normal leading-tight text-void">
          Refund Policy
        </h1>
        <p className="mt-3 text-[13px] text-dim">Last updated: April 12, 2025</p>

        <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-dim">

          <section>
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-void">
              Our Guarantee
            </h2>
            <p>
              We stand behind the quality of every Protocol assessment. If you are not satisfied with your experience, we offer a <strong className="text-void">90-day money-back guarantee</strong> — no questions asked.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-void">
              How to Request a Refund
            </h2>
            <p>
              To request a refund within the 90-day window, contact us at{" "}
              <a href="mailto:support@protocolclub.co" className="text-void underline underline-offset-2">
                support@protocolclub.co
              </a>{" "}
              with the subject line "Refund Request" and include the email address associated with your account. We will process your refund within 5–10 business days.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-void">
              Refund Conditions
            </h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>Refund requests must be submitted within 90 days of the original purchase date.</li>
              <li>Refunds are issued to the original payment method only.</li>
              <li>Only one refund per customer.</li>
              <li>Refunds are not available for accounts that have violated our Terms of Service.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-void">
              Processing Time
            </h2>
            <p>
              Once approved, refunds typically appear on your statement within 5–10 business days depending on your bank or card issuer. If you have not received your refund after 10 business days, contact us and we will investigate.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-void">
              Contact
            </h2>
            <div className="rounded-xl border border-wire bg-pebble px-5 py-4 text-[14px]">
              <p className="font-semibold text-void">PAP CONSULTING FZ LLE</p>
              <p>Twin Towers, Fujairah, UAE</p>
              <p className="mt-1">
                <a href="mailto:support@protocolclub.co" className="text-void underline underline-offset-2">
                  support@protocolclub.co
                </a>
              </p>
            </div>
          </section>

        </div>
      </div>
    </main>
  );
}
