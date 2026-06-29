// Slack incoming-webhook helper. Fire-and-forget; never blocks the caller
// or throws — Slack outages must not break Stripe webhooks or cron jobs.
//
// Channels and their env vars:
//   sales  → SLACK_WEBHOOK_SALES   (#sales — Stripe paid events)
//   ads    → SLACK_WEBHOOK_ADS     (#ads-meta — new Meta creatives)
//   funnel → SLACK_WEBHOOK_FUNNEL  (#funnel-changes — funnel KPI alerts)

export type SlackChannel = "sales" | "ads" | "funnel";

type SlackBlock = Record<string, unknown>;
type SlackPayload = { text: string; blocks?: SlackBlock[]; mrkdwn?: boolean };

const WEBHOOKS: Record<SlackChannel, string | undefined> = {
  sales:  process.env.SLACK_WEBHOOK_SALES,
  ads:    process.env.SLACK_WEBHOOK_ADS,
  funnel: process.env.SLACK_WEBHOOK_FUNNEL,
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
