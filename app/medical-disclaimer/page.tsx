import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Medical Disclaimer | Protocol",
};

export default function MedicalDisclaimerPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-16 lg:px-0">
      <div className="mx-auto max-w-[720px]">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-mute">
          Legal /
        </p>
        <h1 className="font-display text-[36px] font-normal leading-tight text-void">
          Medical Disclaimer
        </h1>
        <p className="mt-3 text-[13px] text-dim">Last updated: April 12, 2025</p>

        <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-dim">

          <section>
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-void">
              Not Medical Advice
            </h2>
            <p>
              Protocol is an informational and self-improvement service. The content, assessments, reports, and recommendations provided through Protocol are for <strong className="text-void">informational purposes only</strong> and do not constitute medical advice, diagnosis, or treatment.
            </p>
            <p className="mt-3">
              PAP CONSULTING FZ LLE is not a licensed medical provider, physician, dietitian, or mental health professional. Nothing on this platform should be interpreted as a substitute for professional medical advice.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-void">
              Consult a Professional
            </h2>
            <p>
              Before beginning any new training program, nutrition plan, or making changes to your lifestyle based on information from Protocol, you should consult a qualified healthcare professional. This is especially important if you have any pre-existing medical conditions, injuries, or are taking medication.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-void">
              Individual Results Vary
            </h2>
            <p>
              Results described or implied on this platform are not typical and will vary between individuals. Factors including genetics, starting point, adherence, sleep, stress, and other lifestyle variables significantly affect outcomes. Protocol makes no guarantee of specific results.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-void">
              FDA Disclaimer
            </h2>
            <p>
              These statements have not been evaluated by the Food and Drug Administration. Protocol is not intended to diagnose, treat, cure, or prevent any disease or medical condition.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-void">
              Psychological Wellbeing
            </h2>
            <p>
              Our assessments involve evaluation of physical appearance. If you have or have had concerns about body image, eating disorders, or self-esteem, we encourage you to speak with a qualified mental health professional before using Protocol. Your wellbeing is our priority.
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
