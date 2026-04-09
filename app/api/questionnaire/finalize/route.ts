import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateSession, SESSION_COOKIE_NAME } from "../../../../lib/auth";
import { supabaseAdmin } from "../../../../lib/supabase";
import { syncKlaviyoQuestionnaire } from "../../../../lib/klaviyo";

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

  // Sync finalized status + answers to Klaviyo
  const { data: qr } = await supabaseAdmin
    .from("questionnaire_responses")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (qr) {
    void syncKlaviyoQuestionnaire({ email: user.email, answers: { ...qr, Protocol_Status: "finalized" } }).catch((err) =>
      console.error("[finalize] Klaviyo sync failed", { error: String(err) })
    );
  }

  return NextResponse.json({ ok: true });
}
