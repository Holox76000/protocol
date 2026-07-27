// Formats + posts an inbound email notification to the #emails Slack
// channel. Called from the Resend webhook handler after every inbound
// email (matched user, unmatched user, or no user at all). Never
// throws — postToSlack swallows all errors.

import { postToSlack } from "./slack";

const SITE_URL = process.env.SITE_URL ?? "https://protocol-club.com";
const PREVIEW_MAX = 500;

export type InboundNotifyArgs = {
  from: string;
  toAddresses: string[];
  subject: string | null;
  body: string;
  emailId: string;
  userId: string | null;      // if reply+uuid@ matched a known Protocol user
  userFound: boolean;         // false = userId string was in the address but no DB row
  clientEmail?: string | null; // best-effort — the from address usually IS the client
};

export async function notifyInboundEmailToSlack(args: InboundNotifyArgs): Promise<void> {
  const { from, toAddresses, subject, body, emailId, userId, userFound, clientEmail } = args;

  // Header emoji signals the routing outcome so ops can triage at a glance.
  //   ✉️ = matched a known Protocol user (has a client)
  //   ✉️❓ = looked like a reply-id but the user vanished
  //   📬 = plain inbound (no reply-id in the To field)
  const emoji = userId && userFound ? ":email:" : userId ? ":email::grey_question:" : ":mailbox:";
  const routingLine = userId && userFound
    ? `Matched Protocol user \`${userId.slice(0, 8)}…\``
    : userId
      ? `⚠️ Reply-ID present but user \`${userId.slice(0, 8)}…\` not found in DB`
      : `Direct inbound (no reply-id in To)`;

  // Body preview — quote-block, capped so a novel doesn't nuke the channel.
  const preview = body.trim().slice(0, PREVIEW_MAX);
  const truncated = body.trim().length > PREVIEW_MAX;
  const quotedPreview = preview
    .split("\n")
    .filter((line) => !line.startsWith("> ")) // strip quoted email history
    .slice(0, 20)
    .map((line) => `> ${line}`)
    .join("\n");

  const adminLink = userId && userFound
    ? ` · <${SITE_URL}/admin/users/${encodeURIComponent(userId)}|open in admin>`
    : "";

  const lines = [
    `${emoji} *New inbound email* — from \`${from}\``,
    `*Subject:* ${subject ?? "(no subject)"}`,
    `${routingLine}${adminLink}`,
    `_To: ${toAddresses.join(", ")} · resend id \`${emailId}\`${clientEmail && clientEmail !== from ? ` · client \`${clientEmail}\`` : ""}_`,
    "",
    quotedPreview || "> _(empty body)_",
    truncated ? `_…truncated (${body.trim().length} chars total)_` : "",
  ].filter(Boolean);

  await postToSlack("emails", { text: lines.join("\n") });
}
