// One-off backfill: post every inbound email received today to the
// #emails Slack channel. Uses client_messages (direction=inbound, today).
// Caveat: only emails whose reply-id matched a known Protocol user are
// stored — orphan inbound emails without a user match aren't in the DB
// so they're not covered here. Going forward the webhook posts every
// inbound (matched or not) to Slack in real time.

import { readFileSync } from "fs";
import { resolve } from "path";
const env = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
for (const line of env.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)/);
  if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
}

import { createClient } from "@supabase/supabase-js";

const SLACK_WEBHOOK_EMAILS = process.env.SLACK_WEBHOOK_EMAILS!;
const SITE_URL = process.env.SITE_URL ?? "https://protocol-club.com";
const PREVIEW_MAX = 500;

if (!SLACK_WEBHOOK_EMAILS) {
  console.error("SLACK_WEBHOOK_EMAILS not set — pass it inline or add to env");
  process.exit(1);
}

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

// Paris day range — matches the daily-report convention across the codebase.
function todayParisRange(): { since: string; until: string; label: string } {
  const now = new Date();
  const paris = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Paris" }));
  const y = paris.getFullYear(), m = paris.getMonth(), d = paris.getDate();
  const dayStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const probe = new Date(Date.UTC(y, m, d, 12));
  const parisStr = probe.toLocaleString("sv-SE", { timeZone: "Europe/Paris" });
  const utcStr = probe.toISOString().replace("T", " ").slice(0, 19);
  const diffMs = new Date(parisStr).getTime() - new Date(utcStr).getTime();
  const sinceMs = Date.UTC(y, m, d, 0, 0, 0) - diffMs;
  return {
    since: new Date(sinceMs).toISOString(),
    until: new Date(sinceMs + 24 * 3600 * 1000).toISOString(),
    label: dayStr,
  };
}

async function postToSlack(text: string) {
  const res = await fetch(SLACK_WEBHOOK_EMAILS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, mrkdwn: true }),
  });
  return res.ok;
}

async function main() {
  const { since, until, label } = todayParisRange();
  console.log(`Backfilling inbound emails for ${label} (${since} → ${until})…`);

  const { data, error } = await sb
    .from("client_messages")
    .select("id, user_id, body, resend_email_id, created_at, users:user_id(email, first_name)")
    .eq("direction", "inbound")
    .gte("created_at", since)
    .lt("created_at", until)
    .order("created_at", { ascending: true });
  if (error) { console.error(error); process.exit(1); }

  const rows = data ?? [];
  console.log(`Found ${rows.length} inbound message(s).\n`);

  // Backfill header so ops sees the pass in context.
  await postToSlack(
    `:mailbox_with_mail: *Backfill — inbound emails for ${label}* (${rows.length} message${rows.length === 1 ? "" : "s"})`,
  );

  for (const row of rows) {
    const u = (row.users as { email?: string; first_name?: string } | null) ?? null;
    const clientEmail = u?.email ?? "unknown";
    const clientName = u?.first_name ?? "";
    const body = (row.body ?? "").trim();
    const preview = body.slice(0, PREVIEW_MAX);
    const truncated = body.length > PREVIEW_MAX;
    const quoted = preview
      .split("\n")
      .filter((line) => !line.startsWith("> "))
      .slice(0, 20)
      .map((line) => `> ${line}`)
      .join("\n");

    const adminUrl = `${SITE_URL}/admin/users/${encodeURIComponent(row.user_id)}`;
    const text = [
      `:email: *Reply from client* — \`${clientEmail}\`${clientName ? ` (${clientName})` : ""}`,
      `Received ${new Date(row.created_at).toLocaleString("en-US", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit", hour12: false })} Paris · <${adminUrl}|open in admin> · resend id \`${row.resend_email_id ?? "—"}\``,
      "",
      quoted || "> _(empty body)_",
      truncated ? `_…truncated (${body.length} chars total)_` : "",
    ].filter(Boolean).join("\n");

    const ok = await postToSlack(text);
    console.log(`  ${ok ? "✓" : "✗"}  ${clientEmail}  ${body.slice(0, 60).replace(/\n/g, " ")}…`);
    // Small pacing so Slack doesn't rate-limit and out-of-order the messages
    await new Promise((r) => setTimeout(r, 400));
  }

  console.log(`\nDone.`);
}
main().catch((e) => { console.error(e); process.exit(1); });
