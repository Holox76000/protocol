import type { NextApiRequest, NextApiResponse } from "next";
import sharp from "sharp";
import { validateSession, SESSION_COOKIE_NAME } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase";
import { renderProtocolPDFToBuffer } from "../../../app/pdf/ProtocolPDF";
import type { CalibrationMetrics } from "../../../app/admin/orders/[userId]/PhotoCalibrator";

// Pages Router API route — NOT compiled with the RSC webpack layer.
// @react-pdf/renderer uses React.Component internally; the RSC bundled React
// strips class components, causing "a.Component is not a constructor".
// Moving here gives us the real node_modules/react with class support.

export const config = {
  api: {
    // PDF buffers can be large; disable body size limit for response streaming.
    responseLimit: false,
  },
};

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
      .rotate()  // auto-apply EXIF orientation before any other op
      .resize({ width: 800, withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
    return `data:image/jpeg;base64,${resized.toString("base64")}`;
  } catch (err) {
    console.error("[export-pdf] photo processing failed:", err);
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Auth: read session cookie directly (no next/headers — Pages Router)
  const token = req.cookies[SESSION_COOKIE_NAME];
  if (!token) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const user = await validateSession(token);
  if (!user || !user.is_admin) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const { email } = req.body as { email?: string };
  if (!email) {
    return res.status(400).json({ error: "email is required" });
  }

  // Fetch user
  const { data: dbUser, error: userError } = await supabaseAdmin
    .from("users")
    .select("id, first_name, email")
    .eq("email", email)
    .maybeSingle();

  if (userError || !dbUser) {
    return res.status(404).json({ error: "User not found" });
  }

  const userId    = dbUser.id as string;
  const firstName = (dbUser.first_name as string | null) ?? (email as string).split("@")[0];

  // Fetch protocol + questionnaire in parallel
  const [protocolResult, qrResult] = await Promise.all([
    supabaseAdmin
      .from("protocols")
      .select("summary, delivered_at, nutrition_plan_content, workout_plan_content, sleeping_advices_content, posture_analysis_content, supplement_protocol_content, action_plan_content, metrics, before_after_preview_path")
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

  // Signed photo URLs + resize (parallel)
  const photoFrontPath      = (qr?.photo_front_path as string | null) ?? null;
  const beforeAfterPath     = (protocol?.before_after_preview_path as string | null) ?? null;
  const [signedUrl, signedBeforeAfterUrl] = await Promise.all([
    getSignedUrl(photoFrontPath),
    getSignedUrl(beforeAfterPath),
  ]);
  const [photoDataUri, beforeAfterDataUri] = await Promise.all([
    fetchPhotoDataUri(signedUrl),
    fetchPhotoDataUri(signedBeforeAfterUrl),
  ]);

  // Metrics
  const rawMetrics = (protocol?.metrics as CalibrationMetrics | null) ?? null;

  // Delivered date
  const deliveredAt   = (protocol?.delivered_at as string | null) ?? null;
  const deliveredDate = deliveredAt
    ? new Date(deliveredAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null;

  // Age
  const age = ((qr?.age as number | null) ?? undefined);

  // Render PDF
  let buffer: Buffer;
  try {
    buffer = await renderProtocolPDFToBuffer({
      firstName,
      deliveredDate,
      photoDataUri,
      beforeAfterDataUri,
      metrics: rawMetrics,
      age,
      summary:                   (protocol?.summary as string | null) ?? null,
      nutritionPlanContent:      (protocol?.nutrition_plan_content as string | null) ?? null,
      workoutPlanContent:        (protocol?.workout_plan_content as string | null) ?? null,
      sleepingAdvicesContent:    (protocol?.sleeping_advices_content as string | null) ?? null,
      postureAnalysisContent:    (protocol?.posture_analysis_content as string | null) ?? null,
      supplementProtocolContent: (protocol?.supplement_protocol_content as string | null) ?? null,
      actionPlanContent:         (protocol?.action_plan_content as string | null) ?? null,
    });
  } catch (err) {
    console.error("[export-pdf] renderToBuffer failed:", err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : "PDF generation failed",
    });
  }

  const slug  = firstName.toLowerCase().replace(/\s+/g, "-");
  const year  = new Date().getFullYear();
  const fname = `protocol-${slug}-${year}.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${fname}"`);
  res.setHeader("Content-Length", String(buffer.byteLength));
  res.status(200).end(buffer);
}
