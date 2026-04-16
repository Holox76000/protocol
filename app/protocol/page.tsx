import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { validateSession, SESSION_COOKIE_NAME } from "../../lib/auth";
import { supabaseAdmin } from "../../lib/supabase";
import ProtocolView from "./ProtocolView";
import MetricsPanel from "./MetricsPanel";
import CalibrationReport from "./CalibrationReport";
import type { CalibrationMetrics, OverlayPoints } from "../admin/orders/[userId]/PhotoCalibrator";

export const runtime = "nodejs";

export const metadata = {
  title: "Your Protocol | Protocol Club",
};

async function signedUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabaseAdmin.storage.from("user-photos").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export default async function ProtocolPage() {
  const sessionToken = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!sessionToken) redirect("/login?next=/protocol");

  const user = await validateSession(sessionToken);
  if (!user) redirect("/login?next=/protocol");
  if (!user.has_paid) redirect("/dashboard");
  if (user.protocol_status !== "delivered") redirect("/dashboard");

  const [protocolResult, qrResult] = await Promise.all([
    supabaseAdmin
      .from("protocols")
      .select("content, delivered_at, metrics, overlay_points")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabaseAdmin
      .from("questionnaire_responses")
      .select("photo_front_path, photo_side_path, height_cm")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (!protocolResult.data?.content?.trim()) redirect("/dashboard");

  const protocol        = protocolResult.data;
  const metrics         = (protocol.metrics         as CalibrationMetrics | null) ?? null;
  const overlayPoints   = (protocol.overlay_points  as OverlayPoints | null)      ?? null;
  const qr              = qrResult.data;
  const heightCm        = (qr?.height_cm as number | null) ?? undefined;

  const [photoFront, photoSide] = await Promise.all([
    signedUrl(qr?.photo_front_path as string | null ?? null),
    signedUrl(qr?.photo_side_path  as string | null ?? null),
  ]);

  const deliveredDate = protocol.delivered_at
    ? new Date(protocol.delivered_at as string).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const showCalibrationReport = metrics !== null && (photoFront !== null || photoSide !== null);

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-wire">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Image
            src="/program/static/landing/images/shared/Prtcl.png"
            alt="Protocol"
            width={26}
            height={26}
          />
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-[12px] font-semibold uppercase tracking-[0.12em] text-mute transition-colors hover:text-void"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-6 py-12 pb-24">
        {/* Header */}
        <div className="mb-10 border-b border-wire pb-8">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-mute">
            Personalized Protocol
          </p>
          <h1 className="font-display text-[36px] font-normal leading-tight text-void">
            {user.first_name}&apos;s Protocol
          </h1>
          {deliveredDate && (
            <p className="mt-2 text-[13px] text-dim">Delivered {deliveredDate}</p>
          )}
        </div>

        {/* Quick overview */}
        {metrics && <MetricsPanel metrics={metrics} />}

        {/* Detailed calibration report with photos */}
        {showCalibrationReport && (
          <CalibrationReport
            metrics={metrics}
            points={overlayPoints}
            photoFront={photoFront}
            photoSide={photoSide}
            heightCm={heightCm}
          />
        )}

        {/* Protocol content */}
        <div>
          <ProtocolView content={protocol.content as string} />
        </div>

        {/* Footer help */}
        <div className="mt-16 rounded-2xl border border-wire bg-ash p-6">
          <p className="text-[13px] font-semibold text-void">Questions about your protocol?</p>
          <p className="mt-1 text-[13px] text-dim">
            Reply to any of our emails or write to{" "}
            <a
              href="mailto:contact@protocol-club.com"
              className="text-void underline-offset-2 hover:underline"
            >
              contact@protocol-club.com
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
