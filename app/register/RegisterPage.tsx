"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";

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
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);

      // Client-side validation
      if (!email.trim() || !firstName.trim()) {
        setError("Email and first name are required.");
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords don't match.");
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

        window.location.assign("/dashboard");
      } catch {
        setError("Network error. Please check your connection and try again.");
      } finally {
        setLoading(false);
      }
    },
    [email, firstName, password, confirmPassword, registrationToken]
  );

  const passwordStrength =
    password.length === 0
      ? null
      : password.length < 8
      ? "weak"
      : password.length < 12
      ? "good"
      : "strong";

  return (
    <main className="min-h-screen bg-ash px-6 py-16">
      <div className="mx-auto max-w-[420px]">

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
              {registrationToken ? "Payment confirmed" : "Create account"}
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold text-ink">
              {registrationToken
                ? "Welcome to Protocol Club."
                : "Create your account."}
            </h1>
            <p className="mt-2 text-sm text-ink/60">
              {registrationToken
                ? "Your payment is confirmed. Set a password to access your personalized assessment."
                : "Already paid? Enter your email and create a password to access your Protocol."}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60">
                First name
              </span>
              <input
                type="text"
                autoComplete="given-name"
                placeholder="Thomas"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                disabled={loading}
                className="w-full rounded-xl border border-black/12 bg-ash px-4 py-3 text-sm text-ink placeholder:text-ink/30 focus:border-black focus:outline-none focus:ring-0 disabled:opacity-50"
              />
            </label>

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
                disabled={loading || (!!prefillEmail && !!registrationToken)}
                className="w-full rounded-xl border border-black/12 bg-ash px-4 py-3 text-sm text-ink placeholder:text-ink/30 focus:border-black focus:outline-none focus:ring-0 disabled:opacity-60"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60">
                Password
              </span>
              <input
                type="password"
                autoComplete="new-password"
                placeholder="8+ characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full rounded-xl border border-black/12 bg-ash px-4 py-3 text-sm text-ink placeholder:text-ink/30 focus:border-black focus:outline-none focus:ring-0 disabled:opacity-50"
              />
              {passwordStrength && (
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex gap-1">
                    {["weak", "good", "strong"].map((level, i) => (
                      <div
                        key={level}
                        className={`h-1 w-8 rounded-full transition-colors ${
                          passwordStrength === "weak" && i === 0
                            ? "bg-red-400"
                            : passwordStrength === "good" && i <= 1
                            ? "bg-yellow-400"
                            : passwordStrength === "strong"
                            ? "bg-green-400"
                            : "bg-black/10"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] text-ink/40 capitalize">
                    {passwordStrength}
                  </span>
                </div>
              )}
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60">
                Confirm password
              </span>
              <input
                type="password"
                autoComplete="new-password"
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              {loading ? "Creating account…" : "Create my account"}
            </button>
          </form>

          {/* Footer links */}
          <div className="mt-6 border-t border-black/8 pt-6 text-center">
            <p className="text-sm text-ink/50">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-ink underline-offset-2 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Trust */}
        <p className="mt-6 text-center text-[11px] text-ink/30">
          Secure · No spam · Cancel anytime
        </p>
      </div>
    </main>
  );
}
