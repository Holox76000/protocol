import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";

export const runtime = "nodejs";

const TEN_YEARS = 315_360_000;

export async function POST(request: Request) {
  const body = await request.json() as { session_id?: string; answers?: Record<string, unknown> };
  const { session_id, answers } = body;

  if (!session_id || !/^[a-f0-9-]{36}$/.test(session_id)) {
    return NextResponse.json({ error: "Invalid session_id" }, { status: 400 });
  }

  // Strip large transient values before persisting
  const { _before_url: _dropped, ...cleanAnswers } = (answers ?? {}) as Record<string, unknown> & { _before_url?: unknown };

  const { error } = await supabaseAdmin
    .from("funnel_sessions")
    .upsert(
      { session_id, answers: cleanAnswers, updated_at: new Date().toISOString() },
      { onConflict: "session_id" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

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
