import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { Resend } from "resend";
import { supabaseAdmin } from "../../../../lib/supabase";
import { notifyInboundEmailToSlack } from "../../../../lib/inboundEmailSlack";

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

  // If no userId match, still forward to admin — just skip DB insert
  if (!userId) {
    console.log("[webhook/resend-inbound] No userId — forwarding directly to admin", { to, from: event.data.from });
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "Protocol Inbound <noreply@protocol-club.com>",
        to: FORWARD_TO,
        subject: `[Inbound] ${event.data.subject ?? "(no subject)"}`,
        replyTo: event.data.from,
        text: `From: ${event.data.from}\nTo: ${to.join(", ")}\n\n${body}`,
      });
    } catch (err) {
      console.error("[webhook/resend-inbound] Forward failed (no userId)", { error: String(err) });
    }
    await notifyInboundEmailToSlack({
      from: event.data.from,
      toAddresses: to,
      subject: event.data.subject ?? null,
      body,
      emailId,
      userId: null,
      userFound: false,
    });
    return NextResponse.json({ received: true });
  }

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (!user) {
    console.warn("[webhook/resend-inbound] Unknown userId — forwarding directly to admin", { userId });
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "Protocol Inbound <noreply@protocol-club.com>",
        to: FORWARD_TO,
        subject: `[Inbound] ${event.data.subject ?? "(no subject)"}`,
        replyTo: event.data.from,
        text: `From: ${event.data.from}\nUser ID (unknown): ${userId}\n\n${body}`,
      });
    } catch (err) {
      console.error("[webhook/resend-inbound] Forward failed (unknown userId)", { error: String(err) });
    }
    await notifyInboundEmailToSlack({
      from: event.data.from,
      toAddresses: to,
      subject: event.data.subject ?? null,
      body,
      emailId,
      userId,
      userFound: false,
    });
    return NextResponse.json({ received: true });
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

  await notifyInboundEmailToSlack({
    from: event.data.from,
    toAddresses: to,
    subject: event.data.subject ?? null,
    body,
    emailId,
    userId,
    userFound: true,
  });

  return NextResponse.json({ received: true });
}
