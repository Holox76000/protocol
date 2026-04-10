import { TrackedLink } from "../TrackedLink";

export function StickyCta() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-black/10 bg-white/90 px-4 py-3 shadow-soft backdrop-blur sm:hidden">
      <TrackedLink
        href="/checkout/hosted?funnel=main"
        trackingPayload={{ ctaLocation: "sticky_mobile", destination: "app_checkout" }}
        className="inline-flex w-full items-center justify-center border border-black bg-black px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white shadow-hard ring-2 ring-black/70 ring-offset-2 ring-offset-white transition hover:bg-white hover:text-black"
      >
        Apply Now
      </TrackedLink>
    </div>
  );
}
