"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { AuthUser } from "../../lib/auth";
import { CheckoutPage } from "../checkout/CheckoutPage";

type Props = {
  user: AuthUser;
  submittedAt?: string | null;
};

// ── Shared logout ──────────────────────────────────────────────────────────────

async function doLogout() {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.assign("/");
}

// ── Sidebar (desktop) ──────────────────────────────────────────────────────────

function Sidebar({ user }: { user: AuthUser }) {
  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 w-[216px] flex-col border-r border-wire bg-white z-10">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-wire">
        <Image
          src="/program/static/landing/images/shared/Prtcl.png"
          alt="Protocol"
          width={20}
          height={20}
          className="w-5 h-5 shrink-0"
        />
        <span className="text-[13px] font-semibold text-void">Your Protocol</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2.5">
        <span className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 bg-void text-white cursor-default">
          <GridIcon active />
          <span className="text-[12.5px] font-semibold">Overview</span>
        </span>
        {user.protocol_status === "delivered" && (
          <Link
            href="/protocol"
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-dim hover:bg-ash hover:text-void transition-colors"
          >
            <DocIcon />
            <span className="text-[12.5px] font-medium">My Protocol</span>
          </Link>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-wire px-5 py-4 space-y-2">
        <p className="truncate text-[11px] text-mute">{user.email}</p>
        <button
          onClick={doLogout}
          className="text-[12px] font-medium text-mute hover:text-void transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}

function GridIcon({ active = false }: { active?: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" className={`shrink-0 ${active ? "opacity-80" : "opacity-40"}`}>
      <rect x="0" y="0" width="6" height="6" rx="1" />
      <rect x="8" y="0" width="6" height="6" rx="1" />
      <rect x="0" y="8" width="6" height="6" rx="1" />
      <rect x="8" y="8" width="6" height="6" rx="1" />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" className="shrink-0 opacity-60">
      <rect x="2" y="1" width="10" height="12" rx="1.5" />
      <path d="M4.5 5h5M4.5 7h5M4.5 9h3" strokeLinecap="round" />
    </svg>
  );
}

// ── Mobile header ──────────────────────────────────────────────────────────────

function MobileHeader() {
  return (
    <header className="lg:hidden sticky top-0 z-20 border-b border-wire bg-white">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <Image
            src="/program/static/landing/images/shared/Prtcl.png"
            alt="Protocol"
            width={20}
            height={20}
            className="w-5 h-5 shrink-0"
          />
          <span className="text-[13px] font-semibold text-void">Your Protocol</span>
        </div>
        <button
          onClick={doLogout}
          className="text-[12px] font-medium text-mute hover:text-void transition-colors"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}

// ── Status badge ───────────────────────────────────────────────────────────────

function StatusBadge({ color, label }: { color: "amber" | "blue" | "emerald" | "violet"; label: string }) {
  const styles = {
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    violet: "bg-violet-50 text-violet-700 border-violet-200",
  };
  const dotStyles = {
    amber: "bg-amber-400",
    blue: "bg-blue-400 animate-pulse",
    emerald: "bg-emerald-500",
    violet: "bg-violet-400 animate-pulse",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${styles[color]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotStyles[color]}`} />
      {label}
    </span>
  );
}

// ── Step timeline ──────────────────────────────────────────────────────────────

function StepTimeline({ activeUpTo }: { activeUpTo: number }) {
  const steps = [
    { label: "Assessment", sub: "12–15 min" },
    { label: "Review", sub: "~48h" },
    { label: "Protocol", sub: "Ready" },
  ];

  return (
    <div className="flex items-start">
      {steps.map((step, i) => {
        const done = i < activeUpTo;
        const current = i === activeUpTo;
        const isLast = i === steps.length - 1;

        return (
          <div key={step.label} className="flex flex-1 flex-col items-center">
            {/* Dot + connectors */}
            <div className="flex w-full items-center">
              {i > 0 && (
                <div className={`h-px flex-1 transition-colors ${done || current ? "bg-void" : "bg-wire"}`} />
              )}
              <div
                className={`relative flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                  done
                    ? "border-void bg-void"
                    : current
                    ? "border-void bg-white"
                    : "border-wire bg-white"
                }`}
              >
                {done && (
                  <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                    <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {current && <span className="h-1.5 w-1.5 rounded-full bg-void" />}
              </div>
              {!isLast && (
                <div className={`h-px flex-1 transition-colors ${done ? "bg-void" : "bg-wire"}`} />
              )}
            </div>
            {/* Label */}
            <div className="mt-2 text-center">
              <p className={`text-[10px] font-semibold uppercase tracking-[0.08em] ${current ? "text-void" : "text-mute"}`}>
                {step.label}
              </p>
              <p className={`mt-0.5 text-[10px] ${current ? "text-dim" : "text-mute"}`}>
                {done ? "Done" : step.sub}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Countdown hook ─────────────────────────────────────────────────────────────

function useCountdown(submittedAt: string | null) {
  const deadline = submittedAt
    ? new Date(submittedAt).getTime() + 5 * 60 * 60 * 1000
    : null;

  const getRemaining = useCallback(() => {
    if (!deadline) return 0;
    return Math.max(0, deadline - Date.now());
  }, [deadline]);

  const [remaining, setRemaining] = useState(getRemaining);

  useEffect(() => {
    if (!deadline) return;
    const id = setInterval(() => setRemaining(getRemaining()), 1000);
    return () => clearInterval(id);
  }, [deadline, getRemaining]);

  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1_000);

  return { hours, minutes, seconds, expired: remaining === 0 };
}

// ── Payment success card ───────────────────────────────────────────────────────

function PaymentSuccessCard() {
  const router = useRouter();
  const [gaveUp, setGaveUp] = useState(false);

  useEffect(() => {
    const delays = [1500, 5000, 15000, 30000];
    let i = 0;
    let t: ReturnType<typeof setTimeout>;
    const attempt = () => {
      router.refresh();
      i++;
      if (i < delays.length) { t = setTimeout(attempt, delays[i]); }
      else { setGaveUp(true); }
    };
    t = setTimeout(attempt, delays[0]);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="overflow-hidden rounded-2xl border border-wire bg-white shadow-card">
      <div className="px-7 py-8">
        <div className="mb-5">
          <StatusBadge color="emerald" label="Payment confirmed" />
        </div>
        <h2 className="font-display mb-3 text-[28px] font-normal leading-[1.08] text-void">
          Your spot is secured.
        </h2>
        <p className="mb-6 text-[14px] leading-relaxed text-dim">
          Complete your assessment — we&apos;ll build your personalized Protocol and deliver it within 72 hours.
        </p>
        <StepTimeline activeUpTo={0} />
        {gaveUp && (
          <p className="mt-5 text-[12px] text-mute">
            Payment still processing.{" "}
            <button
              onClick={() => router.refresh()}
              className="font-semibold text-void underline-offset-2 hover:underline"
            >
              Refresh
            </button>
          </p>
        )}
      </div>
      <div className="border-t border-wire px-6 py-5">
        <Link
          href="/questionnaire"
          className="flex w-full items-center justify-between rounded-lg bg-void px-5 py-3 text-[13px] font-semibold text-white transition-all duration-150 hover:bg-[#1a1a1b] active:scale-[0.99]"
        >
          <span>Start assessment</span>
          <span className="text-white/50">→</span>
        </Link>
      </div>
    </div>
  );
}

// ── Refinement card ────────────────────────────────────────────────────────────

function RefinementCard({ submittedAt }: { submittedAt: string | null }) {
  const { hours, minutes, seconds, expired } = useCountdown(submittedAt);
  const [finalizing, setFinalizing] = useState(false);

  const handleFinalize = async () => {
    setFinalizing(true);
    await fetch("/api/questionnaire/finalize", { method: "POST" });
    window.location.reload();
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-wire bg-white shadow-card">
      <div className="px-7 py-8">
        <div className="mb-5">
          <StatusBadge color="amber" label="Refinement window open" />
        </div>
        <h2 className="font-display text-[28px] font-normal leading-[1.08] text-void mb-3">
          Your answers are in.
        </h2>
        <p className="text-[14px] leading-relaxed text-dim mb-6">
          You have a short window to review and adjust before we lock in your submission and start building your Protocol.
        </p>

        {!expired ? (
          <div className="mb-6 inline-flex overflow-hidden rounded-xl border border-wire bg-pebble">
            {[
              { value: hours, label: "h" },
              { value: minutes, label: "m" },
              { value: seconds, label: "s" },
            ].map(({ value, label }, i) => (
              <div
                key={label}
                className={`flex items-baseline gap-0.5 px-5 py-3.5 ${i > 0 ? "border-l border-wire" : ""}`}
              >
                <span className="font-display text-[28px] font-normal tabular-nums leading-none text-void">
                  {String(value).padStart(2, "0")}
                </span>
                <span className="ml-0.5 text-[11px] font-semibold text-mute">{label}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="mb-6 rounded-xl border border-wire bg-pebble px-5 py-4">
            <p className="text-[13.5px] leading-relaxed text-dim">
              Your refinement window has closed. Your answers are being finalized.
            </p>
          </div>
        )}

        <StepTimeline activeUpTo={0} />
      </div>

      <div className="flex flex-col gap-2.5 border-t border-wire px-6 py-5">
        <Link
          href="/questionnaire"
          className="flex w-full items-center justify-between rounded-lg border border-wire px-5 py-3 text-[13px] font-semibold text-void transition-all duration-150 hover:border-void/30 hover:bg-pebble active:scale-[0.99]"
        >
          <span>Review and edit my answers</span>
          <span className="text-mute">→</span>
        </Link>
        {!expired && (
          <button
            type="button"
            onClick={handleFinalize}
            disabled={finalizing}
            className="flex w-full items-center justify-center rounded-lg bg-void px-5 py-3 text-[13px] font-semibold text-white transition-all duration-150 hover:bg-[#1a1a1b] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {finalizing ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/25 border-t-white" />
                Finalizing…
              </span>
            ) : (
              "Skip — finalize my answers now"
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Status card ────────────────────────────────────────────────────────────────

function StatusCard({ user, submittedAt }: { user: AuthUser; submittedAt?: string | null }) {
  const s = user.protocol_status;

  if (s === "not_started" || s === "questionnaire_in_progress") {
    const inProgress = s === "questionnaire_in_progress";
    return (
      <div className="overflow-hidden rounded-2xl border border-wire bg-white shadow-card">
        <div className="px-7 py-8">
          <div className="mb-5">
            <StatusBadge color="amber" label={inProgress ? "In progress" : "Assessment needed"} />
          </div>
          <h2 className="font-display text-[28px] font-normal leading-[1.08] text-void mb-3">
            {inProgress ? "Continue your assessment." : "Start your assessment."}
          </h2>
          <p className="text-[14px] leading-relaxed text-dim mb-6">
            {inProgress
              ? "You've started the assessment — pick up where you left off."
              : "Complete a 12–15 minute assessment. We'll use your answers to build a fully personalized Attractiveness Protocol."}
          </p>
          <StepTimeline activeUpTo={0} />
        </div>
        <div className="border-t border-wire px-6 py-5">
          <Link
            href="/questionnaire"
            className="flex w-full items-center justify-between rounded-lg bg-void px-5 py-3 text-[13px] font-semibold text-white transition-all duration-150 hover:bg-[#1a1a1b] active:scale-[0.99]"
          >
            <span>{inProgress ? "Continue assessment" : "Start assessment"}</span>
            <span className="text-white/50">→</span>
          </Link>
        </div>
      </div>
    );
  }

  if (s === "questionnaire_submitted") {
    return <RefinementCard submittedAt={submittedAt ?? null} />;
  }

  if (s === "in_review") {
    return (
      <div className="overflow-hidden rounded-2xl border border-wire bg-white shadow-card">
        <div className="px-7 py-8">
          <div className="mb-5">
            <StatusBadge color="violet" label="Under review" />
          </div>
          <h2 className="font-display text-[28px] font-normal leading-[1.08] text-void mb-3">
            We&apos;re working on it.
          </h2>
          <p className="text-[14px] leading-relaxed text-dim mb-6">
            Your assessment is being analyzed. Our team may reach out with a few additional questions or to clarify your photos — if so, expect an email within 48 hours.
          </p>
          <StepTimeline activeUpTo={1} />
          <div className="mt-5 rounded-xl border border-wire bg-pebble px-5 py-4 text-[13px] leading-relaxed text-dim">
            <span className="font-semibold text-void">Timeline:</span>{" "}
            review takes up to 2 days, then your Protocol is delivered within 72 hours.
          </div>
        </div>
        <div className="border-t border-wire px-6 py-5">
          <p className="text-[12px] text-mute">
            Questions?{" "}
            <a
              href="mailto:contact@protocol-club.com"
              className="font-semibold text-void underline-offset-2 hover:underline"
            >
              contact@protocol-club.com
            </a>
          </p>
        </div>
      </div>
    );
  }

  if (s === "delivered") {
    return (
      <div className="overflow-hidden rounded-2xl border border-wire bg-white shadow-card">
        <div className="px-7 py-8">
          <div className="mb-5">
            <StatusBadge color="emerald" label="Protocol delivered" />
          </div>
          <h2 className="font-display text-[28px] font-normal leading-[1.08] text-void mb-3">
            Your Protocol is ready.
          </h2>
          <p className="text-[14px] leading-relaxed text-dim mb-6">
            Your personalized Attractiveness Protocol is ready to view.
          </p>
          <StepTimeline activeUpTo={2} />
        </div>
        <div className="border-t border-wire px-6 py-5">
          <Link
            href="/protocol"
            className="flex w-full items-center justify-between rounded-lg bg-void px-5 py-3 text-[13px] font-semibold text-white transition-all duration-150 hover:bg-[#1a1a1b] active:scale-[0.99]"
          >
            <span>View your Protocol</span>
            <span className="text-white/50">→</span>
          </Link>
        </div>
      </div>
    );
  }

  return null;
}

// ── Set password banner ────────────────────────────────────────────────────────

function SetPasswordBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [view, setView] = useState<"banner" | "form" | "done">("banner");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/set-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) { setError(data.error ?? "Something went wrong."); return; }
      setView("done");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (dismissed) return null;

  if (view === "done") {
    return (
      <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3.5 text-[13px] text-emerald-700">
        Password set. You can now log in with email and password.
      </div>
    );
  }

  return (
    <div className="mb-5 overflow-hidden rounded-xl border border-wire bg-white px-5 py-4 shadow-card">
      {view === "banner" && (
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[13px] font-semibold text-void">Set a password</p>
            <p className="mt-0.5 text-[12px] text-dim">Log in without a link next time.</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setView("form")}
              className="rounded-lg bg-void px-3.5 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-[#1a1a1b]"
            >
              Set password
            </button>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="text-[11px] text-mute transition-colors hover:text-void"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      {view === "form" && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <p className="text-[13px] font-semibold text-void">Choose a password</p>
          <input
            type="password"
            autoComplete="new-password"
            placeholder="8+ characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            disabled={loading}
            autoFocus
            className="w-full rounded-lg border border-wire bg-pebble px-4 py-2.5 text-[14px] text-void placeholder:text-mute focus:border-void focus:bg-white focus:outline-none disabled:opacity-50"
          />
          {error && <p className="text-[12px] text-red-600">{error}</p>}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading || password.length < 8}
              className="rounded-lg bg-void px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-[#1a1a1b] disabled:opacity-40"
            >
              {loading ? "Saving…" : "Save password"}
            </button>
            <button
              type="button"
              onClick={() => { setView("banner"); setPassword(""); setError(null); }}
              className="text-[12px] text-mute hover:text-void"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function DashboardPage({ user, submittedAt }: Props) {
  const searchParams = useSearchParams();
  const paymentSuccess = searchParams.get("payment") === "success";

  const showCheckout = !user.has_paid && !paymentSuccess;
  const showPaymentSuccess = !user.has_paid && paymentSuccess;

  if (showCheckout) {
    return <CheckoutPage email={user.email} />;
  }

  if (showPaymentSuccess) {
    return (
      <main className="flex min-h-screen flex-col bg-white">
        <nav className="border-b border-wire">
          <div className="mx-auto flex max-w-[920px] items-center justify-center px-6 py-4">
            <Image
              src="/program/static/landing/images/shared/Prtcl.png"
              alt="Protocol"
              width={30}
              height={30}
            />
          </div>
        </nav>
        <div className="flex flex-1 items-center justify-center px-6 py-16">
          <div className="w-full max-w-[440px]">
            <PaymentSuccessCard />
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-pebble lg:pl-[216px]">
      <Sidebar user={user} />
      <MobileHeader />

      <main className="px-5 py-10 sm:px-8 sm:py-12">
        <div className="mx-auto max-w-[580px]">
          {!user.has_password && <SetPasswordBanner />}

          {/* Page header */}
          <div className="mb-8">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-mute">
              Overview
            </p>
            <h1
              className="font-display leading-[1.05] text-void"
              style={{ fontSize: "clamp(30px, 5vw, 38px)" }}
            >
              Welcome, {user.first_name}.
            </h1>
          </div>

          <StatusCard user={user} submittedAt={submittedAt} />

          {/* Help */}
          <div className="mt-4 rounded-2xl border border-wire bg-white px-6 py-5 shadow-card">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-mute">
              Need help?
            </p>
            <p className="text-[13.5px] leading-relaxed text-dim">
              Questions about your Protocol?{" "}
              <a
                href="mailto:contact@protocol-club.com"
                className="font-semibold text-void underline-offset-2 hover:underline"
              >
                Email us
              </a>{" "}
              or reply to any email we&apos;ve sent you.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
