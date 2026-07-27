// Slack helpers. Two transports:
//
//   1. Incoming webhooks (legacy) — used by ads/funnel/report and any
//      one-shot post. Cannot thread nor edit messages.
//   2. Web API via bot token — used by the dating "sales feed" flow so we
//      can post a root message per order and update/thread it as the order
//      moves through paid → uploaded → generated → delivered.
//
// Both paths are fire-and-forget on errors: Slack outages must never break
// Stripe webhooks, crons, or user flows.
//
// Webhook channels & env vars:
//   sales  → SLACK_WEBHOOK_SALES   (legacy fallback for #new-sales)
//   ads    → SLACK_WEBHOOK_ADS     (#ads-meta — new Meta creatives)
//   funnel → SLACK_WEBHOOK_FUNNEL  (#funnel-changes — funnel KPI alerts)
//   report → SLACK_WEBHOOK_REPORT  (#daily-report — nightly P&L)
//   ops    → SLACK_WEBHOOK_OPS     (#ops — daily digest + fallback for bot path)
//   emails → SLACK_WEBHOOK_EMAILS  (#emails — every inbound reply from Resend)
//   survey → SLACK_WEBHOOK_SURVEY  (#survey — NPS responses from clients)
//
// Web API env vars:
//   SLACK_BOT_TOKEN         xoxb-... bot user OAuth token
//   SLACK_SALES_CHANNEL_ID  C... channel id for the sales feed
//   SLACK_OPS_CHANNEL_ID    C... channel id for the ops digest

export type SlackChannel = "sales" | "ads" | "funnel" | "report" | "ops" | "emails" | "survey";

type SlackBlock = Record<string, unknown>;
type SlackAttachment = { color?: string; blocks?: SlackBlock[]; text?: string };
type SlackPayload = { text: string; blocks?: SlackBlock[]; attachments?: SlackAttachment[]; mrkdwn?: boolean };

const WEBHOOKS: Record<SlackChannel, string | undefined> = {
  sales:  process.env.SLACK_WEBHOOK_SALES,
  ads:    process.env.SLACK_WEBHOOK_ADS,
  funnel: process.env.SLACK_WEBHOOK_FUNNEL,
  report: process.env.SLACK_WEBHOOK_REPORT,
  ops:    process.env.SLACK_WEBHOOK_OPS,
  emails: process.env.SLACK_WEBHOOK_EMAILS,
  survey: process.env.SLACK_WEBHOOK_SURVEY,
};

export async function postToSlack(channel: SlackChannel, payload: SlackPayload): Promise<void> {
  const url = WEBHOOKS[channel];
  if (!url) {
    console.warn(`[slack] No webhook URL for channel "${channel}" — skipping`);
    return;
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mrkdwn: true, ...payload }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[slack] Post to ${channel} failed`, { status: res.status, body });
    }
  } catch (err) {
    console.error(`[slack] Post to ${channel} threw`, { error: String(err) });
  }
}

// ── Web API (bot token) ─────────────────────────────────────────────

const SLACK_API = "https://slack.com/api";

function botToken(): string | null {
  return process.env.SLACK_BOT_TOKEN ?? null;
}

async function slackApiCall<T = Record<string, unknown>>(
  method: string,
  body: Record<string, unknown>,
): Promise<{ ok: true; data: T & { ok: true } } | { ok: false; error: string }> {
  const token = botToken();
  if (!token) return { ok: false, error: "SLACK_BOT_TOKEN not set" };

  try {
    const res = await fetch(`${SLACK_API}/${method}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as { ok: boolean; error?: string } & Record<string, unknown>;
    if (!json.ok) {
      console.error(`[slack] ${method} api error`, { error: json.error, body });
      return { ok: false, error: json.error ?? `http ${res.status}` };
    }
    return { ok: true, data: json as T & { ok: true } };
  } catch (err) {
    console.error(`[slack] ${method} threw`, { error: String(err) });
    return { ok: false, error: String(err) };
  }
}

export type PostMessageOpts = {
  channelId: string;
  text: string;
  blocks?: SlackBlock[];
  threadTs?: string;   // when set, reply becomes a thread reply
  unfurl?: boolean;    // default false — noisy for admin URLs
};

export type PostMessageResult = {
  ok: boolean;
  ts?: string;
  channel?: string;
  error?: string;
};

// Post via Web API. Returns the message ts so callers can persist it (to
// later thread replies or edit the root). Never throws.
export async function slackPostMessage(opts: PostMessageOpts): Promise<PostMessageResult> {
  const body: Record<string, unknown> = {
    channel: opts.channelId,
    text: opts.text,
    unfurl_links: opts.unfurl ?? false,
    unfurl_media: opts.unfurl ?? false,
  };
  if (opts.blocks) body.blocks = opts.blocks;
  if (opts.threadTs) body.thread_ts = opts.threadTs;

  const res = await slackApiCall<{ ts: string; channel: string }>("chat.postMessage", body);
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, ts: res.data.ts, channel: res.data.channel };
}

export type UpdateMessageOpts = {
  channelId: string;
  ts: string;
  text: string;
  blocks?: SlackBlock[];
};

// Edit a previously-posted root message (used to update the header as the
// order status changes). Never throws.
export async function slackUpdateMessage(opts: UpdateMessageOpts): Promise<PostMessageResult> {
  const body: Record<string, unknown> = {
    channel: opts.channelId,
    ts: opts.ts,
    text: opts.text,
  };
  if (opts.blocks) body.blocks = opts.blocks;

  const res = await slackApiCall<{ ts: string; channel: string }>("chat.update", body);
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, ts: res.data.ts, channel: res.data.channel };
}

// Convenience: get the sales channel id or null if not configured.
export function salesChannelId(): string | null {
  return process.env.SLACK_SALES_CHANNEL_ID ?? null;
}
export function opsChannelId(): string | null {
  return process.env.SLACK_OPS_CHANNEL_ID ?? null;
}
