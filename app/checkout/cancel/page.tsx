import Link from "next/link";
import CheckoutStatusEvent from "../checkout-status-event";

export default function CheckoutCancelPage({
  searchParams,
}: {
  searchParams?: { funnel?: string };
}) {
  const funnel = searchParams?.funnel?.trim() || "main";

  return (
    <main className="min-h-screen bg-ash px-6 py-16 text-ink">
      <CheckoutStatusEvent eventName="payment_failed" funnel={funnel} />
      <div className="mx-auto max-w-2xl rounded-[32px] border border-black/10 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ink/60">Checkout interrupted</p>
        <h1 className="mt-4 font-display text-4xl">No payment was taken</h1>
        <p className="mt-4 text-lg text-ink/70">
          Your Stripe checkout was canceled before completion. You can restart it whenever you are ready.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={`/checkout/hosted?funnel=${encodeURIComponent(funnel)}`}
            className="inline-flex items-center justify-center rounded-full border border-black bg-black px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-white hover:text-black"
          >
            Try again
          </Link>
          <Link
            href={`/?funnel=${encodeURIComponent(funnel)}`}
            className="inline-flex items-center justify-center rounded-full border border-black/15 bg-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-ink transition hover:border-black hover:bg-ash"
          >
            Return to landing
          </Link>
        </div>
      </div>
    </main>
  );
}
