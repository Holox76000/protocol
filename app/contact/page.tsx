import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact | Protocol",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-16 lg:px-0">
      <div className="mx-auto max-w-[720px]">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-mute">
          Support /
        </p>
        <h1 className="font-display text-[36px] font-normal leading-tight text-void">
          Contact Us
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-dim">
          We typically respond within 24 hours on business days.
        </p>

        <div className="mt-10 space-y-6">

          <div className="rounded-2xl border border-wire bg-pebble px-6 py-6">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-mute">Email</p>
            <a
              href="mailto:contact@protocol-club.com"
              className="text-[18px] font-medium text-void underline-offset-3 hover:underline"
            >
              contact@protocol-club.com
            </a>
            <p className="mt-2 text-[13px] text-dim">
              For account access, billing questions, refunds, and general support.
            </p>
          </div>

          <div className="rounded-2xl border border-wire bg-pebble px-6 py-6">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-mute">Company</p>
            <p className="text-[15px] font-medium text-void">PAP CONSULTING FZ LLE</p>
            <p className="mt-1 text-[14px] text-dim">Twin Towers, Fujairah</p>
            <p className="text-[14px] text-dim">United Arab Emirates</p>
          </div>

        </div>

        <div className="mt-12 border-t border-wire pt-8">
          <p className="mb-4 text-[13px] font-semibold uppercase tracking-[0.12em] text-mute">
            Common Questions
          </p>
          <div className="space-y-5">
            {[
              {
                q: "When will I receive my Protocol report?",
                a: "Your report is delivered digitally within 72 hours of completing your assessment.",
              },
              {
                q: "Can I request a refund?",
                a: "Yes. We offer a 90-day money-back guarantee. See our Refund Policy for details.",
              },
              {
                q: "I can't access my account.",
                a: "Email us with the address you used to sign up and we'll restore your access within one business day.",
              },
              {
                q: "Is my data private?",
                a: "Yes. We never sell your personal data. See our Privacy Policy for full details.",
              },
            ].map(({ q, a }) => (
              <div key={q} className="border-b border-wire pb-5">
                <p className="text-[14px] font-semibold text-void">{q}</p>
                <p className="mt-1 text-[14px] text-dim">{a}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
