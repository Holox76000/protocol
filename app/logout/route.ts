import { NextResponse, type NextRequest } from "next/server";
import { deleteSession, SESSION_COOKIE_NAME } from "../../lib/auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await deleteSession(token).catch((err) => {
      console.error("[logout] Failed to delete session", { error: String(err) });
    });
  }

  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  response.cookies.set("prtcl_uid", "", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}
