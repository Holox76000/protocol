import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../../../../../lib/adminAuth";
import { supabaseAdmin } from "../../../../../lib/supabase";

export const runtime = "nodejs";

async function signedUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabaseAdmin.storage
    .from("user-photos")
    .createSignedUrl(path, 3600);
  if (error || !data) return null;
  return data.signedUrl;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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
      .select("content, delivered_at, updated_at")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  if (!userResult.data) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const qr = qrResult.data as Record<string, unknown> | null;

  // Generate signed URLs for photos in parallel
  const [photoFront, photoSide, photoBack, photoFace] = await Promise.all([
    signedUrl(qr?.photo_front_path as string | null),
    signedUrl(qr?.photo_side_path as string | null),
    signedUrl(qr?.photo_back_path as string | null),
    signedUrl(qr?.photo_face_path as string | null),
  ]);

  return NextResponse.json({
    user: userResult.data,
    questionnaire: qr,
    photos: { front: photoFront, side: photoSide, back: photoBack, face: photoFace },
    protocol: protocolResult.data ?? null,
  });
}
