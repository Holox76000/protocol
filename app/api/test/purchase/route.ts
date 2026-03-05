import { NextResponse } from "next/server";
import { sendMetaEvent } from "../../../../lib/metaCapi";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const token = process.env.TEST_TRIGGER_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Test token not configured" }, { status: 500 });
  }

  const auth = request.headers.get("authorization");
  if (!auth || auth !== `Bearer ${token}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    value?: number;
    currency?: string;
    email?: string;
  };

  const eventTime = Math.floor(Date.now() / 1000);
  const eventId = `test-purchase-${Date.now()}`;

  await sendMetaEvent({
    eventName: "Purchase",
    eventTime,
    eventId,
    actionSource: "other",
    email: body.email ?? null,
    customData: {
      value: typeof body.value === "number" ? body.value : 1,
      currency: body.currency ?? "usd"
    }
  });

  return NextResponse.json({ ok: true, eventId });
}
