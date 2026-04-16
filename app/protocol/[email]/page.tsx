import { notFound } from "next/navigation";
import { requireAdmin } from "../../../lib/adminAuth";
import { supabaseAdmin } from "../../../lib/supabase";
import { parseProtocolSections } from "../../../lib/parseProtocolSections";
import ProtocolSidebarLayout from "../ProtocolSidebarLayout";
import type { CalibrationMetrics, OverlayPoints } from "../../admin/orders/[userId]/PhotoCalibrator";

export const runtime = "nodejs";

async function signedUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabaseAdmin.storage.from("user-photos").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export default async function AdminProtocolPreviewPage({
  params,
}: {
  params: { email: string };
}) {
  await requireAdmin();

  const email = decodeURIComponent(params.email);

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, first_name, protocol_status")
    .eq("email", email)
    .maybeSingle();

  if (!user) notFound();

  const [protocolResult, qrResult] = await Promise.all([
    supabaseAdmin
      .from("protocols")
      .select("content, delivered_at, metrics, overlay_points, before_after_preview_path, summary, nutrition_plan_content, workout_plan_content, sleeping_advices_content, daily_protocol_content, action_plan_content")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabaseAdmin
      .from("questionnaire_responses")
      .select("photo_front_path, photo_side_path, height_cm, age")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const protocol            = protocolResult.data;
  const content             = (protocol?.content                  as string)                    ?? "";
  const metrics             = (protocol?.metrics                  as CalibrationMetrics | null) ?? null;
  const overlayPoints       = (protocol?.overlay_points           as OverlayPoints | null)     ?? null;
  const beforeAfterPreviewPath = (protocol?.before_after_preview_path as string | null)        ?? null;
  const summary                = (protocol?.summary                  as string | null)          ?? null;
  const nutritionPlanContent   = (protocol?.nutrition_plan_content   as string | null)          ?? null;
  const workoutPlanContent     = (protocol?.workout_plan_content     as string | null)          ?? null;
  const sleepingAdvicesContent = (protocol?.sleeping_advices_content as string | null)          ?? null;
  const dailyProtocolContent   = (protocol?.daily_protocol_content   as string | null)          ?? null;
  const actionPlanContent      = (protocol?.action_plan_content      as string | null)          ?? null;
  const qr       = qrResult.data;
  const heightCm = (qr?.height_cm as number | null) ?? undefined;
  const age      = (qr?.age       as number | null) ?? undefined;

  const [photoFront, photoSide] = await Promise.all([
    signedUrl(qr?.photo_front_path as string | null ?? null),
    signedUrl(qr?.photo_side_path  as string | null ?? null),
  ]);

  const deliveredDate = protocol?.delivered_at
    ? new Date(protocol.delivered_at as string).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const sections = parseProtocolSections(content);

  return (
    <ProtocolSidebarLayout
      email={email}
      userId={user.id}
      firstName={user.first_name as string}
      deliveredDate={deliveredDate}
      metrics={metrics}
      points={overlayPoints}
      photoFront={photoFront}
      photoSide={photoSide}
      heightCm={heightCm}
      age={age}
      sections={sections}
      beforeAfterPreviewPath={beforeAfterPreviewPath}
      summary={summary}
      nutritionPlanContent={nutritionPlanContent}
      workoutPlanContent={workoutPlanContent}
      sleepingAdvicesContent={sleepingAdvicesContent}
      dailyProtocolContent={dailyProtocolContent}
      actionPlanContent={actionPlanContent}
    />
  );
}
