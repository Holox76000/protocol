"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { AuthUser } from "../../lib/auth";
import { CheckoutPage } from "../checkout/CheckoutPage";

type Props = {
  user: AuthUser;
  submittedAt?: string | null;
};

function LogoutButton() {
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/");
  };
  return (
    <button
      onClick={handleLogout}
      className="text-[12px] font-medium text-mute transition-colors hover:text-void"
    >
      Sign out
    </button>
  );
}

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

function StepBar({ activeUpTo }: { activeUpTo: number }) {
  const steps = ["Assessment", "Review", "Protocol"];
  return (
    <div className="flex items-stretch overflow-hidden rounded-lg border border-wire">
      {steps.map((step, i) => {
        const active = i <= activeUpTo;
        const current = i === activeUpTo;
        return (
          <div
            key={step}
            className={`flex-1 border-r border-wire last:border-0 px-3 py-2.5 text-center transition-colors ${
              active ? "bg-void" : "bg-pebble"
            }`}
          >
            <span className={`block text-[10px] font-semibold uppercase tracking-[0.12em] ${active ? "text-white" : "text-mute"}`}>
              {step}
            </span>
            <span className={`mt-0.5 block text-[10px] ${active ? "text-white/50" : "text-mute"}`}>
              {i === 0 ? (activeUpTo >= 1 ? "Done" : "Now") :
               i === 1 ? (activeUpTo >= 2 ? "Done" : activeUpTo >= 1 ? "Now" : "~2 days") :
               activeUpTo >= 2 ? "✓" : "72h"}
            </span>
            {current && (
              <div className="mx-auto mt-1.5 h-px w-4 bg-white/40" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Payment success ────────────────────────────────────────────────────────────
// CheckoutPage extracted to app/checkout/CheckoutPage.tsx

// ── Payment success ────────────────────────────────────────────────────────────

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
    <div className="w-full max-w-md overflow-hidden rounded-2xl border border-wire bg-white shadow-card">
      <div className="px-7 py-7">
        <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="text-[11px] font-semibold text-emerald-700">Payment confirmed</span>
        </div>
        <h2 className="font-display mb-3 text-[28px] font-normal leading-[1.08] text-void">
          Your spot is secured.
        </h2>
        <p className="text-[14px] leading-relaxed text-dim">
          Complete your assessment — we&apos;ll build your personalized Protocol and deliver it within 72 hours.
        </p>
        {gaveUp && (
          <p className="mt-4 text-[12px] text-mute">
            Payment still processing.{" "}
            <button
              onClick={() => router.refresh()}
              className="font-semibold text-void underline-offset-2 hover:underline"
            >
              Refresh
            </button>{" "}
            if you don&apos;t see changes.
          </p>
        )}
      </div>
      <div className="border-t border-wire px-6 py-5">
        <StepBar activeUpTo={0} />
        <Link
          href="/questionnaire"
          className="mt-4 flex w-full items-center justify-between rounded-lg bg-void px-5 py-3 text-[13px] font-semibold text-white transition-all duration-150 hover:bg-[#1a1a1b] active:scale-[0.99]"
        >
          <span>Start assessment</span>
          <span className="text-white/50">→</span>
        </Link>
      </div>
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
      <div className="px-6 pt-6 pb-5">
        <div className="mb-5"><StatusBadge color="amber" label="Refinement window open" /></div>
        <h2 className="font-display text-[24px] font-normal leading-tight text-void mb-2">
          Your answers are in.
        </h2>
        <p className="text-[13.5px] leading-relaxed text-dim mb-5">
          You have a short window to review and adjust before we lock in your submission and begin building your Protocol.
        </p>

        {!expired ? (
          <div className="mb-5 flex items-center gap-3">
            <div className="flex items-baseline gap-0.5 rounded-lg border border-wire bg-pebble px-4 py-2.5">
              <span className="font-display text-[26px] font-normal tabular-nums text-void leading-none">{String(hours).padStart(2, "0")}</span>
              <span className="text-[11px] font-semibold text-mute mx-1">h</span>
              <span className="font-display text-[26px] font-normal tabular-nums text-void leading-none">{String(minutes).padStart(2, "0")}</span>
              <span className="text-[11px] font-semibold text-mute mx-1">m</span>
              <span className="font-display text-[26px] font-normal tabular-nums text-void leading-none">{String(seconds).padStart(2, "0")}</span>
              <span className="text-[11px] font-semibold text-mute ml-1">s</span>
            </div>
            <p className="text-[12px] leading-snug text-dim">remaining<br />to refine</p>
          </div>
        ) : (
          <div className="mb-5 rounded-lg border border-wire bg-pebble px-4 py-3">
            <p className="text-[13px] text-dim">Your refinement window has closed. Your answers are being finalized.</p>
          </div>
        )}

        <StepBar activeUpTo={0} />
      </div>

      <div className="border-t border-wire px-6 py-4 flex flex-col gap-2.5">
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
            ) : "Skip — finalize my answers now"}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Status card (paid users) ───────────────────────────────────────────────────

function StatusCard({ user, submittedAt }: { user: AuthUser; submittedAt?: string | null }) {
  const s = user.protocol_status;

  if (s === "not_started" || s === "questionnaire_in_progress") {
    const inProgress = s === "questionnaire_in_progress";
    return (
      <div className="overflow-hidden rounded-2xl border border-wire bg-white shadow-card">
        <div className="px-6 pt-6 pb-5">
          <div className="mb-5">
            <StatusBadge color="amber" label={inProgress ? "In progress" : "Assessment needed"} />
          </div>
          <h2 className="font-display text-[24px] font-normal leading-tight text-void mb-2">
            Your Protocol
          </h2>
          <p className="text-[13.5px] leading-relaxed text-dim mb-5">
            {inProgress
              ? "You started your assessment — pick up where you left off."
              : "Complete a 12–15 minute assessment to receive your personalized Attractiveness Protocol."}
          </p>
          <div className="mb-5"><StepBar activeUpTo={0} /></div>
        </div>
        <div className="border-t border-wire px-6 py-4">
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
        <div className="px-6 pt-6 pb-5">
          <div className="mb-5"><StatusBadge color="violet" label="Under review" /></div>
          <h2 className="font-display text-[24px] font-normal leading-tight text-void mb-2">
            We&apos;re working on it.
          </h2>
          <p className="text-[13.5px] leading-relaxed text-dim mb-5">
            Your assessment is being analyzed. Our team may reach out with a few additional questions or to clarify your photos — if so, expect an email within 48 hours.
          </p>
          <div className="mb-5"><StepBar activeUpTo={1} /></div>
          <div className="rounded-lg border border-wire bg-pebble px-4 py-3 text-[12.5px] leading-relaxed text-dim">
            <span className="font-semibold text-void">Timeline: </span>
            review takes up to 2 days, then your Protocol is delivered within 72 hours.
          </div>
        </div>
        <div className="border-t border-wire px-6 py-4">
          <p className="text-[12px] font-medium text-mute">
            Questions? Reply to any of our emails or write to{" "}
            <a href="mailto:contact@protocol-club.com" className="text-void underline-offset-2 hover:underline">
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
        <div className="px-6 pt-6 pb-5">
          <div className="mb-5"><StatusBadge color="emerald" label="Delivered" /></div>
          <h2 className="font-display text-[24px] font-normal leading-tight text-void mb-2">
            Your Protocol is ready.
          </h2>
          <p className="text-[13.5px] leading-relaxed text-dim mb-5">
            Your personalized Attractiveness Protocol is available below.
          </p>
          <StepBar activeUpTo={2} />
        </div>
        <div className="border-t border-wire px-6 py-4">
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

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      setView("done");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (dismissed || view === "done") {
    return view === "done" ? (
      <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-700">
        Password set. You can now log in with email and password.
      </div>
    ) : null;
  }

  return (
    <div className="mb-6 rounded-xl border border-wire bg-white px-5 py-4 shadow-card">
      {view === "banner" && (
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[13px] font-semibold text-void">Set a password</p>
            <p className="mt-0.5 text-[12px] text-dim">
              Log in without a link next time.
            </p>
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
          {error && (
            <p className="text-[12px] text-red-600">{error}</p>
          )}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading || password.length < 8}
              className="rounded-lg bg-void px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-[#1a1a1b] disabled:opacity-40"
            >
              {loading ? "Saving..." : "Save password"}
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

  // Unpaid: full Qoves-style checkout layout
  if (showCheckout) {
    return <CheckoutPage email={user.email} />;
  }

  // Post-payment: centered confirmation card on white
  if (showPaymentSuccess) {
    return (
      <main className="flex min-h-screen flex-col bg-white">
        <nav className="border-b border-gray-100">
          <div className="mx-auto flex max-w-[920px] items-center justify-between px-6 py-4">
            <div />
            <Image
              src="/program/static/landing/images/shared/Prtcl.png"
              alt="Protocol"
              width={30}
              height={30}
            />
          </div>
        </nav>
        <div className="flex flex-1 items-center justify-center px-6 py-16">
          <PaymentSuccessCard />
        </div>
      </main>
    );
  }

  // Paid: existing dashboard
  return (
    <main className="min-h-screen bg-pebble">
      <header className="border-b border-wire bg-white">
        <div className="mx-auto flex max-w-[600px] items-center justify-between px-6 py-4">
          <Link href="/f1/offer">
            <Image
              src="/program/static/landing/images/shared/Prtcl.png"
              alt="Protocol"
              width={30}
              height={30}
            />
          </Link>
          <LogoutButton />
        </div>
      </header>

      <div className="mx-auto max-w-[600px] px-6 py-10">
        {!user.has_password && <SetPasswordBanner />}
        <div className="mb-8">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-mute">
            Dashboard
          </p>
          <h1
            className="font-display leading-[1.05] text-void"
            style={{ fontSize: "clamp(32px, 5vw, 40px)" }}
          >
            Welcome,<br />{user.first_name}.
          </h1>
        </div>

        <StatusCard user={user} submittedAt={submittedAt} />

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
            </a>
            {" "}or reply to any email we&apos;ve sent you.
          </p>
        </div>
      </div>
    </main>
  );
}
