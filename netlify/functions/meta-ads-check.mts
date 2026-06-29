import { schedule } from "@netlify/functions";

// Meta ads polling cron — runs every 15 minutes. Triggers the Next.js cron
// route which fetches recently-created ads from Meta Graph API, diffs them
// against the meta_ads_seen Supabase table, and posts new ones to Slack
// #ads-meta. Idempotent: the seen-table dedupe means missed runs are
// recovered on the next tick.

const SITE_URL = process.env.URL ?? "https://protocol-club.com";

const handler = schedule("*/15 * * * *", async () => {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[netlify/meta-ads-check] CRON_SECRET not set");
    return { statusCode: 500, body: "CRON_SECRET missing" };
  }

  try {
    const res = await fetch(`${SITE_URL}/api/cron/meta-ads-check`, {
      method: "GET",
      headers: { authorization: `Bearer ${secret}` },
    });
    const body = await res.text();
    console.log("[netlify/meta-ads-check] route response", { status: res.status, body });
    return { statusCode: res.ok ? 200 : 500, body };
  } catch (err) {
    console.error("[netlify/meta-ads-check] fetch failed", { error: String(err) });
    return { statusCode: 500, body: String(err) };
  }
});

export { handler };
