import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { normalizePhotoForStorage } from "../../../../lib/photoUpload";

export const runtime = "nodejs";

const ALLOWED_PHOTO_TYPES = ["body", "face", "profile"] as const;
type PhotoType = typeof ALLOWED_PHOTO_TYPES[number];

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const sessionId = formData.get("session_id") as string | null;
  const rawType = formData.get("type") as string | null;
  const photoType: PhotoType = ALLOWED_PHOTO_TYPES.includes(rawType as PhotoType) ? (rawType as PhotoType) : "body";

  if (!file || !sessionId) {
    return NextResponse.json({ error: "file and session_id are required" }, { status: 400 });
  }

  if (!/^[a-f0-9-]{36}$/.test(sessionId)) {
    return NextResponse.json({ error: "Invalid session_id" }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 400 });
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/heic", "image/heif"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }

  let normalized;
  try {
    normalized = await normalizePhotoForStorage(Buffer.from(await file.arrayBuffer()), file.type);
  } catch (err) {
    console.error("[funnel/upload-photo] normalize failed", { error: String(err) });
    return NextResponse.json({ error: "Could not process image" }, { status: 400 });
  }

  const filename = photoType === "body" ? `photo.${normalized.ext}` : `photo-${photoType}.${normalized.ext}`;
  const path = `funnel/${sessionId}/${filename}`;

  const { error } = await supabaseAdmin.storage
    .from("user-photos")
    .upload(path, normalized.buffer, { contentType: normalized.contentType, upsert: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const TEN_YEARS = 315_360_000;
  const { data: signed } = await supabaseAdmin.storage
    .from("user-photos")
    .createSignedUrl(path, TEN_YEARS);

  return NextResponse.json({ path, before_url: signed?.signedUrl ?? null });
}
