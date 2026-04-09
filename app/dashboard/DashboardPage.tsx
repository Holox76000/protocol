"use client";

import Link from "next/link";
import Image from "next/image";
import type { AuthUser } from "../../lib/auth";

type Props = {
  user: AuthUser;
};

function LogoutButton() {
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/");
  };

  return (
    <button
      onClick={handleLogout}
      className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/40 hover:text-ink transition"
    >
      Sign out
    </button>
  );
}

function StatusCard({ user }: { user: AuthUser }) {
  const status = user.protocol_status;

  if (status === "not_started" || status === "questionnaire_in_progress") {
    return (
      <div className="rounded-[24px] border border-black/10 bg-white p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-2 w-2 rounded-full bg-yellow-400" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/50">
            Assessment needed
          </p>
        </div>
        <h2 className="font-display text-2xl font-semibold text-ink mb-3">
          Your Protocol
        </h2>
        <p className="text-sm text-ink/60 leading-relaxed mb-8 max-w-md">
          To build your personalized Attractiveness Protocol, we need you to
          complete a detailed assessment. It takes about 12–15 minutes and
          includes measurements and photos.
        </p>
        <Link
          href="/questionnaire"
          className="inline-flex items-center justify-center rounded-full border border-black bg-black px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white hover:text-black"
        >
          {status === "questionnaire_in_progress"
            ? "Continue my assessment →"
            : "Complete my assessment →"}
        </Link>
      </div>
    );
  }

  if (status === "questionnaire_submitted" || status === "in_review") {
    return (
      <div className="rounded-[24px] border border-black/10 bg-white p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/50">
            In progress
          </p>
        </div>
        <h2 className="font-display text-2xl font-semibold text-ink mb-3">
          Your Protocol
        </h2>
        <p className="text-sm text-ink/60 leading-relaxed mb-2 max-w-md">
          Your assessment has been received. Our team is now analyzing your
          measurements, photos, and context to build a Protocol tailored to you.
        </p>
        <p className="text-sm text-ink/40 mb-8">
          Expected delivery: within 48–72 hours from submission.
        </p>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/30">
          You&apos;ll receive an email when your Protocol is ready.
        </p>
      </div>
    );
  }

  if (status === "delivered") {
    return (
      <div className="rounded-[24px] border border-black/10 bg-white p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-2 w-2 rounded-full bg-green-400" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/50">
            Delivered
          </p>
        </div>
        <h2 className="font-display text-2xl font-semibold text-ink mb-3">
          Your Protocol is ready.
        </h2>
        <p className="text-sm text-ink/60 leading-relaxed mb-8 max-w-md">
          Your personalized Attractiveness Protocol has been delivered to your
          email. Check your inbox.
        </p>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/30">
          Can&apos;t find it? Reply to any Protocol Club email and we&apos;ll
          resend it.
        </p>
      </div>
    );
  }

  return null;
}

export default function DashboardPage({ user }: Props) {
  return (
    <main className="min-h-screen bg-ash">
      {/* Nav */}
      <header className="border-b border-black/8 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/f1/offer">
            <Image
              src="/program/static/landing/images/shared/Prtcl.png"
              alt="Protocol"
              width={36}
              height={36}
            />
          </Link>
          <LogoutButton />
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-6 py-12">
        {/* Welcome */}
        <div className="mb-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/40">
            Your dashboard
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-ink">
            Welcome, {user.first_name}.
          </h1>
        </div>

        {/* Protocol status card */}
        <StatusCard user={user} />

        {/* Help */}
        <div className="mt-6 rounded-[20px] border border-black/8 bg-white px-8 py-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/40 mb-3">
            Need help?
          </p>
          <p className="text-sm text-ink/60 leading-relaxed">
            Questions about your Protocol or assessment?{" "}
            <a
              href="mailto:support@protocol-club.com"
              className="font-semibold text-ink underline-offset-2 hover:underline"
            >
              Email us
            </a>
            . You can also reply to any email we&apos;ve sent you.
          </p>
        </div>
      </div>
    </main>
  );
}
