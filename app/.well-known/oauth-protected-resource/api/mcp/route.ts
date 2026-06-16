import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE = "https://protocol-club.com";

export async function GET() {
  return NextResponse.json({
    resource: `${BASE}/api/mcp`,
    authorization_servers: [BASE],
    bearer_methods_supported: ["header"],
    scopes_supported: ["mcp"],
  });
}
