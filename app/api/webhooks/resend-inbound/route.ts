import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { Resend } from "resend";
import { supabaseAdmin } from "../../../../lib/supabase";

export const runtime = "nodejs";

const FORWARD_TO = "patrypierreandre@gmail.com";

type InboundEmailData = {
  email_id: string;
  to: string[];
  from: string;
  subject?: string;
};

type ResendWebhookEvent = {
  type: string;
  data: InboundEmailData;
};

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[webhook/resend-inbound] RESEND_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const payload = await request.text();
  const headers = {
    "svix-id":        request.headers.get("svix-id") ?? "",
    "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
    "svix-signature": request.headers.get("svix-signature") ?? "",
  };

  let event: ResendWebhookEvent;
  try {
    const wh = new Webhook(secret);
    event = wh.verify(payload, headers) as ResendWebhookEvent;
  } catch {
    console.error("[webhook/resend-inbound] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type !== "email.received") {
    return NextResponse.json({ received: true });
  }

  const { email_id: emailId, to } = event.data;

  // Extract userId from reply-to address: reply+{uuid}@{inbound-domain}
  const UUID_RE = /^reply\+([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})@/i;
  let userId: string | null = null;
  for (const addr of to) {
    const match = addr.match(UUID_RE);
    if (match) { userId = match[1]; break; }
  }

  if (!userId) {
    console.warn("[webhook/resend-inbound] No userId found in to addresses", { to });
    return NextResponse.json({ received: true });
  }

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (!user) {
    console.warn("[webhook/resend-inbound] Unknown userId", { userId });
    return NextResponse.json({ received: true });
  }

  // Fetch email body — webhook payload only contains metadata, not text/html
  let body = "(message body unavailable)";
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    // @ts-expect-error — resend.inbound.get() may not be typed in all SDK versions
    const email = await resend.inbound.get(emailId) as { text?: string; html?: string } | null;
    if (email?.text) {
      body = email.text.trim();
    } else if (email?.html) {
      body = email.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    }
  } catch (err) {
    console.error("[webhook/resend-inbound] Failed to fetch email body", { error: String(err), emailId });
  }

  const { error: dbError } = await supabaseAdmin
    .from("client_messages")
    .insert({ user_id: userId, direction: "inbound", body, resend_email_id: emailId });

  if (dbError) {
    console.error("[webhook/resend-inbound] DB insert failed", { error: dbError.message, userId });
  } else {
    console.log("[webhook/resend-inbound] Inbound message stored", { userId, emailId });
  }

  // Forward a copy to the admin inbox
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "Protocol Inbound <noreply@protocol-club.com>",
      to: FORWARD_TO,
      subject: `[Reply from client] ${event.data.subject ?? "(no subject)"}`,
      replyTo: event.data.from,
      text: `From: ${event.data.from}\nUser ID: ${userId}\n\n${body}`,
    });
  } catch (err) {
    console.error("[webhook/resend-inbound] Forward failed", { error: String(err) });
  }

  return NextResponse.json({ received: true });
}
