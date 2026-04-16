import { notFound } from "next/navigation";
import { requireAdmin } from "../../../../../lib/adminAuth";
import { supabaseAdmin } from "../../../../../lib/supabase";
import CalibrateClient from "./CalibrateClient";
import type { OverlayPoints, CalibrationMetrics, BiometricData } from "../PhotoCalibrator";

export const runtime = "nodejs";

async function signedUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabaseAdmin.storage
    .from("user-photos")
    .createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export default async function CalibratePage({
  params,
}: {
  params: { userId: string };
}) {
  await requireAdmin();

  const { userId } = params;

  const [userResult, qrResult, protocolResult] = await Promise.all([
    supabaseAdmin
      .from("users")
      .select("id, first_name")
      .eq("id", userId)
      .maybeSingle(),
    supabaseAdmin
      .from("questionnaire_responses")
      .select("photo_front_path, photo_side_path, photo_back_path, photo_face_path, height_cm, weight_kg, age, waist_circumference_cm")
      .eq("user_id", userId)
      .maybeSingle(),
    supabaseAdmin
      .from("protocols")
      .select("overlay_points, metrics")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  if (!userResult.data) notFound();

  const user = userResult.data;
  const qr   = qrResult.data;

  const [photoFront, photoSide, photoBack, photoFace] = await Promise.all([
    signedUrl(qr?.photo_front_path as string | null ?? null),
    signedUrl(qr?.photo_side_path  as string | null ?? null),
    signedUrl(qr?.photo_back_path  as string | null ?? null),
    signedUrl(qr?.photo_face_path  as string | null ?? null),
  ]);

  const bio: BiometricData | null =
    qr?.height_cm && qr?.weight_kg && qr?.age
      ? {
          height_cm: qr.height_cm            as number,
          weight_kg: qr.weight_kg            as number,
          age:       qr.age                  as number,
          waist_cm:  qr.waist_circumference_cm != null
            ? (qr.waist_circumference_cm as number)
            : undefined,
        }
      : null;

  return (
    <CalibrateClient
      userId={userId}
      userName={(user.first_name as string) ?? "Client"}
      photos={{ front: photoFront, side: photoSide, back: photoBack, face: photoFace }}
      initialPoints={(protocolResult.data?.overlay_points as OverlayPoints | null) ?? null}
      initialMetrics={(protocolResult.data?.metrics as CalibrationMetrics | null) ?? null}
      bio={bio}
    />
  );
}
