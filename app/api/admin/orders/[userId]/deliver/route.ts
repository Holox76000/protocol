import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../../../../../../lib/adminAuth";
import { supabaseAdmin } from "../../../../../../lib/supabase";
import { sendProtocolDeliveredEmail } from "../../../../../../lib/email";

export const runtime = "nodejs";

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://protocol-club.com";

export async function POST(
  _request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId } = params;

  // Guard: protocol must exist and have at least one section with content
  const { data: protocol } = await supabaseAdmin
    .from("protocols")
    .select("summary, nutrition_plan_content, workout_plan_content, sleeping_advices_content, action_plan_content, supplement_protocol_content, posture_analysis_content")
    .eq("user_id", userId)
    .maybeSingle();

  const hasContent = protocol && (
    protocol.summary?.trim() ||
    protocol.nutrition_plan_content?.trim() ||
    protocol.workout_plan_content?.trim() ||
    protocol.sleeping_advices_content?.trim() ||
    protocol.action_plan_content?.trim() ||
    protocol.supplement_protocol_content?.trim() ||
    protocol.posture_analysis_content?.trim()
  );

  if (!hasContent) {
    return NextResponse.json(
      { error: "Protocol has no content. Generate sections before delivering." },
      { status: 400 }
    );
  }

  // Fetch user for email notification
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("email, first_name, protocol_status")
    .eq("id", userId)
    .maybeSingle();

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const isRedelivery = user.protocol_status === "delivered";

  // Mark as delivered — on re-delivery, also reset protocol_viewed_at so NPS re-triggers
  const now = new Date().toISOString();

  const userUpdateFields: Record<string, string | null> = { protocol_status: "delivered" };
  if (isRedelivery) userUpdateFields.protocol_viewed_at = null;

  const [userUpdate, protocolUpdate] = await Promise.all([
    supabaseAdmin
      .from("users")
      .update(userUpdateFields)
      .eq("id", userId),
    supabaseAdmin
      .from("protocols")
      .update({ delivered_at: now })
      .eq("user_id", userId),
  ]);

  if (userUpdate.error || protocolUpdate.error) {
    console.error("[admin/deliver] update failed", {
      userError: userUpdate.error?.message,
      protocolError: protocolUpdate.error?.message,
    });
    return NextResponse.json({ error: "Failed to mark as delivered" }, { status: 500 });
  }

  // Send protocol delivered email via Resend (non-fatal)
  void sendProtocolDeliveredEmail({
    email: user.email,
    firstName: user.first_name,
    dashboardUrl: `${SITE_URL}/protocol/${encodeURIComponent(user.email)}/summary`,
  }).catch((err) =>
    console.error("[admin/deliver] Protocol delivered email failed", { error: String(err) })
  );

  console.log("[admin/deliver] Protocol delivered", { userId, email: user.email, redelivery: isRedelivery });

  return NextResponse.json({ ok: true, redelivery: isRedelivery });
}
