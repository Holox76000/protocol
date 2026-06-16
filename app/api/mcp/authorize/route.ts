import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LOGIN    = process.env.MCP_LOGIN    ?? "protocol";
const PASSWORD = process.env.MCP_PASSWORD ?? "fhEtyIIAz-UgoBrgR07-dXkplz10P46L";
const SECRET   = process.env.MCP_SECRET   ?? "";

function signCode(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

function makeCode(redirectUri: string, codeChallenge: string): string {
  const exp = Date.now() + 5 * 60 * 1000; // 5 min
  const data = `${exp}|${redirectUri}|${codeChallenge}`;
  const sig = signCode(data);
  return Buffer.from(`${data}|${sig}`).toString("base64url");
}

// ── GET — show login form ──────────────────────────────────

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const redirectUri     = p.get("redirect_uri") ?? "";
  const state           = p.get("state") ?? "";
  const codeChallenge   = p.get("code_challenge") ?? "";

  const html = `<!DOCTYPE html>
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
  .err{font-size:13px;color:#C0392B;margin-top:12px;display:none}
</style>
</head>
<body>
<div class="card">
  <div class="logo">Prtcl.</div>
  <div class="sub">MCP · Data access</div>
  <form method="POST">
    <input type="hidden" name="redirect_uri" value="${redirectUri}">
    <input type="hidden" name="state" value="${state}">
    <input type="hidden" name="code_challenge" value="${codeChallenge}">
    <div class="field">
      <label>Login</label>
      <input type="text" name="username" autocomplete="username" required autofocus>
    </div>
    <div class="field">
      <label>Password</label>
      <input type="password" name="password" autocomplete="current-password" required>
    </div>
    <button type="submit">Connect →</button>
    <div class="err" id="err">Invalid credentials.</div>
  </form>
</div>
</body>
</html>`;

  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

// ── POST — validate credentials, issue auth code ──────────

export async function POST(req: NextRequest) {
  const body = await req.formData();
  const username      = String(body.get("username") ?? "");
  const password      = String(body.get("password") ?? "");
  const redirectUri   = String(body.get("redirect_uri") ?? "");
  const state         = String(body.get("state") ?? "");
  const codeChallenge = String(body.get("code_challenge") ?? "");

  if (username !== LOGIN || password !== PASSWORD) {
    // Re-render form with error
    const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Protocol Club · MCP Login</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{background:#F7F6F3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}.card{background:#fff;border:1px solid #E5E3DE;border-radius:16px;padding:40px;width:100%;max-width:380px;box-shadow:0 4px 24px rgba(0,0,0,.06)}.logo{font-family:Georgia,serif;font-size:22px;font-weight:700;color:#1A1A18;margin-bottom:4px}.sub{font-size:12px;color:#7F8C8D;margin-bottom:32px;letter-spacing:.04em;text-transform:uppercase}label{display:block;font-size:12px;font-weight:600;color:#1A1A18;margin-bottom:6px;letter-spacing:.04em;text-transform:uppercase}input{width:100%;border:1px solid #E5E3DE;border-radius:8px;padding:11px 14px;font-size:14px;color:#1A1A18;background:#fff;outline:none;transition:border-color .15s}input:focus{border-color:#8AACB8}.field{margin-bottom:16px}button{width:100%;background:#1A1A18;color:#fff;border:none;border-radius:8px;padding:13px;font-size:14px;font-weight:600;cursor:pointer;margin-top:8px}.err{font-size:13px;color:#C0392B;margin-top:12px}</style></head>
<body><div class="card">
  <div class="logo">Prtcl.</div>
  <div class="sub">MCP · Data access</div>
  <form method="POST">
    <input type="hidden" name="redirect_uri" value="${redirectUri}">
    <input type="hidden" name="state" value="${state}">
    <input type="hidden" name="code_challenge" value="${codeChallenge}">
    <div class="field"><label>Login</label><input type="text" name="username" value="${username}" required autofocus></div>
    <div class="field"><label>Password</label><input type="password" name="password" required></div>
    <button type="submit">Connect →</button>
    <div class="err">Identifiants incorrects.</div>
  </form>
</div></body></html>`;
    return new NextResponse(html, { status: 401, headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  const code = makeCode(redirectUri, codeChallenge);
  const url  = new URL(redirectUri);
  url.searchParams.set("code", code);
  if (state) url.searchParams.set("state", state);

  return NextResponse.redirect(url.toString(), 302);
}
