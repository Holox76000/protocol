import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase";
import { sendMetaEvent } from "../../../lib/metaCapi";
import { sendTiktokEvent } from "../../../lib/tiktokEventsApi";
import { sendReportEmail } from "../../../lib/email";

type LeadPayload = {
  email: string;
  answers: Record<string, string>;
  startedAt?: string;
  completedAt?: string;
  utm?: Record<string, string | undefined> & { fbclid?: string; ttclid?: string };
  score?: number;
  segment?: string;
  blocker?: string;
  userAgent?: string;
  mode?: "create" | "merge";
  funnel_sid?: string;
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

  const firstName = body.answers?.first_name ?? undefined;
  const funnelSid = body.funnel_sid ?? undefined;
  const fbclid = body.utm?.fbclid ?? undefined;
  const ttclid = body.utm?.ttclid ?? undefined;
  const ttp = request.headers.get("cookie")?.match(/(?:^|;\s*)_ttp=([^;]+)/)?.[1];
  const siteUrl = process.env.SITE_URL ?? process.env.URL ?? process.env.NETLIFY_SITE_URL ?? "https://protocol-club.com";

  // waitUntil from @vercel/functions is a no-op on Netlify (context not injected).
  // Run side-effects synchronously before returning — ~200ms overhead, invisible since
  // the client redirects to the report-loading page immediately after.
  const eventId = `lead:${email}:${createdAt}`;
  await Promise.allSettled([
    sendMetaEvent({
      eventName: "Lead",
      eventTime,
      eventId,
      actionSource: "website",
      eventSourceUrl,
      userAgent,
      ipAddress,
      email,
      fbclid,
    }).then(() => console.log("[lead] meta sent", { email }))
      .catch((err) => console.error("[lead] meta event failed", { error: String(err), email })),

    sendTiktokEvent({
      eventName: "CompleteRegistration",
      eventTime,
      eventId,
      eventSourceUrl,
      userAgent,
      ipAddress,
      email,
      externalId: funnelSid,
      ttclid,
      ttp,
      properties: {
        value: 89,
        currency: "USD",
        contents: [{
          content_id: "f1-attractiveness-protocol",
          content_type: "product",
          content_name: "Attractiveness Protocol",
        }],
      },
    }).then(() => console.log("[lead] tiktok sent", { email }))
      .catch((err) => console.error("[lead] tiktok event failed", { error: String(err), email })),

    funnelSid
      ? sendReportEmail({
          email,
          firstName,
          reportUrl: `${siteUrl}/f1/report/${encodeURIComponent(funnelSid)}`,
        })
      : Promise.resolve(),
  ]);

  return NextResponse.json({ ok: true });
}
