"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useCallback, useRef } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");

// ── Section label ──────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-mute">
      {children} /
    </p>
  );
}

// ── Protocol membership card ───────────────────────────────────────────────────

function ProtocolCard() {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotateX = (y - rect.height / 2) / 10;
    const rotateY = (rect.width / 2 - x) / 10;
    card.style.transition = "transform 0.05s ease-out";
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transition = "transform 0.5s ease-out";
    card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)";
  };

  return (
    <div className="mb-4 lg:mb-8 w-full" style={{ aspectRatio: "1.586 / 1" }}>
      <div
        ref={cardRef}
        className="flex h-full w-full flex-col overflow-hidden rounded-2xl"
        style={{
          transformOrigin: "50% 50%",
          transform: "perspective(1000px) rotateX(0deg) rotateY(0deg)",
          background:
            "radial-gradient(ellipse at 65% 30%, #c8d4dd 0%, rgba(180, 200, 214, 0) 55%), linear-gradient(160deg, #9daebb 0%, #6e8494 100%)",
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Upper */}
        <div className="flex flex-1 flex-col justify-start p-6 pb-0">
          <p className="text-[26px] font-semibold leading-snug text-white">
            Protocol
          </p>
          <p className="text-[20px] font-normal leading-snug text-white/55">
            Personalized Program
          </p>
        </div>
        {/* Lower */}
        <div className="flex items-end justify-between px-6 pb-6">
          <p className="flex items-baseline">
            <strong className="text-[44px] font-light leading-none text-white">$89</strong>
            <span className="ml-1.5 text-[13px] font-normal text-white/50">/ one-time</span>
          </p>
          <p className="text-[11px] text-white/40">No Hidden Fees.</p>
        </div>
      </div>
    </div>
  );
}

// ── Stripe appearance ──────────────────────────────────────────────────────────

const stripeAppearance = {
  theme: "stripe" as const,
  variables: {
    colorPrimary: "#0c0c0d",
    colorText: "#111827",
    colorTextSecondary: "#6b7280",
    colorTextPlaceholder: "#9ca3af",
    colorDanger: "#ef4444",
    colorBackground: "#ffffff",
    colorIconTab: "#6b7280",
    colorIconTabSelected: "#111827",
    borderRadius: "8px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Helvetica, Arial, sans-serif",
    fontSizeBase: "14px",
    fontWeightNormal: "400",
    fontWeightMedium: "500",
    fontWeightBold: "600",
    spacingUnit: "4px",
    spacingGridRow: "18px",
  },
  rules: {
    ".Label": {
      fontSize: "11px",
      fontWeight: "500",
      letterSpacing: "0.06em",
      textTransform: "uppercase" as const,
      color: "#9ca3af",
      marginBottom: "6px",
    },
    ".Input": {
      fontSize: "14px",
      fontWeight: "400",
      color: "#111827",
      borderColor: "#e5e7eb",
      boxShadow: "none",
      padding: "10px 12px",
    },
    ".Input:focus": {
      borderColor: "#111827",
      boxShadow: "none",
      outline: "none",
    },
    ".Input--invalid": {
      borderColor: "#ef4444",
      boxShadow: "none",
    },
    ".Tab": {
      borderColor: "#e5e7eb",
      boxShadow: "none",
    },
    ".Tab:hover": {
      borderColor: "#d1d5db",
    },
    ".Tab--selected": {
      borderColor: "#111827",
      boxShadow: "none",
    },
    ".TabLabel": {
      fontSize: "13px",
      fontWeight: "500",
      color: "#374151",
    },
    ".TabIcon": {
      color: "#6b7280",
    },
  },
};

// ── Payment form (inside Elements provider) ────────────────────────────────────

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard?payment=success`,
      },
    });

    if (stripeError) {
      setError(stripeError.message ?? "Payment failed. Please try again.");
      setLoading(false);
    }
    // On success Stripe redirects automatically
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement options={{ layout: "tabs" }} />
      {error && <p className="text-[13px] text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="mt-2 flex w-full items-center justify-center rounded-lg bg-void px-5 py-3.5 text-[14px] font-semibold text-white transition-all duration-150 hover:bg-[#1a1a1b] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-white" />
            Processing…
          </span>
        ) : "Pay $89 · Start the Protocol"}
      </button>
    </form>
  );
}

// ── Checkout page ──────────────────────────────────────────────────────────────

export function CheckoutPage({ email }: { email: string }) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSecret = useCallback(() => {
    setError(null);
    setClientSecret(null);
    const sp = new URLSearchParams(window.location.search);
    const utmFields = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "utm_id", "fbclid"] as const;
    const utms: Record<string, string> = {};
    for (const key of utmFields) {
      const val = sp.get(key);
      if (val) utms[key] = val;
    }
    fetch("/api/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ funnel: "f1", customer_email: email, ...utms }),
    })
      .then((r) => r.json())
      .then((d: { clientSecret?: string; error?: string }) => {
        if (d.clientSecret) setClientSecret(d.clientSecret);
        else setError(d.error ?? "Unable to initialize checkout.");
      })
      .catch(() => setError("Unable to initialize checkout. Please try again."));
  }, [email]);

  useEffect(() => { fetchSecret(); }, [fetchSecret]);

  return (
    <main className="min-h-screen bg-white">
      {/* Nav — logo centered, progress bar below */}
      <nav className="border-b border-wire">
        <div className="flex flex-col items-center px-6 py-4 lg:px-14">
          <Image
            src="/program/static/landing/images/shared/Prtcl.png"
            alt="Protocol"
            width={30}
            height={30}
          />
          <ol role="list" aria-label="Registration steps" className="mt-3 flex items-center gap-0">
            {[
              { label: "Account", active: false, done: true },
              { label: "Payment", active: true, done: false },
              { label: "Protocol", active: false, done: false },
            ].map(({ label, active, done }, i, arr) => (
              <li key={label} className="flex items-center" aria-current={active ? "step" : undefined}>
                <div className="flex flex-col items-center gap-1">
                  <div className={`h-2 w-2 rounded-full ${active ? "bg-void" : done ? "bg-void/30" : "bg-wire"}`} />
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
        </div>
      </nav>

      {/* Two-column grid */}
      <div className="flex flex-col lg:grid lg:grid-cols-2 lg:items-start lg:pt-14">

        {/* ── Payment form — second on mobile, second on desktop ── */}
        <div className="order-last lg:order-2 min-w-0 px-6 py-4 lg:py-0 lg:px-0 lg:pt-0 lg:pb-14">
          <div className="lg:px-[3vw]">
            <SectionLabel>Secure payment</SectionLabel>
          </div>

          {error ? (
            <div className="lg:mx-[3vw] rounded-xl border border-red-200 bg-red-50 px-5 py-5">
              <p className="mb-3 text-[13px] text-red-700">{error}</p>
              <button
                onClick={fetchSecret}
                className="text-[12px] font-semibold text-red-700 underline-offset-2 hover:underline"
              >
                Try again
              </button>
            </div>
          ) : !clientSecret ? (
            <div className="space-y-3 lg:mx-[3vw]">
              <div className="h-12 animate-pulse rounded-xl bg-pebble" />
              <div className="flex gap-3">
                <div className="h-12 w-1/2 animate-pulse rounded-xl bg-pebble" />
                <div className="h-12 w-1/2 animate-pulse rounded-xl bg-pebble" />
              </div>
              <div className="h-14 animate-pulse rounded-xl bg-pebble" />
            </div>
          ) : (
            <div className="lg:mx-[3vw]">
              <Elements stripe={stripePromise} options={{ clientSecret, appearance: stripeAppearance, locale: "en" }}>
                <CheckoutForm />
              </Elements>
            </div>
          )}

          {/* Trust signals */}
          <div className="mt-7 flex flex-col items-center gap-2.5 lg:px-[3vw]">
            <p className="text-center text-[11px] text-mute">
              By completing this purchase you authorize a one-time charge of $89 USD. No recurring charges.{" "}
              <Link href="/terms" className="underline underline-offset-2 transition-colors hover:text-dim">
                Terms
              </Link>
              {" · "}
              <Link href="/refund-policy" className="underline underline-offset-2 transition-colors hover:text-dim">
                Refund Policy
              </Link>
            </p>
            <div className="flex items-center gap-1.5">
              <svg width="12" height="14" viewBox="0 0 12 14" fill="none" aria-hidden="true">
                <path d="M6 1L1 3.5v4c0 2.8 2.1 5.3 5 6 2.9-.7 5-3.2 5-6v-4L6 1z" fill="#22c55e" fillOpacity="0.15" stroke="#22c55e" strokeWidth="1.2" strokeLinejoin="round" />
                <path d="M4 7l1.5 1.5L8 5" stroke="#22c55e" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[11px] text-mute">Encrypted and secure</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg width="12" height="14" viewBox="0 0 12 14" fill="none" aria-hidden="true">
                <path d="M6 1L1 3.5v4c0 2.8 2.1 5.3 5 6 2.9-.7 5-3.2 5-6v-4L6 1z" fill="#22c55e" fillOpacity="0.15" stroke="#22c55e" strokeWidth="1.2" strokeLinejoin="round" />
                <path d="M3.5 7.5l1.5 1.5L9 5.5" stroke="#22c55e" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[11px] text-mute">90-day money-back guarantee</span>
            </div>
            <div className="flex items-center gap-0.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <svg key={i} width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className="text-amber-400" aria-hidden="true">
                  <path d="M6 1l1.4 2.8 3.1.5-2.3 2.2.6 3.1L6 8l-2.8 1.6.6-3.1L1.5 4.3l3.1-.5L6 1z" />
                </svg>
              ))}
              <span className="ml-1.5 text-[11px] text-mute">4.9 · 25,000+ members</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-mute">Powered by</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="42" height="17" viewBox="0 0 42 17" fill="none" aria-label="Stripe">
                <g clipPath="url(#stripe-clip)">
                  <path fillRule="evenodd" clipRule="evenodd" d="M40.9002 8.72803C40.9002 5.84185 39.5022 3.56445 36.8302 3.56445C34.1469 3.56445 32.5234 5.84185 32.5234 8.70552C32.5234 12.0991 34.4401 13.8127 37.191 13.8127C38.5326 13.8127 39.5473 13.5083 40.3139 13.0799V10.825C39.5472 11.2084 38.6679 11.4451 37.5517 11.4451C36.4581 11.4451 35.4885 11.0617 35.3645 9.73134H40.8776C40.8777 9.58485 40.9002 8.99858 40.9002 8.72803ZM35.3307 7.65695C35.3307 6.38294 36.1087 5.85311 36.8189 5.85311C37.5067 5.85311 38.2395 6.38302 38.2395 7.65695H35.3307Z" fill="#758084" />
                  <path fillRule="evenodd" clipRule="evenodd" d="M28.1726 3.56445C27.0678 3.56445 26.3574 4.08311 25.9628 4.44386L25.8163 3.74487H23.3359V16.8907L26.1545 16.2931L26.1658 13.1025C26.5716 13.3956 27.1691 13.8127 28.1613 13.8127C30.1794 13.8127 32.0171 12.1892 32.0171 8.61531C32.0059 5.34579 30.1456 3.56445 28.1726 3.56445ZM27.4961 11.3324C26.8309 11.3324 26.4364 11.0956 26.1658 10.8025L26.1545 6.6198C26.4476 6.29281 26.8535 6.06737 27.4961 6.06737C28.5221 6.06737 29.2324 7.21733 29.2324 8.69426C29.2324 10.2051 28.5334 11.3324 27.4961 11.3324Z" fill="#758084" />
                  <path fillRule="evenodd" clipRule="evenodd" d="M19.457 2.89947L22.2869 2.29069V0.00195312L19.457 0.599562V2.89947Z" fill="#758084" />
                  <path d="M22.2869 3.75586H19.457V13.6208H22.2869V3.75586Z" fill="#758084" />
                  <path fillRule="evenodd" clipRule="evenodd" d="M16.4242 4.59338L16.2438 3.75907H13.8086V13.624H16.6272V6.93839C17.2923 6.07024 18.4197 6.22814 18.7692 6.35212V3.75907C18.4085 3.62384 17.0894 3.37581 16.4242 4.59338Z" fill="#758084" />
                  <path fillRule="evenodd" clipRule="evenodd" d="M10.7856 1.30664L8.03469 1.89291L8.02344 10.9236C8.02344 12.5922 9.27486 13.8211 10.9435 13.8211C11.868 13.8211 12.5444 13.652 12.9165 13.449V11.1603C12.5557 11.3069 10.7744 11.8255 10.7744 10.1569V6.15457H12.9165V3.7532H10.7744L10.7856 1.30664Z" fill="#758084" />
                  <path fillRule="evenodd" clipRule="evenodd" d="M3.16491 6.6198C3.16491 6.18009 3.52567 6.01101 4.1232 6.01101C4.98002 6.01101 6.06235 6.2703 6.91925 6.7326V4.08311C5.98348 3.7111 5.05897 3.56445 4.1232 3.56445C1.83454 3.56445 0.3125 4.75959 0.3125 6.75511C0.3125 9.86681 4.59675 9.37075 4.59675 10.7124C4.59675 11.231 4.14579 11.4001 3.51441 11.4001C2.57864 11.4001 1.38358 11.0168 0.436556 10.4982V13.1814C1.48505 13.6324 2.54487 13.8241 3.51441 13.8241C5.85943 13.8241 7.47168 12.6628 7.47168 10.6448C7.46042 7.28502 3.16491 7.88255 3.16491 6.6198Z" fill="#758084" />
                </g>
                <defs>
                  <clipPath id="stripe-clip">
                    <rect width="41.3778" height="16.8889" fill="white" transform="translate(0.3125)" />
                  </clipPath>
                </defs>
              </svg>
            </div>
          </div>
        </div>

        {/* ── Order summary — first on mobile, first on desktop ── */}
        <div className="order-first lg:order-1 px-6 py-4 lg:px-[9vw] lg:pt-0 lg:pb-14 lg:border-r lg:border-wire">
          <SectionLabel>Your Protocol</SectionLabel>

          {/* Card */}
          <ProtocolCard />

          {/* Description */}
          <div className="mb-4 lg:mb-10 text-center">
            <p className="mb-1 text-[14px] font-medium text-void">Protocol Access</p>
            <p className="text-[12.5px] leading-relaxed text-dim">
              A full-body attractiveness analysis personalized to your face,<br className="hidden lg:block" /> frame, and context.
              Reviewed by specialists and delivered within 72 hours.
            </p>
          </div>

          {/* Separator */}
          <div className="border-t border-wire" />

          {/* Price recap */}
          <div className="pt-3 lg:pt-7">
            <SectionLabel>What you get</SectionLabel>
            <div className="mb-2 lg:mb-4 flex justify-between text-[13px] text-dim">
              <span>Protocol Access</span>
              <span>$89</span>
            </div>
            <div className="flex justify-between border-t border-wire pt-2.5 lg:pt-4 text-[15px] font-semibold text-void">
              <span>Due today</span>
              <span>$89</span>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
