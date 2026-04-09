"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";

type Props = {
  next?: string;
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

export default function LoginPage({ next = "/dashboard" }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);
      setLoading(true);

      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), password }),
        });

        const data = (await res.json()) as { error?: string };

        if (!res.ok) {
          setError(data.error ?? "Invalid email or password.");
          return;
        }

        window.location.assign(next);
      } catch {
        setError("Network error. Please check your connection.");
      } finally {
        setLoading(false);
      }
    },
    [email, password, next]
  );

  return (
    <div className="flex min-h-screen">

      {/* ── Left panel: dark editorial ── */}
      <div className="hidden lg:flex lg:w-[440px] xl:w-[480px] shrink-0 flex-col justify-between bg-void px-10 py-10">
        <Link href="/f1/offer" aria-label="Protocol Club">
          <Image
            src="/program/static/landing/images/shared/Prtcl.png"
            alt="Protocol"
            width={32}
            height={32}
            className="opacity-90"
          />
        </Link>

        <div>
          <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/30">
            Protocol Club
          </p>
          <h2 className="font-display text-[38px] xl:text-[44px] font-normal leading-[1.08] text-white">
            Physical attractiveness<br />
            is an engineering<br />
            problem.
          </h2>
          <p className="mt-6 text-[14px] leading-relaxed text-white/40 max-w-[340px]">
            A full-body analysis with the precision of aesthetic medicine. Personalized to your face, frame, and context.
          </p>
        </div>

        <div className="space-y-3">
          {[
            "Based on 200+ peer-reviewed studies",
            "Personalized to your face, frame & age",
            "Protocol delivered within 72 hours",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3">
              <div className="h-px w-4 bg-white/20" />
              <span className="text-[12px] text-white/30">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div className="flex flex-1 flex-col bg-white">
        {/* Mobile logo */}
        <div className="flex items-center justify-between border-b border-wire px-6 py-5 lg:hidden">
          <Link href="/f1/offer" aria-label="Protocol Club">
            <Image
              src="/program/static/landing/images/shared/Prtcl.png"
              alt="Protocol"
              width={28}
              height={28}
            />
          </Link>
          <Link href="/register" className="text-[12px] text-dim hover:text-void transition-colors">
            Create account →
          </Link>
        </div>

        {/* Form area */}
        <div className="flex flex-1 items-center justify-center px-6 py-12 lg:py-0">
          <div className="w-full max-w-[360px]">

            {/* Heading */}
            <div className="mb-8">
              <h1 className="font-display text-[34px] font-normal leading-tight text-void">
                Welcome back.
              </h1>
              <p className="mt-2 text-[14px] leading-relaxed text-dim">
                Sign in to your Protocol dashboard.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">

              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-mute">
                  Email
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  autoFocus
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full rounded-lg border border-wire bg-pebble px-4 py-3 text-[14px] text-void placeholder:text-mute transition-colors duration-150 focus:border-void focus:bg-white focus:outline-none disabled:opacity-50"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-mute">
                    Password
                  </label>
                  <span className="text-[11px] text-mute">Forgot? Contact support.</span>
                </div>
                <div className="flex items-center rounded-lg border border-wire bg-pebble transition-colors duration-150 focus-within:border-void focus-within:bg-white">
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Your password"
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
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-void py-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-white transition-all duration-150 hover:bg-[#1a1a1b] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/25 border-t-white" />
                    Signing in
                  </span>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            {/* Footer */}
            <p className="mt-6 text-center text-[13px] text-dim">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-semibold text-void underline-offset-2 hover:underline">
                Create one
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="hidden lg:flex items-center justify-between border-t border-wire px-8 py-4">
          <span className="text-[11px] text-mute">Secure · Protocol Club</span>
          <Link href="/register" className="text-[11px] text-mute hover:text-void transition-colors">
            Create account →
          </Link>
        </div>
      </div>
    </div>
  );
}
