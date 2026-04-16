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

  // Guard: protocol must exist and have content
  const { data: protocol } = await supabaseAdmin
    .from("protocols")
    .select("content")
    .eq("user_id", userId)
    .maybeSingle();

  if (!protocol || !protocol.content?.trim()) {
    return NextResponse.json(
      { error: "Protocol content is empty. Save a draft before delivering." },
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

  if (user.protocol_status === "delivered") {
    return NextResponse.json({ error: "Already delivered" }, { status: 409 });
  }

  // Mark as delivered in both tables
  const now = new Date().toISOString();

  const [userUpdate, protocolUpdate] = await Promise.all([
    supabaseAdmin
      .from("users")
      .update({ protocol_status: "delivered" })
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
    dashboardUrl: `${SITE_URL}/protocol`,
  }).catch((err) =>
    console.error("[admin/deliver] Protocol delivered email failed", { error: String(err) })
  );

  console.log("[admin/deliver] Protocol delivered", { userId, email: user.email });

  return NextResponse.json({ ok: true });
}
