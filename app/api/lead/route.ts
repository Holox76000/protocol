import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase";
import { sendMetaEvent } from "../../../lib/metaCapi";

type LeadPayload = {
  email: string;
  answers: Record<string, string>;
  startedAt?: string;
  completedAt?: string;
  utm?: Record<string, string | undefined>;
  score?: number;
  segment?: string;
  blocker?: string;
  userAgent?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as LeadPayload;
  const email = body.email?.trim();
  console.log("[lead] incoming", { email });

  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
  }

  const payload: LeadPayload = {
    ...body,
    email
  };

  const createdAt = new Date().toISOString();
  const { error } = await supabaseAdmin.from("leads").insert({
    email,
    payload,
    created_at: createdAt
  });
  if (error) {
    console.error("[lead] db error", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  console.log("[lead]", payload);

  const eventTime = Math.floor(new Date(createdAt).getTime() / 1000) || Math.floor(Date.now() / 1000);
  const userAgent = request.headers.get("user-agent") ?? undefined;
  const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const eventSourceUrl = request.headers.get("referer") ?? request.headers.get("origin") ?? undefined;

  await sendMetaEvent({
    eventName: "Lead",
    eventTime,
    eventId: `lead:${email}:${createdAt}`,
    actionSource: "website",
    eventSourceUrl,
    userAgent,
    ipAddress,
    email
  });
  console.log("[lead] meta sent", { email });

  // TODO: Send payload to Klaviyo/Mailchimp and persist to database.

  return NextResponse.json({ ok: true });
}
