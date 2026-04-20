import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../../../../../../lib/adminAuth";
import { supabaseAdmin } from "../../../../../../lib/supabase";
import { sendExpertMessage } from "../../../../../../lib/email";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId } = params;

  const body = await request.json().catch(() => ({})) as { body?: string };
  const text = (body.body ?? "").trim();
  if (!text) return NextResponse.json({ error: "Message body is required." }, { status: 400 });

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("email, first_name")
    .eq("id", userId)
    .maybeSingle();

  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

  let resendEmailId: string | null = null;
  try {
    const result = await sendExpertMessage({
      email: user.email,
      firstName: user.first_name ?? undefined,
      body: text,
      userId,
    });
    resendEmailId = result.resendEmailId;
  } catch (err) {
    console.error("[admin/message] sendExpertMessage failed", { error: String(err), userId });
    return NextResponse.json({ error: "Failed to send email." }, { status: 500 });
  }

  const { data: message, error: dbError } = await supabaseAdmin
    .from("client_messages")
    .insert({ user_id: userId, direction: "outbound", body: text, resend_email_id: resendEmailId })
    .select("id, direction, body, created_at")
    .single();

  if (dbError) {
    // Email was sent — log but don't fail
    console.error("[admin/message] DB insert failed after successful send", { error: dbError.message, userId, resendEmailId });
    return NextResponse.json({ ok: true, message: null });
  }

  return NextResponse.json({ ok: true, message });
}
