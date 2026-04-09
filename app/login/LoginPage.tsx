"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";

type Props = {
  next?: string;
};

export default function LoginPage({ next = "/dashboard" }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        setError("Network error. Please check your connection and try again.");
      } finally {
        setLoading(false);
      }
    },
    [email, password, next]
  );

  return (
    <main className="min-h-screen bg-ash flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="mb-10 flex justify-center">
          <Link href="/f1/offer" aria-label="Protocol Club">
            <Image
              src="/program/static/landing/images/shared/Prtcl.png"
              alt="Protocol"
              width={44}
              height={44}
            />
          </Link>
        </div>

        {/* Card */}
        <div className="rounded-[28px] border border-black/10 bg-white p-8 shadow-sm">

          {/* Header */}
          <div className="mb-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/50">
              Member access
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold text-ink">
              Sign in.
            </h1>
            <p className="mt-2 text-sm text-ink/60">
              Access your Protocol dashboard and assessment.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60">
                Email
              </span>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full rounded-xl border border-black/12 bg-ash px-4 py-3 text-sm text-ink placeholder:text-ink/30 focus:border-black focus:outline-none focus:ring-0 disabled:opacity-50"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60">
                  Password
                </span>
                {/* TODO: implement forgot password */}
                <span className="text-[11px] text-ink/30">
                  Forgot password? Contact support.
                </span>
              </div>
              <input
                type="password"
                autoComplete="current-password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full rounded-xl border border-black/12 bg-ash px-4 py-3 text-sm text-ink placeholder:text-ink/30 focus:border-black focus:outline-none focus:ring-0 disabled:opacity-50"
              />
            </label>

            {error && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 inline-flex items-center justify-center rounded-full border border-black bg-black px-6 py-3.5 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          {/* Footer links */}
          <div className="mt-6 border-t border-black/8 pt-6 text-center">
            <p className="text-sm text-ink/50">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-semibold text-ink underline-offset-2 hover:underline"
              >
                Create one
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-ink/30">
          Secure · Protocol Club member portal
        </p>
      </div>
    </main>
  );
}
