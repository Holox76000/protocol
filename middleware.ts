import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "./lib/auth";

// Routes that require authentication
const PROTECTED_PREFIXES = ["/dashboard", "/questionnaire", "/admin"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );

  if (!isProtected) return NextResponse.next();

  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Session token exists — full validation happens in the page/API route.
  // Middleware only gate-keeps the cookie presence to avoid DB calls at edge.
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/questionnaire/:path*",
    "/admin/:path*",
  ],
};
