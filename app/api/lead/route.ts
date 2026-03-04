import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase";

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

  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
  }

  const payload: LeadPayload = {
    ...body,
    email
  };

  const { error } = await supabaseAdmin.from("leads").insert({
    email,
    payload,
    created_at: new Date().toISOString()
  });
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  console.log("[lead]", payload);

  // TODO: Send payload to Klaviyo/Mailchimp and persist to database.

  return NextResponse.json({ ok: true });
}
