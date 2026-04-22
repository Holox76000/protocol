import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "../../../../lib/adminAuth";
import { validateSession, SESSION_COOKIE_NAME } from "../../../../lib/auth";
import { supabaseAdmin } from "../../../../lib/supabase";
import ProtocolSidebarLayout, { type SectionId } from "../../ProtocolSidebarLayout";
import type { CalibrationMetrics, OverlayPoints } from "../../../admin/orders/[userId]/PhotoCalibrator";

export const runtime = "nodejs";

const VALID_SECTIONS = new Set<string>([
  "summary", "body-analysis", "action-plan",
  "nutrition-plan", "supplement-protocol", "workout-plan", "sleeping-advices", "posture-analysis",
]);

// Sections that need photo signed URLs (front, side, before/after preview).
const PHOTO_SECTIONS = new Set(["summary", "body-analysis", "posture-analysis"]);

// Only fetch content columns needed for the active section.
// action-plan also needs the other three sections to drive its warningWhenEmpty check.
const PROTOCOL_CONTENT_COLS: Record<string, string[]> = {
  "summary":             [],
  "body-analysis":       [],
  "action-plan":         ["action_plan_content", "nutrition_plan_content", "workout_plan_content", "sleeping_advices_content"],
  "nutrition-plan":      ["nutrition_plan_content"],
  "supplement-protocol": ["supplement_protocol_content"],
  "workout-plan":        ["workout_plan_content", "metrics"],
  "sleeping-advices":    ["sleeping_advices_content"],
  "posture-analysis":    ["posture_analysis_content"],
};

async function signedUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabaseAdmin.storage.from("user-photos").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export default async function ProtocolSectionPage({
  params,
  searchParams,
}: {
  params: { email: string; section: string };
  searchParams: { as?: string };
}) {
  const email = decodeURIComponent(params.email);

  // Dual auth: admin OR the client who owns this email.
  let isAdmin = false;
  const adminUser = await requireAdmin();
  const adminCheck = adminUser !== null;

  if (adminCheck) {
    // Admin can force client view via ?as=client
    isAdmin = searchParams.as !== "client";
  } else {
    // Not admin — check if it's the actual client.
    const sessionToken = cookies().get(SESSION_COOKIE_NAME)?.value;
    if (!sessionToken) redirect(`/login?next=/protocol/${encodeURIComponent(email)}/${params.section}`);
    const user = await validateSession(sessionToken);
    if (!user) redirect(`/login?next=/protocol/${encodeURIComponent(email)}/${params.section}`);
    if (user.email.toLowerCase() !== email.toLowerCase()) notFound();
    if (!user.has_paid || user.protocol_status !== "delivered") redirect("/dashboard");
    isAdmin = false;

    // Track first view for NPS trigger — idempotent (WHERE IS NULL).
    // Must be awaited: serverless functions terminate on response, void would be killed mid-flight.
    await supabaseAdmin
      .from("users")
      .update({ protocol_viewed_at: new Date().toISOString() })
      .eq("id", user.id)
      .is("protocol_viewed_at", null);
  }

  if (!VALID_SECTIONS.has(params.section)) notFound();

  const needsPhotos = PHOTO_SECTIONS.has(params.section);

  const extraCols    = PROTOCOL_CONTENT_COLS[params.section] ?? [];
  // Only include photo/metrics columns on sections that actually display them.
  const baseCols     = needsPhotos
    ? ["delivered_at", "disabled_sections", "metrics", "overlay_points", "before_after_preview_path", "summary"]
    : ["delivered_at", "disabled_sections", "summary"];
  const protocolCols = [...baseCols, ...extraCols].join(", ");

  const { data: userData } = await supabaseAdmin
    .from("users")
    .select("id, first_name")
    .eq("email", email)
    .maybeSingle();

  if (!userData) notFound();

  type Row = Record<string, unknown> | null;

  const fetchProtocol = supabaseAdmin
    .from("protocols").select(protocolCols).eq("user_id", userData.id).maybeSingle()
    .then(r => r.data as Row);

  // Always fetch basic QR fields (sessions_per_week, age needed across sections).
  // Add photo paths only for photo sections to avoid unnecessary DB payload.
  const qrCols = needsPhotos
    ? "photo_front_path, photo_side_path, height_cm, age, weight_kg, sessions_per_week"
    : "height_cm, age, weight_kg, sessions_per_week";

  const fetchQr = supabaseAdmin
    .from("questionnaire_responses")
    .select(qrCols)
    .eq("user_id", userData.id).maybeSingle()
    .then(r => r.data as Row);

  const [p, qr] = await Promise.all([fetchProtocol, fetchQr]);

  const metrics          = (p?.metrics                   as CalibrationMetrics | null) ?? null;
  const overlayPoints    = (p?.overlay_points            as OverlayPoints | null)      ?? null;
  const previewPath      = (p?.before_after_preview_path as string | null)             ?? null;
  const summary          = (p?.summary                   as string | null)             ?? null;
  const disabledSections = (p?.disabled_sections         as string[] | null)           ?? [];

  // Redirect client away from disabled sections to the first available one.
  if (!isAdmin && disabledSections.includes(params.section)) {
    const SECTION_ORDER = [
      "summary", "body-analysis", "nutrition-plan", "workout-plan",
      "sleeping-advices", "posture-analysis", "supplement-protocol", "action-plan",
    ];
    const fallback = SECTION_ORDER.find((s) => !disabledSections.includes(s)) ?? "summary";
    redirect(`/protocol/${encodeURIComponent(email)}/${fallback}`);
  }

  const nutritionPlanContent      = (p?.nutrition_plan_content      as string | null) ?? null;
  const supplementProtocolContent = (p?.supplement_protocol_content as string | null) ?? null;
  const workoutPlanContent        = (p?.workout_plan_content        as string | null) ?? null;
  const sleepingAdvicesContent    = (p?.sleeping_advices_content    as string | null) ?? null;
  const actionPlanContent         = (p?.action_plan_content         as string | null) ?? null;
  const postureAnalysisContent    = (p?.posture_analysis_content    as string | null) ?? null;

  const photoFrontPath = (qr?.photo_front_path as string | null) ?? null;
  const photoSidePath  = (qr?.photo_side_path  as string | null) ?? null;
  const heightCm        = (qr?.height_cm         as number | null) ?? undefined;
  const age             = (qr?.age               as number | null) ?? undefined;
  const weightKg        = (qr?.weight_kg         as number | null) ?? undefined;
  const sessionsPerWeek = (qr?.sessions_per_week as number | null) ?? undefined;

  // Signed URLs only for photo sections (3 network calls otherwise skipped).
  const [photoFront, photoSide, initialAfterUrl] = needsPhotos
    ? await Promise.all([signedUrl(photoFrontPath), signedUrl(photoSidePath), signedUrl(previewPath)])
    : [null, null, null];

  const deliveredDate = p?.delivered_at
    ? new Date(p.delivered_at as string).toLocaleDateString("en-US", {
        month: "long", day: "numeric", year: "numeric",
      })
    : null;

  return (
    <ProtocolSidebarLayout
      email={email}
      userId={userData.id as string}
      firstName={userData.first_name as string}
      deliveredDate={deliveredDate}
      metrics={metrics}
      points={overlayPoints}
      photoFront={photoFront}
      photoSide={photoSide}
      heightCm={heightCm}
      age={age}
      weightKg={weightKg}
      sessionsPerWeek={sessionsPerWeek}
      isAdmin={isAdmin}
      isClientSession={!adminCheck}
      initialDisabledSections={disabledSections as SectionId[]}
      initialBeforeUrl={photoFront}
      initialAfterUrl={initialAfterUrl}
      summary={summary}
      nutritionPlanContent={nutritionPlanContent}
      supplementProtocolContent={supplementProtocolContent}
      workoutPlanContent={workoutPlanContent}
      sleepingAdvicesContent={sleepingAdvicesContent}
      actionPlanContent={actionPlanContent}
      postureAnalysisContent={postureAnalysisContent}
      initialSection={params.section as SectionId}
    />
  );
}
