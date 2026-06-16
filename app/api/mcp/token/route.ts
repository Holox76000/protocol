import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SECRET = process.env.MCP_SECRET ?? "";
const TOKEN_TTL = 365 * 24 * 60 * 60 * 1000; // 1 an

function hmac(data: string) {
  return createHmac("sha256", SECRET).update(data).digest("base64url");
}

function verifyCode(code: string, codeVerifier: string, redirectUri: string): boolean {
  try {
    const raw = Buffer.from(code, "base64url").toString();
    const parts = raw.split("|");
    if (parts.length !== 4) return false;
    const [expStr, storedRedirect, storedChallenge, sig] = parts;

    // Check expiry
    if (Date.now() > Number(expStr)) return false;

    // Check signature
    const data = `${expStr}|${storedRedirect}|${storedChallenge}`;
    if (hmac(data) !== sig) return false;

    // Check redirect_uri
    if (storedRedirect !== redirectUri) return false;

    // Verify PKCE: S256 = BASE64URL(SHA256(code_verifier))
    const { createHash } = require("crypto");
    const challenge = createHash("sha256")
      .update(codeVerifier)
      .digest("base64url");
    return challenge === storedChallenge;
  } catch {
    return false;
  }
}

function makeToken(): string {
  const exp = Date.now() + TOKEN_TTL;
  const data = `mcp-access|${exp}`;
  const sig = hmac(data);
  return Buffer.from(`${data}|${sig}`).toString("base64url");
}

export function verifyToken(token: string): boolean {
  try {
    const raw = Buffer.from(token, "base64url").toString();
    const [prefix, expStr, sig] = raw.split("|");
    if (prefix !== "mcp-access") return false;
    if (Date.now() > Number(expStr)) return false;
    return hmac(`${prefix}|${expStr}`) === sig;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  let params: URLSearchParams | FormData;
  const ct = req.headers.get("content-type") ?? "";

  if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
    const text = await req.text();
    params = new URLSearchParams(text);
  } else {
    const text = await req.text();
    params = new URLSearchParams(text);
  }

  const get = (k: string) => (params as URLSearchParams).get(k) ?? "";

  const grantType    = get("grant_type");
  const code         = get("code");
  const redirectUri  = get("redirect_uri");
  const codeVerifier = get("code_verifier");

  if (grantType !== "authorization_code") {
    return NextResponse.json({ error: "unsupported_grant_type" }, { status: 400 });
  }

  if (!verifyCode(code, codeVerifier, redirectUri)) {
    return NextResponse.json({ error: "invalid_grant" }, { status: 400 });
  }

  const accessToken = makeToken();
  return NextResponse.json({
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: Math.floor(TOKEN_TTL / 1000),
  });
}
