import { createHmac, createHash } from "crypto";

const SECRET   = () => process.env.MCP_SECRET ?? "";
const TOKEN_TTL = 365 * 24 * 60 * 60 * 1000;

function hmac(data: string) {
  return createHmac("sha256", SECRET()).update(data).digest("base64url");
}

export function makeCode(redirectUri: string, codeChallenge: string): string {
  const exp  = Date.now() + 5 * 60 * 1000;
  const data = `${exp}|${redirectUri}|${codeChallenge}`;
  return Buffer.from(`${data}|${hmac(data)}`).toString("base64url");
}

export function verifyCode(code: string, codeVerifier: string, redirectUri: string): boolean {
  try {
    const raw   = Buffer.from(code, "base64url").toString();
    const parts = raw.split("|");
    if (parts.length !== 4) return false;
    const [expStr, storedRedirect, storedChallenge, sig] = parts;
    if (Date.now() > Number(expStr)) return false;
    if (hmac(`${expStr}|${storedRedirect}|${storedChallenge}`) !== sig) return false;
    if (storedRedirect !== redirectUri) return false;
    const challenge = createHash("sha256").update(codeVerifier).digest("base64url");
    return challenge === storedChallenge;
  } catch { return false; }
}

export function makeToken(): string {
  const exp  = Date.now() + TOKEN_TTL;
  const data = `mcp-access|${exp}`;
  return Buffer.from(`${data}|${hmac(data)}`).toString("base64url");
}

export function verifyToken(token: string): boolean {
  try {
    const raw              = Buffer.from(token, "base64url").toString();
    const [prefix, expStr, sig] = raw.split("|");
    if (prefix !== "mcp-access") return false;
    if (Date.now() > Number(expStr)) return false;
    return hmac(`${prefix}|${expStr}`) === sig;
  } catch { return false; }
}
