"use client";

import { useEffect, useState } from "react";
import { trackGa4Event } from "../../lib/ga4Event";

type Props = {
  funnel: string;
  params: Record<string, string>;
};

type State =
  | { status: "loading" }
  | { status: "redirecting"; url: string; sessionId: string }
  | { status: "error"; message: string };

export default function CheckoutClient({ funnel, params }: Props) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function createSession() {
      try {
        const res = await fetch("/api/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        });

        if (cancelled) return;

        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(data?.error ?? "Failed to start checkout");
        }

        const { url, sessionId } = (await res.json()) as { url: string; sessionId: string };

        if (cancelled) return;

        // ✅ Client-side pixel — fires once, here, after session is confirmed created.
        // eventID = sessionId matches the CAPI event for Meta deduplication.
        try {
          (window as Window & { fbq?: Function }).fbq?.("track", "InitiateCheckout", {
            content_name: "Attractiveness Protocol",
            content_ids: ["f1-attractiveness-protocol"],
            value: 49,
            currency: "USD",
            num_items: 1,
          }, { eventID: sessionId });
        } catch {
          // Never block the redirect for tracking errors.
        }

        trackGa4Event("checkout_started", { funnel, destination: "stripe" });
        setState({ status: "redirecting", url, sessionId });

        setTimeout(() => {
          trackGa4Event("checkout_redirected_to_stripe", { funnel });
          window.location.assign(url);
        }, 180);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Something went wrong";
        console.error("[checkout] session creation failed", message);
        setState({ status: "error", message });
      }
    }

    createSession();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (state.status === "loading") {
    return (
      <main className="min-h-screen bg-ash px-6 py-16 text-ink">
        <div className="mx-auto max-w-2xl rounded-[32px] border border-black/10 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ink/60">Please wait</p>
          <h1 className="mt-4 font-display text-4xl">Preparing your checkout…</h1>
          <p className="mt-4 text-lg text-ink/70">This takes just a second.</p>
        </div>
      </main>
    );
  }

  if (state.status === "redirecting") {
    return (
      <main className="min-h-screen bg-ash px-6 py-16 text-ink">
        <div className="mx-auto max-w-2xl rounded-[32px] border border-black/10 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-ink/60">Redirecting to checkout</p>
          <h1 className="mt-4 font-display text-4xl">Taking you to Stripe</h1>
          <p className="mt-4 text-lg text-ink/70">
            Your secure checkout is loading. If nothing happens, use the button below.
          </p>
          <div className="mt-8">
            <a
              href={state.url}
              className="inline-flex items-center justify-center rounded-full border border-black bg-black px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-white hover:text-black"
            >
              Continue to payment
            </a>
          </div>
        </div>
      </main>
    );
  }

  // error state
  return (
    <main className="min-h-screen bg-ash px-6 py-16 text-ink">
      <div className="mx-auto max-w-2xl rounded-[32px] border border-black/10 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-500">Payment error</p>
        <h1 className="mt-4 font-display text-4xl">Something went wrong</h1>
        <p className="mt-4 text-lg text-ink/70">
          We couldn&apos;t start your checkout. This is temporary — your card was not charged.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => { setState({ status: "loading" }); }}
            className="inline-flex items-center justify-center rounded-full border border-black bg-black px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-white hover:text-black"
          >
            Try again
          </button>
          <a
            href={funnel === "f1" ? "/f1/offer" : "/"}
            className="inline-flex items-center justify-center rounded-full border border-black/20 px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-ink/70 transition hover:border-black hover:text-ink"
          >
            Back to offer
          </a>
        </div>
      </div>
    </main>
  );
}
