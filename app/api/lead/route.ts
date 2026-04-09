import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase";
import { sendMetaEvent } from "../../../lib/metaCapi";
import { trackKlaviyoStartedCheckout } from "../../../lib/klaviyo";

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
  mode?: "create" | "merge";
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
  if (body.mode === "merge") {
    const { data: existingRows, error: selectError } = await supabaseAdmin
      .from("leads")
      .select("payload")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1);

    if (selectError) {
      console.error("[lead] db select error", selectError);
      return NextResponse.json({ ok: false, error: selectError.message }, { status: 500 });
    }

    const existing = existingRows?.[0]?.payload as LeadPayload | undefined;
    const mergedPayload: LeadPayload = {
      ...existing,
      ...payload,
      email,
      answers: {
        ...(existing?.answers ?? {}),
        ...(payload.answers ?? {}),
      },
      utm: {
        ...(existing?.utm ?? {}),
        ...(payload.utm ?? {}),
      },
    };

    if (existingRows && existingRows.length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from("leads")
        .update({
          payload: mergedPayload,
        })
        .eq("email", email);

      if (updateError) {
        console.error("[lead] db update error", updateError);
        return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
      }
    } else {
      const { error: insertError } = await supabaseAdmin.from("leads").insert({
        email,
        payload: mergedPayload,
        created_at: createdAt
      });

      if (insertError) {
        console.error("[lead] db insert error", insertError);
        return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 });
      }
    }
  } else {
    const { error } = await supabaseAdmin.from("leads").insert({
      email,
      payload,
      created_at: createdAt
    });
    if (error) {
      console.error("[lead] db error", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
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

  // Fire-and-forget — never blocks the response to the user
  void trackKlaviyoStartedCheckout({
    email,
    firstName: body.answers?.first_name,
    value: 49,
    checkoutUrl: "https://protocol-club.com/checkout?funnel=f1",
    items: [
      {
        ProductID: "f1-attractiveness-protocol",
        ProductName: "Attractiveness Protocol",
        Quantity: 1,
        ItemPrice: 49,
        RowTotal: 49,
        ProductURL: "https://protocol-club.com/f1/offer",
      },
    ],
    utm: body.utm as Record<string, string | undefined> | undefined,
  });

  return NextResponse.json({ ok: true });
}
