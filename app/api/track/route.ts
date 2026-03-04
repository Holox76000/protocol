import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase";

type TrackPayload = {
  sessionId: string;
  event: string;
  step?: number;
  payload?: Record<string, unknown>;
  createdAt?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as TrackPayload;

  if (!body.sessionId || !body.event) {
    return NextResponse.json({ ok: false, error: "Missing sessionId or event" }, { status: 400 });
  }

  const createdAt = body.createdAt ?? new Date().toISOString();

  const { error } = await supabaseAdmin.from("event_sessions").upsert(
    {
      session_id: body.sessionId,
      event: body.event,
      step: typeof body.step === "number" ? body.step : null,
      payload: body.payload ?? null,
      created_at: createdAt
    },
    { onConflict: "session_id,event,step" }
  );

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
