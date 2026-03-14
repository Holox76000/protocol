"use client";

import { useEffect } from "react";
import { trackGa4Event } from "../../lib/ga4Event";

export default function CheckoutRedirect({
  redirectUrl,
  funnel,
}: {
  redirectUrl: string;
  funnel: string;
}) {
  useEffect(() => {
    trackGa4Event("checkout_started", {
      funnel,
      destination: "stripe",
    });

    const timeoutId = window.setTimeout(() => {
      trackGa4Event("checkout_redirected_to_stripe", {
        funnel,
      });
      window.location.assign(redirectUrl);
    }, 180);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [funnel, redirectUrl]);

  return (
    <main className="min-h-screen bg-ash px-6 py-16 text-ink">
      <div className="mx-auto max-w-2xl rounded-[32px] border border-black/10 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ink/60">Redirecting to checkout</p>
        <h1 className="mt-4 font-display text-4xl">Taking you to Stripe</h1>
        <p className="mt-4 text-lg text-ink/70">
          Your secure checkout is loading now. If nothing happens, use the button below.
        </p>
        <div className="mt-8">
          <a
            href={redirectUrl}
            className="inline-flex items-center justify-center rounded-full border border-black bg-black px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-white hover:text-black"
          >
            Continue to payment
          </a>
        </div>
      </div>
    </main>
  );
}
