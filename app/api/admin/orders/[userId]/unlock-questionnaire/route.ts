import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../../../../../../lib/adminAuth";
import { supabaseAdmin } from "../../../../../../lib/supabase";
import { sendQuestionnaireUnlockedEmail } from "../../../../../../lib/email";

export const runtime = "nodejs";

export async function POST(
  _request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId } = params;

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("protocol_status, email, first_name")
    .eq("id", userId)
    .maybeSingle();

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (user.protocol_status !== "in_review") {
    return NextResponse.json(
      { error: "Can only unlock when status is in_review." },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin
    .from("users")
    .update({ protocol_status: "questionnaire_submitted" })
    .eq("id", userId);

  if (error) {
    console.error("[admin/unlock-questionnaire] update failed", { error: error.message });
    return NextResponse.json({ error: "Failed to unlock questionnaire." }, { status: 500 });
  }

  console.log("[admin/unlock-questionnaire] Questionnaire unlocked", { userId });

  const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://protocol-club.com";
  void sendQuestionnaireUnlockedEmail({
    email: user.email,
    firstName: user.first_name ?? undefined,
    questionnaireUrl: `${SITE_URL}/questionnaire`,
  }).catch((err) =>
    console.error("[admin/unlock-questionnaire] Email failed", { error: String(err) })
  );

  return NextResponse.json({ ok: true });
}
