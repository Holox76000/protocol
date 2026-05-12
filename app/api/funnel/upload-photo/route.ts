import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";

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

  const ext = file.type === "image/png" ? "png" : "jpg";
  const filename = photoType === "body" ? `photo.${ext}` : `photo-${photoType}.${ext}`;
  const path = `funnel/${sessionId}/${filename}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabaseAdmin.storage
    .from("user-photos")
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const TEN_YEARS = 315_360_000;
  const { data: signed } = await supabaseAdmin.storage
    .from("user-photos")
    .createSignedUrl(path, TEN_YEARS);

  return NextResponse.json({ path, before_url: signed?.signedUrl ?? null });
}
