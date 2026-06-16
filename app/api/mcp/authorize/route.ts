import { NextRequest, NextResponse } from "next/server";
import { makeCode } from "../../../../lib/mcp-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LOGIN    = () => process.env.MCP_LOGIN    ?? "";
const PASSWORD = () => process.env.MCP_PASSWORD ?? "";

function esc(v: string) {
  return v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderForm(params: Record<string, string>, error?: string): string {
  const hidden = Object.entries(params)
    .map(([k, v]) => `<input type="hidden" name="${esc(k)}" value="${esc(v)}">`)
    .join("\n    ");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Protocol Club · MCP Login</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:#F7F6F3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}
  .card{background:#fff;border:1px solid #E5E3DE;border-radius:16px;padding:40px;width:100%;max-width:380px;box-shadow:0 4px 24px rgba(0,0,0,.06)}
  .logo{font-family:Georgia,serif;font-size:22px;font-weight:700;color:#1A1A18;margin-bottom:4px}
  .sub{font-size:12px;color:#7F8C8D;margin-bottom:32px;letter-spacing:.04em;text-transform:uppercase}
  label{display:block;font-size:12px;font-weight:600;color:#1A1A18;margin-bottom:6px;letter-spacing:.04em;text-transform:uppercase}
  input{width:100%;border:1px solid #E5E3DE;border-radius:8px;padding:11px 14px;font-size:14px;color:#1A1A18;background:#fff;outline:none;transition:border-color .15s}
  input:focus{border-color:#8AACB8}
  .field{margin-bottom:16px}
  button{width:100%;background:#1A1A18;color:#fff;border:none;border-radius:8px;padding:13px;font-size:14px;font-weight:600;cursor:pointer;margin-top:8px;transition:background .15s}
  button:hover{background:#2d2d2b}
  .err{font-size:13px;color:#C0392B;margin-top:12px}
</style>
</head>
<body>
<div class="card">
  <div class="logo">Prtcl.</div>
  <div class="sub">MCP · Data access</div>
  <form method="POST" action="/api/mcp/authorize">
    ${hidden}
    <div class="field">
      <label>Login</label>
      <input type="text" name="username" autocomplete="username" required autofocus>
    </div>
    <div class="field">
      <label>Password</label>
      <input type="password" name="password" autocomplete="current-password" required>
    </div>
    <button type="submit">Connect →</button>
    ${error ? `<div class="err">${esc(error)}</div>` : ""}
  </form>
</div>
</body>
</html>`;
}

// All OAuth params that need to be preserved through the login form
const OAUTH_PARAMS = [
  "redirect_uri", "state", "code_challenge", "code_challenge_method",
  "client_id", "scope", "resource", "response_type",
];

function extractParams(searchParams: URLSearchParams | FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of OAUTH_PARAMS) {
    const v = searchParams.get(key);
    if (v) out[key] = String(v);
  }
  return out;
}

// ── GET — show login form ──────────────────────────────────

export async function GET(req: NextRequest) {
  const params = extractParams(req.nextUrl.searchParams);
  return new NextResponse(renderForm(params), { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

// ── POST — validate credentials, issue auth code ──────────

export async function POST(req: NextRequest) {
  const body = await req.formData();
  const params = extractParams(body);

  const username = String(body.get("username") ?? "");
  const password = String(body.get("password") ?? "");

  const validLogin    = LOGIN();
  const validPassword = PASSWORD();
  if (!validLogin || !validPassword || username !== validLogin || password !== validPassword) {
    return new NextResponse(
      renderForm(params, "Invalid credentials."),
      { status: 401, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const redirectUri   = params.redirect_uri ?? "";
  const codeChallenge = params.code_challenge ?? "";

  if (!redirectUri || !codeChallenge) {
    return new NextResponse("Missing redirect_uri or code_challenge", { status: 400 });
  }

  const code = makeCode(redirectUri, codeChallenge);
  const url  = new URL(redirectUri);
  url.searchParams.set("code", code);
  if (params.state) url.searchParams.set("state", params.state);

  return NextResponse.redirect(url.toString(), 302);
}
