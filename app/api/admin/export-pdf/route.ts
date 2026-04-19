import { NextResponse } from "next/server";
import sharp from "sharp";
import { requireAdmin } from "../../../../lib/adminAuth";
import { supabaseAdmin } from "../../../../lib/supabase";
import { renderProtocolPDFToBuffer } from "../../../pdf/ProtocolPDF";
import type { CalibrationMetrics } from "../../../admin/orders/[userId]/PhotoCalibrator";

export const runtime = "nodejs";

async function getSignedUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabaseAdmin.storage
    .from("user-photos")
    .createSignedUrl(path, 300);
  if (error || !data) return null;
  return data.signedUrl;
}

async function fetchPhotoDataUri(signedUrl: string | null): Promise<string | null> {
  if (!signedUrl) return null;
  try {
    const res = await fetch(signedUrl);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const resized = await sharp(buffer)
      .resize({ width: 800, withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
    return `data:image/jpeg;base64,${resized.toString("base64")}`;
  } catch (err) {
    console.error("[export-pdf] photo processing failed:", err);
    return null;
  }
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let email: string;
  try {
    const body = await req.json() as { email?: string };
    email = body.email ?? "";
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  // Fetch user
  const { data: user, error: userError } = await supabaseAdmin
    .from("users")
    .select("id, first_name, email")
    .eq("email", email)
    .maybeSingle();

  if (userError || !user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const userId = user.id as string;
  const firstName = (user.first_name as string | null) ?? email.split("@")[0];

  // Fetch protocol + questionnaire in parallel
  const [protocolResult, qrResult] = await Promise.all([
    supabaseAdmin
      .from("protocols")
      .select("content, delivered_at, nutrition_plan_content, workout_plan_content, sleeping_advices_content, posture_analysis_content, supplement_protocol_content, action_plan_content, calibration_metrics, calibration_points")
      .eq("user_id", userId)
      .maybeSingle(),
    supabaseAdmin
      .from("questionnaire_responses")
      .select("age, photo_front_path")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const protocol = protocolResult.data as Record<string, unknown> | null;
  const qr       = qrResult.data as Record<string, unknown> | null;

  // Signed photo URL + resize
  const photoFrontPath = qr?.photo_front_path as string | null ?? null;
  const signedUrl      = await getSignedUrl(photoFrontPath);
  const photoDataUri   = await fetchPhotoDataUri(signedUrl);

  // Metrics
  const rawMetrics = protocol?.calibration_metrics as CalibrationMetrics | null ?? null;

  // Delivered date
  const deliveredAt  = protocol?.delivered_at as string | null ?? null;
  const deliveredDate = deliveredAt
    ? new Date(deliveredAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null;

  // Age
  const age = (qr?.age as number | null) ?? undefined;

  // Render PDF — renderProtocolPDFToBuffer lives in ProtocolPDF.tsx so that
  // JSX compilation and renderToBuffer share the same @react-pdf/renderer instance.
  let buffer: Buffer;
  try {
    buffer = await renderProtocolPDFToBuffer({
      firstName,
      deliveredDate,
      photoDataUri,
      metrics: rawMetrics,
      age,
      summary:                   (protocol?.content as string | null) ?? null,
      nutritionPlanContent:      (protocol?.nutrition_plan_content as string | null) ?? null,
      workoutPlanContent:        (protocol?.workout_plan_content as string | null) ?? null,
      sleepingAdvicesContent:    (protocol?.sleeping_advices_content as string | null) ?? null,
      postureAnalysisContent:    (protocol?.posture_analysis_content as string | null) ?? null,
      supplementProtocolContent: (protocol?.supplement_protocol_content as string | null) ?? null,
      actionPlanContent:         (protocol?.action_plan_content as string | null) ?? null,
    });
  } catch (err) {
    console.error("[export-pdf] renderToBuffer failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "PDF generation failed" },
      { status: 500 },
    );
  }

  const slug  = firstName.toLowerCase().replace(/\s+/g, "-");
  const year  = new Date().getFullYear();
  const fname = `protocol-${slug}-${year}.pdf`;

  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type":        "application/pdf",
      "Content-Disposition": `attachment; filename="${fname}"`,
      "Content-Length":      String(buffer.byteLength),
    },
  });
}
