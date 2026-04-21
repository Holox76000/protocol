import { NextResponse } from "next/server";
import {
  verifyCartRecoveryToken,
  createSession,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
} from "../../../../../lib/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token") ?? "";

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://protocol-club.com";

  if (!token) {
    return NextResponse.redirect(new URL("/register", baseUrl));
  }

  const result = await verifyCartRecoveryToken(token);

  if (!result) {
    // Link expired — send to register to start over
    return NextResponse.redirect(new URL("/register?error=link_expired", baseUrl));
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const userAgent = request.headers.get("user-agent") ?? undefined;

  let sessionToken: string;
  try {
    sessionToken = await createSession(result.userId, ip, userAgent);
  } catch (err) {
    console.error("[cart-recovery/verify] session creation failed", { error: String(err), userId: result.userId });
    return NextResponse.redirect(new URL("/register", baseUrl));
  }

  const response = NextResponse.redirect(new URL("/checkout", baseUrl));
  response.cookies.set(SESSION_COOKIE_NAME, sessionToken, SESSION_COOKIE_OPTIONS);
  response.cookies.set("prtcl_uid", result.userId, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  });

  return response;
}
