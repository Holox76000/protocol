import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";

export const runtime = "nodejs";

const TEN_YEARS = 315_360_000;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id || !/^[a-f0-9-]{36}$/.test(id)) {
    return NextResponse.json({ error: "Invalid or missing id" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("visualization_previews")
    .select("before_path, after_path")
    .eq("preview_id", id)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ status: "not_started" });
  }

  const afterPath = data.after_path as string;

  if (afterPath === "__generating") {
    return NextResponse.json({ status: "generating" });
  }

  if (afterPath.startsWith("__error:")) {
    return NextResponse.json({ status: "error", detail: afterPath.slice(8) });
  }

  const [beforeSigned, afterSigned] = await Promise.all([
    supabaseAdmin.storage.from("user-photos").createSignedUrl(data.before_path, TEN_YEARS),
    supabaseAdmin.storage.from("user-photos").createSignedUrl(afterPath, TEN_YEARS),
  ]);

  if (!beforeSigned.data?.signedUrl || !afterSigned.data?.signedUrl) {
    return NextResponse.json({ status: "error", detail: "Could not generate signed URLs" }, { status: 500 });
  }

  return NextResponse.json({
    status: "done",
    before_url: beforeSigned.data.signedUrl,
    after_url: afterSigned.data.signedUrl,
  });
}
