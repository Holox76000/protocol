import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../../../../../../lib/adminAuth";
import { supabaseAdmin } from "../../../../../../lib/supabase";
import { createSession, SESSION_COOKIE_OPTIONS } from "../../../../../../lib/auth";
import { SESSION_COOKIE_NAME } from "../../../../../../lib/auth-constants";

export const runtime = "nodejs";

export async function POST(
  _request: NextRequest,
  { params }: { params: { userId: string } }
) {
  await requireAdmin();

  const { userId } = params;

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, email, first_name, has_paid, protocol_status")
    .eq("id", userId)
    .maybeSingle();

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Create a real session for this user (30-day, same as normal login)
  const token = await createSession(userId);

  const response = NextResponse.json({
    ok: true,
    redirectTo: `/protocol/${encodeURIComponent(user.email as string)}/summary`,
  });

  response.cookies.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);

  console.log("[admin/impersonate] Admin impersonating user", { userId, email: user.email });

  return response;
}
