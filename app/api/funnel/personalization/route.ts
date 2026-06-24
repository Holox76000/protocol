import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";

export const runtime = "nodejs";

/**
 * Read-only endpoint that returns the cached personalization payload for a
 * funnel session. Does NOT trigger LLM generation. The personalization is
 * generated lazily by the report route — by the time the user lands on the
 * LP, the cache should already exist.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sid = searchParams.get("sid");

  if (!sid || !/^[a-f0-9-]{36}$/.test(sid)) {
    return NextResponse.json({ personalization: null }, { status: 200 });
  }

  const { data } = await supabaseAdmin
    .from("funnel_sessions")
    .select("answers")
    .eq("session_id", sid)
    .maybeSingle();

  const answers = (data?.answers ?? {}) as Record<string, unknown>;
  const personalization = (answers._personalization ?? null) as unknown;

  return NextResponse.json({ personalization });
}
