import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const previewId = formData.get("previewId") as string | null;
    const beforeFile = formData.get("before") as File | null;
    const afterFile = formData.get("after") as File | null;

    if (!previewId || !beforeFile || !afterFile) {
      return NextResponse.json({ error: "Missing previewId, before, or after" }, { status: 400 });
    }

    const beforeExt = beforeFile.type.includes("png") ? "png" : "jpg";
    const afterExt = afterFile.type.includes("png") ? "png" : "jpg";

    const beforePath = `visualization-previews/${previewId}/before.${beforeExt}`;
    const afterPath = `visualization-previews/${previewId}/after.${afterExt}`;

    const [beforeBuffer, afterBuffer] = await Promise.all([
      beforeFile.arrayBuffer().then((b) => Buffer.from(b)),
      afterFile.arrayBuffer().then((b) => Buffer.from(b)),
    ]);

    const [beforeUpload, afterUpload] = await Promise.all([
      supabaseAdmin.storage.from("user-photos").upload(beforePath, beforeBuffer, {
        contentType: beforeFile.type || "image/jpeg",
        upsert: true,
      }),
      supabaseAdmin.storage.from("user-photos").upload(afterPath, afterBuffer, {
        contentType: afterFile.type || "image/jpeg",
        upsert: true,
      }),
    ]);

    if (beforeUpload.error || afterUpload.error) {
      console.error("[visualize/save] upload error", beforeUpload.error, afterUpload.error);
      return NextResponse.json({ error: "Storage upload failed" }, { status: 500 });
    }

    const { error: dbError } = await supabaseAdmin.from("visualization_previews").upsert({
      preview_id: previewId,
      before_path: beforePath,
      after_path: afterPath,
    });

    if (dbError) {
      console.error("[visualize/save] db error", dbError);
      return NextResponse.json({ error: "Database save failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[visualize/save] unhandled error", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
