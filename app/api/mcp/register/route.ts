import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Dynamic Client Registration (RFC 7591)
// Accepts any client and returns a generated client_id.
// Auth is enforced at the /authorize and /token level via login/password and PKCE.

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch { /* allow empty body */ }

  const clientId = `mcp-${randomBytes(12).toString("hex")}`;

  const redirectUris = Array.isArray(body.redirect_uris)
    ? body.redirect_uris
    : [];

  return NextResponse.json({
    client_id: clientId,
    client_id_issued_at: Math.floor(Date.now() / 1000),
    redirect_uris: redirectUris,
    grant_types: ["authorization_code"],
    response_types: ["code"],
    token_endpoint_auth_method: "none",
    client_name: body.client_name ?? "MCP Client",
  });
}
