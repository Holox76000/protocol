import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../../../../../../lib/adminAuth";
import { supabaseAdmin } from "../../../../../../lib/supabase";

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
    .select("email, has_paid, protocol_viewed_at")
    .eq("id", userId)
    .maybeSingle();

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (!user.has_paid) return NextResponse.json({ error: "User has not paid" }, { status: 400 });
  if (!user.protocol_viewed_at) return NextResponse.json({ error: "User has not viewed their protocol yet" }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("users")
    .update({ nps_sent_at: null, nps_token: null })
    .eq("id", userId);

  if (error) {
    console.error("[admin/resend-nps] update failed", error.message);
    return NextResponse.json({ error: "Failed to reset NPS fields" }, { status: 500 });
  }

  console.log("[admin/resend-nps] NPS reset for resend", { userId, email: user.email });
  return NextResponse.json({ ok: true });
}
