import { NextRequest, NextResponse } from "next/server";
import { verifyCode, makeToken } from "../../../../lib/mcp-auth";
import { withCors, corsPreflight } from "../../../../lib/cors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS() { return corsPreflight(); }

export async function POST(req: NextRequest) {
  const text   = await req.text();
  const params = new URLSearchParams(text);
  const get    = (k: string) => params.get(k) ?? "";

  if (get("grant_type") !== "authorization_code") {
    return withCors(NextResponse.json({ error: "unsupported_grant_type" }, { status: 400 }));
  }

  if (!verifyCode(get("code"), get("code_verifier"), get("redirect_uri"))) {
    return withCors(NextResponse.json({ error: "invalid_grant" }, { status: 400 }));
  }

  // Optional: validate `resource` parameter per RFC 8707
  // We accept any resource that includes our MCP endpoint path
  const resource = get("resource");
  if (resource && !resource.includes("/api/mcp")) {
    return withCors(NextResponse.json({ error: "invalid_target" }, { status: 400 }));
  }

  return withCors(NextResponse.json({
    access_token: makeToken(),
    token_type: "Bearer",
    expires_in: 365 * 24 * 3600,
    scope: get("scope") || "mcp:tools",
  }));
}
