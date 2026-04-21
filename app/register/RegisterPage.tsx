"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";

declare global {
  interface Window {
    TriplePixel?: (event: string, name?: unknown, data?: Record<string, unknown>) => void;
  }
}

type Props = {
  registrationToken?: string;
  prefillEmail?: string;
  prefillFirstName?: string;
};

export default function RegisterPage({
  registrationToken = "",
  prefillEmail = "",
  prefillFirstName = "",
}: Props) {
  const [email, setEmail] = useState(prefillEmail);
  const [firstName, setFirstName] = useState(prefillFirstName);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fire AddToCart on page visit
  useEffect(() => {
    function fire() {
      if (!window.TriplePixel) { setTimeout(fire, 400); return; }
      window.TriplePixel("AddToCart", { item: "attractiveness-protocol", q: 1, v: "89" });
    }
    fire();
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);

      if (!email.trim() || !firstName.trim()) {
        setError("Email and first name are required.");
        return;
      }

      setLoading(true);

      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            first_name: firstName.trim(),
            registration_token: registrationToken || undefined,
          }),
        });

        const data = (await res.json()) as { error?: string };

        if (!res.ok) {
          setError(data.error ?? "Something went wrong. Please try again.");
          return;
        }

        // Triple Whale — account created
        if (window.TriplePixel) {
          window.TriplePixel("Contact", { email: email.trim() });
          window.TriplePixel("custom", "Lead", {
            category: "lead_capture",
            subcategory: "account_created",
            value: 0,
            $: "0",
          });
        }

        window.location.assign(registrationToken ? "/questionnaire" : "/checkout");
      } catch {
        setError("Network error. Please check your connection.");
      } finally {
        setLoading(false);
      }
    },
    [email, firstName, registrationToken]
  );

  return (
    <div className="flex min-h-screen">

      {/* ── Left panel: dark editorial ── */}
      <div className="hidden lg:flex lg:w-[440px] xl:w-[480px] shrink-0 flex-col justify-between bg-void px-10 py-10">

        <div>
          {registrationToken ? (
            <>
              <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/30">
                Payment confirmed
              </p>
              <h2 className="font-display text-[38px] xl:text-[44px] font-normal leading-[1.08] text-white">
                Your spot is<br />secured.
              </h2>
              <p className="mt-6 text-[14px] leading-relaxed text-white/40 max-w-[340px]">
                Create your account to access your personalized assessment and start your Protocol.
              </p>
            </>
          ) : (
            <>
              <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/30">
                Protocol Club
              </p>
              <h2 className="font-display text-[38px] xl:text-[44px] font-normal leading-[1.08] text-white">
                The science of<br />attractiveness,<br />applied to you.
              </h2>
              <p className="mt-6 text-[14px] leading-relaxed text-white/40 max-w-[340px]">
                A full-body analysis with the precision of aesthetic medicine. Personalized to your face, frame, and context.
              </p>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex gap-0.5">
            {[0,1,2,3,4].map((i) => (
              <svg key={i} width="13" height="13" viewBox="0 0 12 12" fill="currentColor" className="text-amber-400" aria-hidden="true">
                <path d="M6 1l1.4 2.8 3.1.5-2.3 2.2.6 3.1L6 8l-2.8 1.6.6-3.1L1.5 4.3l3.1-.5L6 1z"/>
              </svg>
            ))}
          </div>
          <span className="text-[12px] text-white/40">4.9 · 25,000+ members</span>
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div className="flex flex-1 flex-col bg-white">
        {/* Mobile header */}
        <div className="flex items-center border-b border-wire px-6 py-5 lg:hidden">
          <img
            src="/program/static/landing/images/shared/Prtcl.png"
            alt="Protocol"
            width={28}
            height={28}
          />
        </div>

        {/* Scrollable form area */}
        <div className="flex flex-1 items-start justify-center px-6 py-7 lg:items-center lg:py-0">
          <div className="w-full max-w-[360px]">

            {/* Heading */}
            <div className="mb-8">
              <h1 className="font-display text-[34px] font-normal leading-tight text-void">
                {registrationToken ? "Access your Protocol." : "Start your Protocol."}
              </h1>
              <p className="mt-2 text-[14px] leading-relaxed text-dim">
                {registrationToken
                  ? "Almost there — confirm your details to access your personalized assessment."
                  : "Create your account. Complete checkout. Your Protocol starts immediately after."}
              </p>
              {!registrationToken && (
                <nav aria-label="Registration steps" className="mt-4">
                  <ol role="list" className="flex items-center gap-0">
                    {[
                      { label: "Account", active: true },
                      { label: "Payment", active: false },
                      { label: "Protocol", active: false },
                    ].map(({ label, active }, i, arr) => (
                      <li key={label} className="flex items-center" aria-current={active ? "step" : undefined}>
                        <div className="flex flex-col items-center gap-1">
                          <div className={`h-2 w-2 rounded-full ${active ? "bg-void" : "bg-wire"}`} />
                          <span className={`text-[10px] font-semibold ${active ? "text-void" : "text-mute"}`}>
                            {label}
                          </span>
                        </div>
                        {i < arr.length - 1 && (
                          <div className="mx-2 mb-3 h-px w-8 bg-wire" aria-hidden="true" />
                        )}
                      </li>
                    ))}
                  </ol>
                </nav>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5" suppressHydrationWarning>

              <div className="space-y-1.5">
                <label htmlFor="firstName" className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-mute">
                  First name
                </label>
                <input
                  id="firstName"
                  type="text"
                  autoComplete="given-name"
                  autoFocus
                  placeholder="Thomas"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full rounded-lg border border-wire bg-pebble px-4 py-3 text-[14px] text-void placeholder:text-mute transition-colors duration-150 focus:border-void focus:bg-white focus:outline-none disabled:opacity-50"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-mute">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading || (!!prefillEmail && !!registrationToken)}
                  className="w-full rounded-lg border border-wire bg-pebble px-4 py-3 text-[14px] text-void placeholder:text-mute transition-colors duration-150 focus:border-void focus:bg-white focus:outline-none disabled:opacity-50"
                />
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600">
                  {error.includes("already exists") ? (
                    <>
                      An account with this email already exists.{" "}
                      <Link href="/login" className="font-semibold underline underline-offset-2">
                        Sign in instead →
                      </Link>
                    </>
                  ) : (
                    error
                  )}
                </div>
              )}

              <div className="space-y-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-void py-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-white transition-all duration-150 hover:bg-[#1a1a1b] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/25 border-t-white" />
                      Creating account
                    </span>
                  ) : (
                    registrationToken ? "Continue to my Protocol" : "Access my Protocol"
                  )}
                </button>
                <p className="text-center text-[11px] text-mute lg:hidden">
                  Secure · No spam · Cancel anytime
                </p>
              </div>
            </form>

            {/* Footer */}
            <p className="mt-6 text-center text-[13px] text-dim">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-void underline-offset-2 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="hidden lg:flex items-center justify-between border-t border-wire px-8 py-4">
          <span className="text-[11px] text-mute">Secure · No spam · Cancel anytime</span>
          <Link href="/login" className="text-[11px] text-mute hover:text-void transition-colors">
            Sign in →
          </Link>
        </div>
      </div>
    </div>
  );
}
