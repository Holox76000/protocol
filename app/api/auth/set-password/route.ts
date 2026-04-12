import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "../../../../lib/supabase";
import { validateSession, SESSION_COOKIE_NAME } from "../../../../lib/auth";

export const runtime = "nodejs";

type Body = {
  password?: string;
};

export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const user = await validateSession(sessionToken);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as Body;
  const password = body.password ?? "";

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const { error } = await supabaseAdmin
    .from("users")
    .update({ password_hash: passwordHash })
    .eq("id", user.id);

  if (error) {
    console.error("[set-password] update failed", { error: error.message, userId: user.id });
    return NextResponse.json({ error: "Failed to set password. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
