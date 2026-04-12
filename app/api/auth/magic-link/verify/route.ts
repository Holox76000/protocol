import { NextResponse } from "next/server";
import {
  consumeMagicLinkToken,
  checkMagicLinkRateLimit,
  createSession,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
} from "../../../../../lib/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token") ?? "";
  const redirect = searchParams.get("redirect") ?? "/dashboard";

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (!checkMagicLinkRateLimit(ip)) {
    return NextResponse.redirect(new URL("/login?error=too_many_attempts", request.url));
  }

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=link_invalid", request.url));
  }

  const result = await consumeMagicLinkToken(token);

  if (!result) {
    return NextResponse.redirect(new URL("/login?error=link_expired", request.url));
  }

  const userAgent = request.headers.get("user-agent") ?? undefined;

  let sessionToken: string;
  try {
    sessionToken = await createSession(result.userId, ip, userAgent);
  } catch (err) {
    console.error("[magic-link/verify] session creation failed", { error: String(err), userId: result.userId });
    return NextResponse.redirect(new URL("/login?error=session_failed", request.url));
  }

  // Prevent open redirect — only allow relative paths
  const safePath = redirect.startsWith("/") ? redirect : "/dashboard";
  const response = NextResponse.redirect(new URL(safePath, request.url));
  response.cookies.set(SESSION_COOKIE_NAME, sessionToken, SESSION_COOKIE_OPTIONS);

  return response;
}
