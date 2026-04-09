import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateSession, SESSION_COOKIE_NAME } from "../../../../lib/auth";
import { supabaseAdmin } from "../../../../lib/supabase";

export async function POST(_request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await validateSession(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (user.protocol_status !== "questionnaire_submitted") {
    return NextResponse.json({ error: "Nothing to finalize." }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("users")
    .update({ protocol_status: "in_review" })
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: "Failed to finalize." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
