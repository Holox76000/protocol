import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import {
  verifyPassword,
  createSession,
  checkRateLimit,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
} from "../../../../lib/auth";

export const runtime = "nodejs";

type Body = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  // ── Rate limit ───────────────────────────────
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a minute and try again." },
      { status: 429 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as Body;
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  // ── Look up user ─────────────────────────────
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, email, first_name, password_hash, has_paid, protocol_status")
    .eq("email", email)
    .maybeSingle();

  // Always run bcrypt compare to prevent timing attacks
  const dummyHash =
    "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";
  const hashToCompare = user?.password_hash ?? dummyHash;
  const passwordMatch = await verifyPassword(password, hashToCompare);

  if (!user || !passwordMatch) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 }
    );
  }

  // ── Create session ───────────────────────────
  const userAgent = request.headers.get("user-agent") ?? undefined;

  let sessionToken: string;
  try {
    sessionToken = await createSession(user.id, ip, userAgent);
  } catch (err) {
    console.error("[login] Session creation failed", { error: String(err), userId: user.id });
    return NextResponse.json(
      { error: "Login failed. Please try again." },
      { status: 500 }
    );
  }

  const response = NextResponse.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      has_paid: user.has_paid,
      protocol_status: user.protocol_status,
    },
  });

  response.cookies.set(SESSION_COOKIE_NAME, sessionToken, SESSION_COOKIE_OPTIONS);
  response.cookies.set("prtcl_uid", user.id, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  });

  return response;
}
