import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase";
import { sendMetaEvent } from "../../../lib/metaCapi";

type TrackPayload = {
  sessionId: string;
  event: string;
  step?: number;
  payload?: Record<string, unknown>;
  createdAt?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as TrackPayload;
  console.log("[track] incoming", body);

  if (!body.sessionId || !body.event) {
    return NextResponse.json({ ok: false, error: "Missing sessionId or event" }, { status: 400 });
  }

  const createdAt = body.createdAt ?? new Date().toISOString();
  const eventTime = Math.floor(new Date(createdAt).getTime() / 1000) || Math.floor(Date.now() / 1000);

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
    console.error("[track] db error", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  if (body.event === "quiz_started") {
    const userAgent = request.headers.get("user-agent") ?? undefined;
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const eventSourceUrl =
      request.headers.get("referer") ?? request.headers.get("origin") ?? undefined;

    await sendMetaEvent({
      eventName: "StartQuiz",
      eventTime,
      eventId: `${body.sessionId}:quiz_started`,
      actionSource: "website",
      eventSourceUrl,
      userAgent,
      ipAddress
    });
    console.log("[track] meta sent", {
      event: "StartQuiz",
      sessionId: body.sessionId
    });
  }

  return NextResponse.json({ ok: true });
}
