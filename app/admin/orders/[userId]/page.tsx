import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "../../../../lib/adminAuth";
import { supabaseAdmin } from "../../../../lib/supabase";
import OrderPhotoViewer from "./OrderPhotoViewer";
import ProtocolWorkflow from "./ProtocolWorkflow";
import MetricsPanel from "../../../protocol/MetricsPanel";
import type { OverlayPoints, CalibrationMetrics } from "./PhotoCalibrator";
import type { ProtocolQuestionnaire } from "./ProtocolEditor";

export const runtime = "nodejs";

async function signedUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabaseAdmin.storage
    .from("user-photos")
    .createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-mute">{label}</dt>
      <dd className="text-[13px] text-void">{value}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-4 border-b border-wire pb-2 font-display text-[13px] font-semibold uppercase tracking-[0.14em] text-void">
        {title}
      </h3>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4">{children}</dl>
    </div>
  );
}

// 5h refinement window + 2 days review + 3 days delivery = 125 hours
const DELIVERY_DEADLINE_MS = 125 * 60 * 60 * 1000;

function getDueDate(submittedAt: string | null): Date | null {
  if (!submittedAt) return null;
  return new Date(new Date(submittedAt).getTime() + DELIVERY_DEADLINE_MS);
}

const STATUS_COLORS: Record<string, string> = {
  not_started: "bg-pebble text-dim",
  questionnaire_in_progress: "bg-amber-50 text-amber-700",
  questionnaire_submitted: "bg-amber-50 text-amber-700",
  in_review: "bg-violet-50 text-violet-700",
  delivered: "bg-emerald-50 text-emerald-700",
};
const STATUS_LABELS: Record<string, string> = {
  not_started: "Not started",
  questionnaire_in_progress: "In progress",
  questionnaire_submitted: "Submitted",
  in_review: "In review",
  delivered: "Delivered",
};

function arr(v: unknown): string {
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "string") return v;
  return "";
}

export default async function OrderDetailPage({
  params,
}: {
  params: { userId: string };
}) {
  await requireAdmin();

  const { userId } = params;

  const [userResult, qrResult, protocolResult] = await Promise.all([
    supabaseAdmin
      .from("users")
      .select("id, email, first_name, protocol_status, created_at, stripe_customer_id")
      .eq("id", userId)
      .maybeSingle(),
    supabaseAdmin
      .from("questionnaire_responses")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
    supabaseAdmin
      .from("protocols")
      .select("content, delivered_at, overlay_points, metrics, before_after_preview_path")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  if (!userResult.data) notFound();

  const user = userResult.data;
  const qr = (qrResult.data ?? {}) as Record<string, unknown>;
  const protocolContent       = (protocolResult.data?.content                  as string)                    ?? "";
  const overlayPoints         = (protocolResult.data?.overlay_points           as OverlayPoints | null)       ?? null;
  const calibrationMetrics    = (protocolResult.data?.metrics                  as CalibrationMetrics | null)  ?? null;
  const beforeAfterPreviewPath = (protocolResult.data?.before_after_preview_path as string | null)            ?? null;
  const status = user.protocol_status as string;

  const submittedAt = qr.submitted_at as string | null;
  const due = getDueDate(submittedAt);
  const isDelivered = status === "delivered";
  const isOverdue = due && !isDelivered && due.getTime() < Date.now();
  const hoursLeft = due && !isDelivered ? Math.floor((due.getTime() - Date.now()) / (60 * 60 * 1000)) : null;

  const questionnaire: ProtocolQuestionnaire = {
    firstName:          user.first_name as string | undefined,
    goal:               qr.goal               as string | undefined,
    age:                qr.age                as number | undefined,
    height_cm:          qr.height_cm          as number | undefined,
    weight_kg:          qr.weight_kg          as number | undefined,
    trainingExperience: qr.training_experience as string | undefined,
    trainingLocation:   qr.training_location   as string | undefined,
    sessionsPerWeek:    qr.sessions_per_week   as number | undefined,
    preferredActivities: Array.isArray(qr.preferred_activities) ? qr.preferred_activities as string[] : undefined,
    concernAreas:       Array.isArray(qr.concern_areas) ? qr.concern_areas as string[] : undefined,
    professionalEnv:    qr.professional_environment as string | undefined,
    injuries:           Array.isArray(qr.injuries) ? qr.injuries as string[] : undefined,
    dietaryProfile:     qr.dietary_profile    as string | undefined,
    sleepHours:         qr.sleep_hours        as string | undefined,
    stressLevel:        qr.stress_level       as number | undefined,
  };

  const [photoFront, photoSide, photoBack, photoFace] = await Promise.all([
    signedUrl(qr.photo_front_path as string | null),
    signedUrl(qr.photo_side_path as string | null),
    signedUrl(qr.photo_back_path as string | null),
    signedUrl(qr.photo_face_path as string | null),
  ]);

  return (
    <main className="min-h-screen bg-ash px-6 py-10">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link
              href="/admin"
              className="mb-2 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-mute hover:text-void"
            >
              ← Orders
            </Link>
            <h1 className="font-display text-2xl text-void">{user.first_name as string}</h1>
            <p className="text-[13px] text-dim">{user.email as string}</p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${STATUS_COLORS[status] ?? "bg-pebble text-dim"}`}
          >
            {STATUS_LABELS[status] ?? status}
          </span>
        </div>

        {/* Two-column layout */}
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">

          {/* Left — questionnaire + photos */}
          <div className="space-y-6">

            {/* Client info */}
            <div className="rounded-2xl border border-wire bg-white p-6">
              {/* Due date banner — only when pending */}
              {due && !isDelivered && (
                <div className={`mb-5 flex items-center justify-between rounded-xl px-4 py-3 ${
                  isOverdue
                    ? "bg-red-50 text-red-700"
                    : (hoursLeft ?? 999) < 48
                    ? "bg-amber-50 text-amber-700"
                    : "bg-emerald-50 text-emerald-700"
                }`}>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] opacity-70">
                      {isOverdue ? "Overdue since" : "Deliver by"}
                    </p>
                    <p className="mt-0.5 text-[15px] font-semibold">
                      {due.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                    </p>
                  </div>
                  <p className="text-[12px] font-semibold">
                    {isOverdue
                      ? `${Math.abs(hoursLeft ?? 0)}h overdue`
                      : (hoursLeft ?? 0) < 24
                      ? `${hoursLeft}h left`
                      : `${Math.floor((hoursLeft ?? 0) / 24)}d left`}
                  </p>
                </div>
              )}
              <Section title="Client">
                <Field label="Email" value={user.email as string} />
                <Field label="Signed up" value={new Date(user.created_at as string).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} />
                <Field label="Stripe ID" value={user.stripe_customer_id as string} />
                <Field
                  label="Submitted"
                  value={submittedAt ? new Date(submittedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : null}
                />
              </Section>
            </div>

            {/* Calibration metrics */}
            {calibrationMetrics && (
              <div className="rounded-2xl border border-wire bg-white p-6">
                <h3 className="mb-4 border-b border-wire pb-2 font-display text-[13px] font-semibold uppercase tracking-[0.14em] text-void">
                  Calibration
                </h3>
                <MetricsPanel metrics={calibrationMetrics} age={qr.age as number | undefined} />
              </div>
            )}

            {/* Photos */}
            <div className="rounded-2xl border border-wire bg-white p-6">
              <h3 className="mb-4 border-b border-wire pb-2 font-display text-[13px] font-semibold uppercase tracking-[0.14em] text-void">
                Photos
              </h3>
              <OrderPhotoViewer photos={{ front: photoFront, side: photoSide, back: photoBack, face: photoFace }} />
            </div>

            {/* Identity */}
            <div className="rounded-2xl border border-wire bg-white p-6">
              <Section title="Identity & Goals">
                <Field label="Goal" value={qr.goal as string} />
                <Field label="Motivation" value={qr.motivation as string} />
              </Section>
            </div>

            {/* Profile */}
            <div className="rounded-2xl border border-wire bg-white p-6">
              <Section title="Profile">
                <Field label="Age" value={qr.age as number} />
                <Field label="Professional env." value={qr.professional_environment as string} />
                <Field label="Facial structure (self)" value={qr.facial_structure_self as string} />
                <Field label="Social perception" value={arr(qr.social_perception)} />
                <Field label="Typical clothing" value={qr.typical_clothing as string} />
                <Field label="City" value={qr.city as string} />
              </Section>
            </div>

            {/* Biometrics */}
            <div className="rounded-2xl border border-wire bg-white p-6">
              <Section title="Biometrics">
                <Field label="Height" value={qr.height_cm ? `${qr.height_cm} cm` : null} />
                <Field label="Weight" value={qr.weight_kg ? `${qr.weight_kg} kg` : null} />
                <Field label="Weight trend (6mo)" value={qr.weight_trend_6mo as string} />
                <Field label="Waist" value={qr.waist_circumference_cm ? `${qr.waist_circumference_cm} cm` : null} />
              </Section>
            </div>

            {/* Training */}
            <div className="rounded-2xl border border-wire bg-white p-6">
              <Section title="Training">
                <Field label="Experience" value={qr.training_experience as string} />
                <Field label="Sessions / week" value={qr.sessions_per_week as number} />
                <Field label="Session duration" value={qr.session_duration_minutes ? `${qr.session_duration_minutes} min` : null} />
                <Field label="Location" value={qr.training_location as string} />
                <Field label="Activities" value={arr(qr.preferred_activities)} />
                <Field label="Daily activity" value={qr.daily_activity_level as string} />
                <Field label="Consistency" value={qr.training_consistency as string} />
              </Section>
            </div>

            {/* Nutrition */}
            <div className="rounded-2xl border border-wire bg-white p-6">
              <Section title="Nutrition">
                <Field label="Dietary profile" value={qr.dietary_profile as string} />
                <Field label="Food allergies" value={arr(qr.food_allergies)} />
                <Field label="Eating habits" value={arr(qr.eating_habits)} />
                <Field label="Meals / day" value={qr.meals_per_day as number} />
                <Field label="Meal prep" value={qr.meal_prep_availability as string} />
                <Field label="Supplements" value={arr(qr.supplement_use)} />
              </Section>
            </div>

            {/* Health */}
            <div className="rounded-2xl border border-wire bg-white p-6">
              <Section title="Health">
                <Field label="Injuries" value={arr(qr.injuries)} />
                <Field label="Medical conditions" value={arr(qr.medical_conditions)} />
                <Field label="Medications" value={arr(qr.medications)} />
                <Field label="Sleep" value={qr.sleep_hours as string} />
                <Field label="Stress level" value={qr.stress_level as number} />
                <Field label="Concern areas" value={arr(qr.concern_areas)} />
                {typeof qr.coach_notes === "string" && qr.coach_notes && (
                  <div className="col-span-2 flex flex-col gap-0.5">
                    <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-mute">Coach notes</dt>
                    <dd className="rounded-lg bg-amber-50 p-3 text-[13px] leading-relaxed text-amber-900">
                      {qr.coach_notes}
                    </dd>
                  </div>
                )}
              </Section>
            </div>

          </div>

          {/* Right — protocol workflow (sticky) */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl border border-wire bg-white p-6">
              <ProtocolWorkflow
                userId={userId}
                initialContent={protocolContent}
                initialStatus={status}
                initialMetrics={calibrationMetrics}
                questionnaire={questionnaire}
                beforeAfterPreviewPath={beforeAfterPreviewPath}
              />
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
