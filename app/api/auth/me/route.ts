import { NextResponse, type NextRequest } from "next/server";
import { validateSession, SESSION_COOKIE_NAME } from "../../../../lib/auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ user: null });
  }

  const user = await validateSession(token);
  return NextResponse.json({ user: user ?? null });
}
