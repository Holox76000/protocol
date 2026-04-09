"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import CheckoutStatusEvent from "../checkout-status-event";

const MAX_POLLS = 20; // 20 × 1.5s = 30s max
const POLL_INTERVAL = 1500;

export default function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams?: { funnel?: string; session_id?: string };
}) {
  const funnel = searchParams?.funnel?.trim() || "main";
  const sessionId = searchParams?.session_id?.trim();

  const [status, setStatus] = useState<"polling" | "redirecting" | "timeout" | "no_session">(
    sessionId ? "polling" : "no_session"
  );
  const pollCount = useRef(0);

  useEffect(() => {
    if (!sessionId) return;

    const poll = async () => {
      if (pollCount.current >= MAX_POLLS) {
        setStatus("timeout");
        return;
      }
      pollCount.current += 1;

      try {
        const res = await fetch(`/api/checkout/token?session_id=${encodeURIComponent(sessionId)}`);
        const data = (await res.json()) as { pending?: boolean; email?: string; firstName?: string; error?: string };

        if (data.email) {
          setStatus("redirecting");
          const params = new URLSearchParams();
          params.set("email", data.email);
          if (data.firstName) params.set("firstName", data.firstName);
          window.location.assign(`/register?${params.toString()}`);
          return;
        }

        if (data.pending) {
          setTimeout(poll, POLL_INTERVAL);
          return;
        }

        // Error or unexpected response — fall back to timeout UI
        setStatus("timeout");
      } catch {
        setTimeout(poll, POLL_INTERVAL);
      }
    };

    const timer = setTimeout(poll, 800);
    return () => clearTimeout(timer);
  }, [sessionId]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-pebble px-6 py-16">
      <CheckoutStatusEvent eventName="payment_success" funnel={funnel} sessionId={sessionId} />

      <div className="w-full max-w-[440px]">

        {(status === "polling" || status === "redirecting") && (
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-void">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/25 border-t-white" />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-mute mb-3">
              Payment confirmed
            </p>
            <h1 className="font-display text-[32px] font-normal leading-tight text-void mb-3">
              {status === "redirecting" ? "Setting up your account…" : "Your payment went through."}
            </h1>
            <p className="text-[14px] leading-relaxed text-dim">
              {status === "redirecting"
                ? "You'll be redirected in a moment."
                : "We're preparing your access. This takes just a few seconds."}
            </p>
          </div>
        )}

        {status === "timeout" && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-mute mb-3">
              Payment confirmed
            </p>
            <h1 className="font-display text-[32px] font-normal leading-tight text-void mb-3">
              Your payment went through.
            </h1>
            <p className="text-[14px] leading-relaxed text-dim mb-6">
              We're still processing your account. Check your email for the registration link, or create your account directly below.
            </p>
            <Link
              href="/register"
              className="inline-flex w-full items-center justify-between rounded-lg bg-void px-5 py-3 text-[13px] font-semibold text-white transition-all hover:bg-[#1a1a1b]"
            >
              <span>Create your account</span>
              <span className="text-white/50">→</span>
            </Link>
          </div>
        )}

        {status === "no_session" && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-mute mb-3">
              Payment confirmed
            </p>
            <h1 className="font-display text-[32px] font-normal leading-tight text-void mb-3">
              Your checkout went through.
            </h1>
            <p className="text-[14px] leading-relaxed text-dim mb-6">
              Check your email for the registration link, or create your account directly.
            </p>
            <Link
              href="/register"
              className="inline-flex w-full items-center justify-between rounded-lg bg-void px-5 py-3 text-[13px] font-semibold text-white transition-all hover:bg-[#1a1a1b]"
            >
              <span>Create your account</span>
              <span className="text-white/50">→</span>
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
