import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { supabaseAdmin } from "../../../../lib/supabase";

export const runtime = "nodejs";

type ResendEventData = {
  email_id: string;
  to?: string[];
  from?: string;
  subject?: string;
  created_at?: string;
  bounce?: { type?: string; message?: string };
  click?: { link?: string };
};

type ResendEvent = {
  type: string;
  created_at?: string;
  data: ResendEventData;
};

const HARD_BOUNCE_TYPES = new Set(["hard_bounce", "permanent", "bounce"]);

async function suppress(email: string, reason: string, source: string) {
  const normalized = email.toLowerCase();
  await supabaseAdmin
    .from("email_suppressions")
    .upsert(
      { email: normalized, reason, source },
      { onConflict: "email" }
    );
  await supabaseAdmin
    .from("leads")
    .update({ nurture_paused_at: new Date().toISOString() })
    .eq("email", normalized);
}

export async function POST(request: Request) {
  const secret = process.env.RESEND_EVENTS_WEBHOOK_SECRET ?? process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[webhook/resend-events] RESEND_EVENTS_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const payload = await request.text();
  const headers = {
    "svix-id":        request.headers.get("svix-id") ?? "",
    "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
    "svix-signature": request.headers.get("svix-signature") ?? "",
  };

  let event: ResendEvent;
  try {
    const wh = new Webhook(secret);
    event = wh.verify(payload, headers) as ResendEvent;
  } catch {
    console.error("[webhook/resend-events] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const data = event.data ?? {};
  const recipient = data.to?.[0] ?? null;

  // Log every event for analytics.
  const occurredAt = event.created_at ?? data.created_at ?? new Date().toISOString();
  await supabaseAdmin.from("email_events").insert({
    email_id: data.email_id ?? "",
    type: event.type,
    email: recipient,
    subject: data.subject ?? null,
    occurred_at: occurredAt,
    payload: data,
  });

  // Autopause on hard bounce or complaint.
  if (recipient) {
    if (event.type === "email.bounced") {
      const bounceType = data.bounce?.type?.toLowerCase() ?? "";
      if (HARD_BOUNCE_TYPES.has(bounceType) || bounceType === "") {
        await suppress(recipient, "hard_bounce", "resend_event");
        console.log("[webhook/resend-events] suppressed (bounce)", { email: recipient, bounceType });
      }
    } else if (event.type === "email.complained") {
      await suppress(recipient, "complaint", "resend_event");
      console.log("[webhook/resend-events] suppressed (complaint)", { email: recipient });
    }
  }

  return NextResponse.json({ received: true });
}
