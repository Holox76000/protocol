// Slack Events API handler. Purpose: turn `!send <text>` messages posted
// in a thread of #emails into a real email reply sent via Resend.
//
// Flow:
//   1. Verify Slack signature (HMAC-SHA256 with SLACK_SIGNING_SECRET).
//   2. Handle URL verification challenge on subscription setup.
//   3. Filter events → only channel-message events, in #emails, in a
//      thread, not from our bot, starting with `!send `.
//   4. Fetch the thread root via conversations.replies to find the
//      Resend email id we always embed in the initial notification text.
//   5. Fetch the original email details from Resend.
//   6. Send the reply via Resend with In-Reply-To + References so the
//      customer's mail client threads it under the original conversation.
//   7. React ✅ on the trigger message + post a confirmation reply.
//
// Env vars required:
//   SLACK_SIGNING_SECRET    from Slack app → Basic Information
//   SLACK_BOT_TOKEN         already set — used to react + reply
//   SLACK_EMAILS_CHANNEL_ID the channel where inbound emails land
//   RESEND_API_KEY          already set — must be full-access

import { NextResponse } from "next/server";
import { Resend } from "resend";
import { verifySlackSignature } from "../../../../lib/slackSignature";

export const runtime = "nodejs";

const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_EMAILS_CHANNEL_ID = process.env.SLACK_EMAILS_CHANNEL_ID;
const RESEND_API_KEY = process.env.RESEND_API_KEY;

const OUR_BOT_ID = "B0BKWTZ5EPK";       // stable — comes from auth.test
const REPLY_FROM = "Protocol Club <hello@protocol-club.com>";
const TRIGGER_RE = /^!send\s+([\s\S]+)/i;

type SlackEventPayload = {
  type: "url_verification" | "event_callback";
  challenge?: string;
  event_id?: string;
  event?: {
    type: string;
    subtype?: string;
    channel?: string;
    user?: string;
    bot_id?: string;
    thread_ts?: string;
    ts?: string;
    text?: string;
  };
};

async function slackApi<T = Record<string, unknown>>(
  method: string,
  body: Record<string, unknown>,
): Promise<{ ok: boolean; error?: string } & T> {
  // Form-encoded: Slack Web API is stricter about JSON — many endpoints
  // reject with `invalid_arguments` when given JSON with numeric fields.
  // Form always works.
  const form = new URLSearchParams();
  for (const [k, v] of Object.entries(body)) {
    if (v !== undefined && v !== null) form.set(k, String(v));
  }
  const res = await fetch(`https://slack.com/api/${method}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${SLACK_BOT_TOKEN}`,
      "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
    },
    body: form.toString(),
  });
  const json = (await res.json()) as { ok: boolean; error?: string } & T;
  if (!json.ok) {
    console.error("[slack-events] slackApi failed", { method, args: Object.keys(body), error: json.error });
  }
  return json;
}

function extractResendId(text: string | undefined): string | null {
  if (!text) return null;
  // We always include "resend id `<uuid-ish>`" in the initial notification.
  const m = text.match(/resend id [`"]?([a-z0-9-]{20,})[`"]?/i);
  return m?.[1] ?? null;
}

type ResendReceivedEmail = {
  id: string;
  to: string[];
  from: string;
  subject: string;
  message_id: string;
  text?: string;
  html?: string;
};

async function fetchResendEmail(id: string): Promise<ResendReceivedEmail | null> {
  const res = await fetch(`https://api.resend.com/emails/receiving/${encodeURIComponent(id)}`, {
    headers: { "Authorization": `Bearer ${RESEND_API_KEY}` },
  });
  if (!res.ok) {
    console.error("[slack-events] fetch Resend email failed", { id, status: res.status });
    return null;
  }
  return (await res.json()) as ResendReceivedEmail;
}

async function handleTrigger(args: {
  channel: string;
  threadTs: string;
  triggerTs: string;
  replyBody: string;
}) {
  const { channel, threadTs, triggerTs, replyBody } = args;
  console.log("[slack-events] handleTrigger", { channel, threadTs, triggerTs, bodyLen: replyBody.length });

  // 1. Fetch the thread's root message to find the Resend id.
  const replies = await slackApi<{ messages: Array<{ ts: string; text?: string }> }>("conversations.replies", {
    channel,
    ts: threadTs,
    limit: 1,
  });
  if (!replies.ok) {
    await slackApi("chat.postMessage", {
      channel,
      thread_ts: threadTs,
      text: `:x: *Send failed* — couldn't read the thread's root message (\`${replies.error ?? "unknown"}\`).`,
    });
    return;
  }
  const rootText = replies.messages?.[0]?.text ?? "";
  const resendId = extractResendId(rootText);
  if (!resendId) {
    await slackApi("chat.postMessage", {
      channel,
      thread_ts: threadTs,
      text: `:x: *Send failed* — no Resend id found in the thread root. Was this thread started by an inbound email notification?`,
    });
    return;
  }

  // 2. Fetch original email so we know who to reply to + subject.
  const original = await fetchResendEmail(resendId);
  if (!original) {
    await slackApi("chat.postMessage", {
      channel,
      thread_ts: threadTs,
      text: `:x: *Send failed* — Resend returned no data for id \`${resendId}\`.`,
    });
    return;
  }

  // 3. Send the reply. In-Reply-To + References glue this to the
  // customer's original thread in Gmail / Outlook / etc.
  const subject = original.subject.match(/^re:/i) ? original.subject : `Re: ${original.subject || "(no subject)"}`;
  const resend = new Resend(RESEND_API_KEY);
  try {
    await resend.emails.send({
      from: REPLY_FROM,
      to: original.from,
      subject,
      text: replyBody,
      replyTo: original.to?.[0] ?? "hello@protocol-club.com",
      headers: {
        "In-Reply-To": original.message_id,
        "References": original.message_id,
      },
    });
  } catch (err) {
    await slackApi("chat.postMessage", {
      channel,
      thread_ts: threadTs,
      text: `:x: *Send failed* — Resend error: \`${String(err).slice(0, 200)}\``,
    });
    return;
  }

  // 4. Confirm in Slack.
  await slackApi("reactions.add", {
    channel,
    name: "white_check_mark",
    timestamp: triggerTs,
  });
  await slackApi("chat.postMessage", {
    channel,
    thread_ts: threadTs,
    text: `:incoming_envelope: *Sent to* \`${original.from}\` — *${subject}*`,
  });
}

// GET is a health-check for humans and Slack's URL verification pre-check.
// Slack itself only ever POSTs, but exposing GET here lets ops verify the
// route is deployed and reachable via a simple browser hit.
export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/webhooks/slack-events",
    hint: "POST me with { type: 'url_verification', challenge: '...' } to test.",
    signingSecretConfigured: !!process.env.SLACK_SIGNING_SECRET,
    emailsChannelConfigured: !!process.env.SLACK_EMAILS_CHANNEL_ID,
    botTokenConfigured: !!process.env.SLACK_BOT_TOKEN,
  });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  // TEMP diagnostic: log every hit so we can confirm Slack is delivering.
  console.log("[slack-events] REQUEST", {
    ua: request.headers.get("user-agent"),
    retry: request.headers.get("x-slack-retry-num"),
    hasTs: !!request.headers.get("x-slack-request-timestamp"),
    hasSig: !!request.headers.get("x-slack-signature"),
    bodyStart: rawBody.slice(0, 200),
    bodyLen: rawBody.length,
  });

  let payload: SlackEventPayload;
  try { payload = JSON.parse(rawBody); }
  catch { return NextResponse.json({ error: "invalid json" }, { status: 400 }); }

  // URL verification challenge: must respond with the challenge value
  // BEFORE the signature check — otherwise the very first setup attempt
  // (when SLACK_SIGNING_SECRET might not be wired yet, or the URL hasn't
  // been verified so Slack won't sign properly) fails and the admin
  // can't save the Request URL. Safe to allow unverified: the response
  // just echoes the challenge back, no side effects.
  if (payload.type === "url_verification") {
    return NextResponse.json({ challenge: payload.challenge });
  }

  // Signature check for every real event.
  const sig = verifySlackSignature({
    signingSecret: SLACK_SIGNING_SECRET ?? "",
    timestampHeader: request.headers.get("x-slack-request-timestamp"),
    signatureHeader: request.headers.get("x-slack-signature"),
    rawBody,
  });
  if (!sig.ok) {
    console.error("[slack-events] signature rejected", { reason: sig.reason });
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  // Slack retries aggressively. If it's a retry, ACK 200 without processing
  // to avoid sending duplicate emails on our end.
  const retryNum = parseInt(request.headers.get("x-slack-retry-num") ?? "0", 10);
  if (retryNum > 0) {
    console.log("[slack-events] skipping retry", { retryNum, reason: request.headers.get("x-slack-retry-reason") });
    return NextResponse.json({ received: true });
  }

  if (payload.type !== "event_callback" || !payload.event) {
    return NextResponse.json({ received: true });
  }

  const e = payload.event;

  // ── Filter down to the exact event we care about ──
  const notMessage = e.type !== "message";
  const isSubtype = !!e.subtype; // e.g. message_changed, bot_message, thread_broadcast
  const wrongChannel = SLACK_EMAILS_CHANNEL_ID && e.channel !== SLACK_EMAILS_CHANNEL_ID;
  const fromOurBot = e.bot_id === OUR_BOT_ID;
  const notThreadReply = !e.thread_ts || e.thread_ts === e.ts;

  if (notMessage || isSubtype || wrongChannel || fromOurBot || notThreadReply) {
    console.log("[slack-events] filtered", {
      notMessage, isSubtype, wrongChannel, fromOurBot, notThreadReply,
      type: e.type, subtype: e.subtype, channel: e.channel, bot_id: e.bot_id,
      thread_ts: e.thread_ts, ts: e.ts, textStart: (e.text ?? "").slice(0, 50),
    });
    return NextResponse.json({ received: true });
  }

  const match = (e.text ?? "").match(TRIGGER_RE);
  if (!match) {
    console.log("[slack-events] no !send match", { textStart: (e.text ?? "").slice(0, 50) });
    return NextResponse.json({ received: true });
  }
  const replyBody = match[1].trim();
  if (!replyBody) {
    console.log("[slack-events] empty replyBody");
    return NextResponse.json({ received: true });
  }

  // Run the handler. All the API calls (Slack + Resend) each take a few
  // hundred ms — total 1-3s, comfortably under Slack's 3s timeout.
  try {
    await handleTrigger({
      channel: e.channel!,
      threadTs: e.thread_ts!,
      triggerTs: e.ts!,
      replyBody,
    });
  } catch (err) {
    console.error("[slack-events] handler crashed", { error: String(err), eventId: payload.event_id });
    // Try to surface the crash in the thread so the admin isn't left hanging.
    try {
      await slackApi("chat.postMessage", {
        channel: e.channel,
        thread_ts: e.thread_ts,
        text: `:x: *Send failed* — unexpected error, see server logs.`,
      });
    } catch { /* best effort */ }
  }

  return NextResponse.json({ received: true });
}
