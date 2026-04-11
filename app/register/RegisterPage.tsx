"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";

type Props = {
  registrationToken?: string;
  prefillEmail?: string;
  prefillFirstName?: string;
};

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M1 9C1 9 4 3 9 3s8 6 8 6-3 6-8 6S1 9 1 9z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M2 2l14 14M7.4 7.5A2.5 2.5 0 0011.5 11M5 5.3C3.3 6.5 2 8 1 9c1 2.3 4.4 6 8 6a7.8 7.8 0 004-1.1M8 3.1C8.3 3 8.7 3 9 3c3.6 0 7 3.7 8 6a10 10 0 01-1.6 2.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

const STRENGTH: Record<string, { label: string; bar: string; text: string }> = {
  weak: { label: "Weak", bar: "w-1/3 bg-red-400", text: "text-red-500" },
  fair: { label: "Fair", bar: "w-2/3 bg-amber-400", text: "text-amber-600" },
  strong: { label: "Strong", bar: "w-full bg-emerald-500", text: "text-emerald-600" },
};

const TESTIMONIALS = [
  { quote: "13 weeks in, people started noticing.", name: "Ryan, 27", metric: "SWR 1.29 → 1.44" },
  { quote: "Same weight, but my girlfriend noticed the shape change before I told her.", name: "Tyler, 32", metric: "SWR 1.31 → 1.45" },
  { quote: "I've been training for 6 years. This explained in 10 minutes what I'd been missing.", name: "Connor, 31", metric: "SWR 1.27 → 1.46" },
];

function MobileTestimonialSlider() {
  const [active, setActive] = useState(0);
  const touchStart = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const next = useCallback(() => setActive((i) => (i + 1) % TESTIMONIALS.length), []);
  const prev = useCallback(() => setActive((i) => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length), []);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(next, 4500);
  }, [next]);

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [resetTimer]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const delta = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 40) {
      delta > 0 ? next() : prev();
      resetTimer();
    }
    touchStart.current = null;
  };

  const t = TESTIMONIALS[active];
  return (
    <div className="lg:hidden mb-5">
      <div
        className="rounded-lg border border-wire bg-pebble px-4 py-3 select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex gap-0.5">
            {[0,1,2,3,4].map((i) => (
              <svg key={i} width="10" height="10" viewBox="0 0 12 12" fill="currentColor" className="text-amber-400" aria-hidden="true">
                <path d="M6 1l1.4 2.8 3.1.5-2.3 2.2.6 3.1L6 8l-2.8 1.6.6-3.1L1.5 4.3l3.1-.5L6 1z"/>
              </svg>
            ))}
          </div>
          <div className="flex gap-1">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { setActive(i); resetTimer(); }}
                className={`h-1 rounded-full transition-all duration-200 ${i === active ? "w-3 bg-void" : "w-1 bg-wire"}`}
                aria-label={`Testimonial ${i + 1}`}
              />
            ))}
          </div>
        </div>

        <p className="text-[12.5px] leading-snug text-void mb-1.5 min-h-[36px]">
          &ldquo;{t.quote}&rdquo;
        </p>

        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-dim">{t.name}</span>
          <span className="text-[11px] tabular-nums text-mute">{t.metric}</span>
        </div>
      </div>
    </div>
  );
}

function getStrength(pw: string): keyof typeof STRENGTH | null {
  if (!pw) return null;
  if (pw.length < 8) return "weak";
  if (pw.length < 12) return "fair";
  return "strong";
}

export default function RegisterPage({
  registrationToken = "",
  prefillEmail = "",
  prefillFirstName = "",
}: Props) {
  const [email, setEmail] = useState(prefillEmail);
  const [firstName, setFirstName] = useState(prefillFirstName);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);

      if (!email.trim() || !firstName.trim()) {
        setError("Email and first name are required.");
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
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
            password,
            registration_token: registrationToken || undefined,
          }),
        });

        const data = (await res.json()) as { error?: string };

        if (!res.ok) {
          setError(data.error ?? "Something went wrong. Please try again.");
          return;
        }

        window.location.assign(registrationToken ? "/dashboard" : "/checkout");
      } catch {
        setError("Network error. Please check your connection.");
      } finally {
        setLoading(false);
      }
    },
    [email, firstName, password, registrationToken]
  );

  const strength = getStrength(password);
  const strengthInfo = strength ? STRENGTH[strength] : null;

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

        <div className="space-y-5">
          {/* Rating */}
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

          {/* Testimonials */}
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="border-t border-white/[0.07] pt-4">
              <p className="text-[13px] leading-snug text-white/65 mb-2.5">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-white/30">{t.name}</span>
                <span className="text-[11px] tabular-nums text-white/20">{t.metric}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div className="flex flex-1 flex-col bg-white">
        {/* Mobile header */}
        <div className="flex items-center justify-between border-b border-wire px-6 py-5 lg:hidden">
          <img
            src="/program/static/landing/images/shared/Prtcl.png"
            alt="Protocol"
            width={28}
            height={28}
          />
          <Link href="/login" className="text-[12px] text-dim hover:text-void transition-colors">
            Sign in →
          </Link>
        </div>

        {/* Scrollable form area */}
        <div className="flex flex-1 items-start justify-center px-6 py-7 lg:items-center lg:py-0">
          <div className="w-full max-w-[360px]">

            {/* Mobile social proof slider — above headline */}
            <MobileTestimonialSlider />

            {/* Heading */}
            <div className="mb-8">
              <h1 className="font-display text-[34px] font-normal leading-tight text-void">
                {registrationToken ? "Set your password." : "Start your Protocol."}
              </h1>
              <p className="mt-2 text-[14px] leading-relaxed text-dim">
                {registrationToken
                  ? "Almost there — set a password to access your personalized assessment."
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
            <form onSubmit={handleSubmit} className="space-y-5">

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

              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-mute">
                  Password
                </label>
                <div className="flex items-center rounded-lg border border-wire bg-pebble transition-colors duration-150 focus-within:border-void focus-within:bg-white">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="8+ characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="min-w-0 flex-1 bg-transparent px-4 py-3 text-[14px] text-void placeholder:text-mute focus:outline-none disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="shrink-0 px-3.5 text-mute transition-colors hover:text-dim"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
                {password.length > 0 && strengthInfo && (
                  <div className="flex items-center gap-3 pt-1">
                    <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-wire">
                      <div className={`h-full rounded-full transition-all duration-300 ${strengthInfo.bar}`} />
                    </div>
                    <span className={`shrink-0 text-[11px] font-semibold ${strengthInfo.text}`}>
                      {strengthInfo.label}
                    </span>
                  </div>
                )}
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600">
                  {/* NOTE: depends on exact error string from /api/auth/register (409 response). If that copy changes, update this condition too. */}
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
