import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../lib/supabase";

export const runtime = "nodejs";

/**
 * Read-only endpoint that returns the saved answers for a funnel session.
 * Used by the funnel-shell to rehydrate state when a user comes back via
 * a deep-link such as `/funnel?resume=photo&funnel_sid=...` (the "Add my
 * photo" CTA on the report). Without this the funnel would start over and
 * the user would land on the intro slide instead of jumping to upload.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("sid");

  if (!id || !/^[a-f0-9-]{36}$/.test(id)) {
    return NextResponse.json({ error: "Invalid or missing sid" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("funnel_sessions")
    .select("answers")
    .eq("session_id", id)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ answers: null }, { status: 200 });
  }

  return NextResponse.json({ answers: data.answers ?? null });
}
