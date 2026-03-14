import Link from "next/link";
import CheckoutStatusEvent from "../checkout-status-event";

export default function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams?: { funnel?: string; session_id?: string };
}) {
  const funnel = searchParams?.funnel?.trim() || "main";
  const sessionId = searchParams?.session_id?.trim();

  return (
    <main className="min-h-screen bg-ash px-6 py-16 text-ink">
      <CheckoutStatusEvent eventName="payment_success" funnel={funnel} sessionId={sessionId} />
      <div className="mx-auto max-w-2xl rounded-[32px] border border-black/10 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ink/60">Payment confirmed</p>
        <h1 className="mt-4 font-display text-4xl">Your checkout went through</h1>
        <p className="mt-4 text-lg text-ink/70">
          We have recorded your order and your Stripe confirmation is complete. You can now continue to member access.
        </p>
        <p className="mt-3 text-sm text-ink/60">
          If you need help retrieving access, contact support and include the email used during checkout.
        </p>
        {sessionId ? (
          <p className="mt-3 text-xs uppercase tracking-[0.16em] text-ink/45">Session {sessionId}</p>
        ) : null}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full border border-black bg-black px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-white hover:text-black"
          >
            Go to login
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
