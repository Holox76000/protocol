import { NextResponse } from "next/server";
import { withCors, corsPreflight } from "../../../../../lib/cors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE = "https://protocol-club.com";

export async function OPTIONS() { return corsPreflight(); }

export async function GET() {
  return withCors(NextResponse.json({
    resource: `${BASE}/api/mcp`,
    authorization_servers: [BASE],
    bearer_methods_supported: ["header"],
    scopes_supported: ["mcp", "mcp:tools"],
    resource_documentation: `${BASE}/api/mcp`,
  }));
}
