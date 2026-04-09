import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateSession, SESSION_COOKIE_NAME } from "../../../../lib/auth";
import { supabaseAdmin } from "../../../../lib/supabase";
import { randomUUID } from "node:crypto";

const VALID_SLOTS = ["front", "side", "back", "face"] as const;
type Slot = (typeof VALID_SLOTS)[number];

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await validateSession(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const slot = formData.get("slot") as string | null;

  if (!file || !slot) {
    return NextResponse.json({ error: "Missing file or slot" }, { status: 400 });
  }

  if (!VALID_SLOTS.includes(slot as Slot)) {
    return NextResponse.json({ error: "Invalid slot" }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 400 });
  }

  const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/heic", "image/heif"];
  if (!validTypes.includes(file.type.toLowerCase())) {
    return NextResponse.json({ error: "Invalid format. Use JPG, PNG, or HEIC." }, { status: 400 });
  }

  const ext = file.type.includes("png") ? "png" : "jpg";
  const path = `${user.id}/${slot}-${randomUUID()}.${ext}`;

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const { error: uploadError } = await supabaseAdmin.storage
    .from("user-photos")
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    console.error("Storage upload error:", uploadError);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ path });
}
