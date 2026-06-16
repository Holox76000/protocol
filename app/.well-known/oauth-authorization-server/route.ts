import { NextResponse } from "next/server";
import { withCors, corsPreflight } from "../../../lib/cors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS() { return corsPreflight(); }

export async function GET() {
  const base = process.env.SITE_URL ?? "https://protocol-club.com";
  return withCors(NextResponse.json({
    issuer: base,
    authorization_endpoint: `${base}/api/mcp/authorize`,
    token_endpoint: `${base}/api/mcp/token`,
    registration_endpoint: `${base}/api/mcp/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
    scopes_supported: ["mcp", "mcp:tools"],
  }));
}
