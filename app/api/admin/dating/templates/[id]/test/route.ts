// Admin "test a template" endpoint: run one Nano Banana generation using
// the template's ref image + prompt and a fresh set of selfies uploaded by
// the admin — no order created, nothing persisted. Returns the generated
// image as a base64 data URL so the UI can preview it inline.
//
// Cost: 1 Nano Banana call (~$0.10 at 2K). Admin-guarded, low volume.

import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../../../../lib/adminAuth";
import { supabaseAdmin } from "../../../../../../../lib/supabase";
import { getTemplateById, buildPrompt } from "../../../../../../../lib/datingTemplates";
import { refinePromptForPair } from "../../../../../../../lib/promptAnalyzer";
import {
  generateImage,
  NanoBananaError,
  type ReferenceImage,
} from "../../../../../../../lib/nanoBanana";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_SELFIES = 4;
const MAX_SELFIE_BYTES = 12 * 1024 * 1024; // 12 MB each — HEIC etc. can be big
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

function extToMime(ext: string): string {
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "heic" || ext === "heif") return "image/heic";
  return "image/jpeg";
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;

  const template = await getTemplateById(id);
  if (!template) {
    return NextResponse.json({ error: "template not found" }, { status: 404 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "multipart body required" }, { status: 400 });
  }

  // Collect all files under either "selfies" (multiple) or "selfie" (single).
  const rawFiles: File[] = [];
  for (const key of ["selfies", "selfie"]) {
    for (const value of form.getAll(key)) {
      if (value instanceof File) rawFiles.push(value);
    }
  }
  if (rawFiles.length === 0) {
    return NextResponse.json({ error: "at least one selfie file required" }, { status: 400 });
  }

  const files = rawFiles.slice(0, MAX_SELFIES);
  const characterRefs: ReferenceImage[] = [];
  for (const f of files) {
    if (!ALLOWED_MIME.has(f.type)) {
      return NextResponse.json({ error: `unsupported selfie type ${f.type}` }, { status: 400 });
    }
    if (f.size > MAX_SELFIE_BYTES) {
      return NextResponse.json({ error: `selfie too large (>${MAX_SELFIE_BYTES / 1024 / 1024}MB)` }, { status: 400 });
    }
    const buf = Buffer.from(await f.arrayBuffer());
    characterRefs.push({ data: buf, mimeType: f.type });
  }

  // Download the template ref image from storage (private bucket, service
  // role — never exposed publicly).
  const { data: refData, error: refErr } = await supabaseAdmin.storage
    .from("dating-photos")
    .download(template.refImagePath);
  if (refErr || !refData) {
    return NextResponse.json(
      { error: `template ref download failed: ${refErr?.message ?? "no data"}` },
      { status: 500 },
    );
  }
  const refBuf = Buffer.from(await refData.arrayBuffer());
  const refExt = template.refImagePath.split(".").pop()?.toLowerCase() ?? "jpeg";
  const templateReference: ReferenceImage = { data: refBuf, mimeType: extToMime(refExt) };

  // Two-phase: refine the prompt first (multimodal Gemini text call),
  // then generate the image. Falls back to buildPrompt(template.prompt)
  // if refinement is disabled or fails so tests never hard-fail on that.
  const refined = await refinePromptForPair({
    templateReference,
    characterReferences: characterRefs,
    scenePromptHint: template.prompt,
  });
  const promptForGeneration = refined?.refinedPrompt ?? buildPrompt(template.prompt);

  try {
    const result = await generateImage({
      prompt: promptForGeneration,
      templateReference,
      characterReferences: characterRefs,
      resolution: "1K",
      aspectRatio: "4:5",
    });

    // Return as base64 data URL for immediate <img src=…> preview. ~1-2 MB
    // JSON for a 2K JPEG — fine for a single admin request.
    const dataUrl = `data:${result.mimeType};base64,${result.imageBytes.toString("base64")}`;
    return NextResponse.json({
      ok: true,
      dataUrl,
      mimeType: result.mimeType,
      bytes: result.imageBytes.length,
      interactionId: result.interactionId,
      // Surface which prompt was used + the refinement path so the admin
      // can see (and copy) the actual instruction Nano Banana obeyed.
      refinedPrompt: refined?.refinedPrompt ?? null,
      promptSource: refined ? refined.model : "fallback:buildPrompt",
      promptUsed: promptForGeneration,
      promptFinishReason: refined?.finishReason ?? null,
    });
  } catch (err) {
    const msg = err instanceof NanoBananaError
      ? `NB2 ${err.status ?? "net"}: ${err.message.slice(0, 500)}`
      : String(err).slice(0, 500);
    console.error("[admin/dating/templates/test] generation failed", { templateId: id, error: msg });
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
