// Backfill inbound emails to the #emails Slack channel by fetching
// directly from Resend's /emails/receiving endpoint.
//
// This is the exhaustive source (unlike client_messages which only has
// rows that matched a reply+uuid@ recipient). Fetches all inbounds
// within HOURS_BACK, retrieves the plain-text body of each, formats
// and posts to Slack.

import { readFileSync } from "fs";
import { resolve } from "path";
const env = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
for (const line of env.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)/);
  if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
}

const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const SLACK_WEBHOOK_EMAILS = process.env.SLACK_WEBHOOK_EMAILS!;
const HOURS_BACK = parseInt(process.argv.find((a) => /^\d+$/.test(a)) ?? "24", 10);
const PREVIEW_MAX = 800;

if (!RESEND_API_KEY) { console.error("RESEND_API_KEY not set"); process.exit(1); }
if (!SLACK_WEBHOOK_EMAILS) { console.error("SLACK_WEBHOOK_EMAILS not set"); process.exit(1); }

type InboundListItem = {
  id: string;
  to: string[];
  from: string;
  created_at: string;
  subject: string;
  attachments: unknown[];
};

async function resendGet<T>(path: string): Promise<T> {
  const res = await fetch(`https://api.resend.com${path}`, {
    headers: { "Authorization": `Bearer ${RESEND_API_KEY}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend ${path} → ${res.status}: ${body.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

async function postToSlack(text: string): Promise<boolean> {
  const res = await fetch(SLACK_WEBHOOK_EMAILS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, mrkdwn: true }),
  });
  return res.ok;
}

function stripQuotedReply(body: string): string {
  // Common patterns for the "reply above this line" separator + quoted
  // history. Cut everything at the first hit so the preview shows only
  // the new content.
  const cutMarkers = [
    /^On .* wrote:\s*$/im,
    /^Le .* écrit\s*:\s*$/im,
    /^-----Original Message-----/im,
    /^Sent from my/im,
    /^From:.*Sent:.*To:/im,
  ];
  let earliest = body.length;
  for (const re of cutMarkers) {
    const m = body.match(re);
    if (m?.index !== undefined && m.index < earliest) earliest = m.index;
  }
  return body.slice(0, earliest).trim();
}

async function main() {
  const since = Date.now() - HOURS_BACK * 3600 * 1000;
  console.log(`Fetching inbound emails from Resend (last ${HOURS_BACK}h)…`);

  const list = await resendGet<{ data: InboundListItem[]; has_more?: boolean }>("/emails/receiving?limit=100");
  const recent = (list.data ?? []).filter((e) => new Date(e.created_at).getTime() >= since);
  console.log(`Found ${recent.length} inbound(s) in window.\n`);

  if (recent.length === 0) {
    console.log("Nothing to backfill.");
    return;
  }

  await postToSlack(
    `:mailbox_with_mail: *Backfill — ${recent.length} inbound email${recent.length === 1 ? "" : "s"} from the last ${HOURS_BACK}h*`,
  );

  // Post oldest-first so the channel reads chronologically.
  for (const e of recent.slice().reverse()) {
    // Fetch body — the list endpoint doesn't include text/html.
    let body = "(message body unavailable)";
    try {
      const detail = await resendGet<{ text?: string; html?: string }>(`/emails/receiving/${encodeURIComponent(e.id)}`);
      if (detail.text) body = detail.text.trim();
      else if (detail.html) body = detail.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    } catch (err) {
      console.log(`  ⚠ body fetch failed for ${e.id}: ${String(err).slice(0, 120)}`);
    }

    const clean = stripQuotedReply(body);
    const preview = clean.slice(0, PREVIEW_MAX);
    const truncated = clean.length > PREVIEW_MAX;
    const quoted = preview
      .split("\n")
      .slice(0, 25)
      .map((line) => `> ${line}`)
      .join("\n");

    const receivedAt = new Date(e.created_at).toLocaleString("en-US", {
      timeZone: "Europe/Paris",
      month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: false,
    });

    const text = [
      `:mailbox: *Inbound email* — from \`${e.from}\``,
      `*Subject:* ${e.subject || "(no subject)"}`,
      `_Received ${receivedAt} Paris · To: ${e.to.join(", ")} · resend id \`${e.id}\`_`,
      e.attachments && e.attachments.length > 0 ? `_📎 ${e.attachments.length} attachment(s)_` : "",
      "",
      quoted || "> _(empty body)_",
      truncated ? `_…truncated (${clean.length} chars total)_` : "",
    ].filter(Boolean).join("\n");

    const ok = await postToSlack(text);
    console.log(`  ${ok ? "✓" : "✗"}  ${e.from}  ${(e.subject || "(no subject)").slice(0, 60)}`);
    await new Promise((r) => setTimeout(r, 400));
  }

  console.log(`\nDone.`);
}
main().catch((err) => { console.error(err); process.exit(1); });
