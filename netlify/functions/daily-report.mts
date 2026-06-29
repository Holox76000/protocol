import { schedule } from "@netlify/functions";

// Daily P&L report — runs at 20:00 UTC = midnight Dubai (UTC+4). Triggers the
// Next.js cron route which pulls Meta spend + Stripe sales over the last 24h,
// computes ROAS and net profit vs breakeven 1.2×, and posts a color-coded
// summary to Slack #daily-report.

const SITE_URL = process.env.URL ?? "https://protocol-club.com";

const handler = schedule("0 20 * * *", async () => {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[netlify/daily-report] CRON_SECRET not set");
    return { statusCode: 500, body: "CRON_SECRET missing" };
  }

  try {
    const res = await fetch(`${SITE_URL}/api/cron/daily-report`, {
      method: "GET",
      headers: { authorization: `Bearer ${secret}` },
    });
    const body = await res.text();
    console.log("[netlify/daily-report] route response", { status: res.status, body });
    return { statusCode: res.ok ? 200 : 500, body };
  } catch (err) {
    console.error("[netlify/daily-report] fetch failed", { error: String(err) });
    return { statusCode: 500, body: String(err) };
  }
});

export { handler };
