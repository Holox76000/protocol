import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ previewId: string }> }
) {
  const { previewId } = await params;

  const { data, error } = await supabaseAdmin
    .from("visualization_previews")
    .select("before_path, after_path")
    .eq("preview_id", previewId)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Preview not found" }, { status: 404 });
  }

  const [beforeSigned, afterSigned] = await Promise.all([
    supabaseAdmin.storage.from("user-photos").createSignedUrl(data.before_path, 86400),
    supabaseAdmin.storage.from("user-photos").createSignedUrl(data.after_path, 86400),
  ]);

  if (!beforeSigned.data?.signedUrl || !afterSigned.data?.signedUrl) {
    return NextResponse.json({ error: "Could not generate signed URLs" }, { status: 500 });
  }

  return NextResponse.json({
    beforeSrc: beforeSigned.data.signedUrl,
    afterSrc: afterSigned.data.signedUrl,
  });
}
