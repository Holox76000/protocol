import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { verifyUnsubscribeToken } from "../../../../lib/auth";

export const runtime = "nodejs";

// RFC 8058 one-click unsubscribe expects POST to this URL.
// Gmail/Outlook also send GET when the user clicks the link in the email body.
// We accept both and respond with a small confirmation page on GET.

async function suppress(email: string, source: string) {
  const normalized = email.toLowerCase();

  await supabaseAdmin
    .from("email_suppressions")
    .upsert(
      { email: normalized, reason: "unsubscribed", source },
      { onConflict: "email" }
    );

  await supabaseAdmin
    .from("leads")
    .update({ nurture_paused_at: new Date().toISOString() })
    .eq("email", normalized);
}

function confirmPage(): string {
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Unsubscribed</title>
<style>
  body{margin:0;padding:48px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,sans-serif;background:#f9fbfb;color:#253239;}
  .card{max-width:480px;margin:0 auto;background:#fff;border:1px solid #edf0f1;border-radius:16px;padding:40px;box-shadow:0 4px 24px rgba(37,50,57,0.06);}
  h1{margin:0 0 16px;font-size:22px;font-weight:500;letter-spacing:-0.02em;}
  p{margin:0 0 12px;font-size:15px;line-height:1.6;color:#515255;}
</style></head><body>
<div class="card">
  <h1>You're unsubscribed.</h1>
  <p>You won't receive further marketing emails from Protocol Club.</p>
  <p>Transactional emails (order confirmation, login, support replies) will still reach you.</p>
</div></body></html>`;
}

function invalidPage(): string {
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Invalid link</title>
<style>
  body{margin:0;padding:48px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,sans-serif;background:#f9fbfb;color:#253239;}
  .card{max-width:480px;margin:0 auto;background:#fff;border:1px solid #edf0f1;border-radius:16px;padding:40px;box-shadow:0 4px 24px rgba(37,50,57,0.06);}
  h1{margin:0 0 16px;font-size:22px;font-weight:500;letter-spacing:-0.02em;}
  p{margin:0 0 12px;font-size:15px;line-height:1.6;color:#515255;}
</style></head><body>
<div class="card">
  <h1>This link is no longer valid.</h1>
  <p>It may have already been used or has expired. If you want to unsubscribe, reply to any email with "stop" and we'll handle it manually.</p>
</div></body></html>`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  if (!token) {
    return new Response(invalidPage(), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const result = await verifyUnsubscribeToken(token);
  if (!result) {
    return new Response(invalidPage(), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  await suppress(result.email, "user_click");

  return new Response(confirmPage(), {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  if (!token) return NextResponse.json({ error: "missing token" }, { status: 400 });

  const result = await verifyUnsubscribeToken(token);
  if (!result) return NextResponse.json({ error: "invalid token" }, { status: 400 });

  await suppress(result.email, "one_click");

  return NextResponse.json({ ok: true });
}
