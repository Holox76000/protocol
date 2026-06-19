import { schedule } from "@netlify/functions";

// Lead nurture sequence cron — triggers the Next.js cron route which
// holds the actual logic (reuses lib/email.ts + lib/report-content.ts).
// Runs every 30 minutes: 6 time windows over 13 days, plenty of granularity.

const SITE_URL = process.env.URL ?? "https://protocol-club.com";

const handler = schedule("*/30 * * * *", async () => {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[netlify/lead-nurture] CRON_SECRET not set");
    return { statusCode: 500, body: "CRON_SECRET missing" };
  }

  try {
    const res = await fetch(`${SITE_URL}/api/cron/lead-nurture`, {
      method: "GET",
      headers: { authorization: `Bearer ${secret}` },
    });
    const body = await res.text();
    console.log("[netlify/lead-nurture] route response", { status: res.status, body });
    return { statusCode: res.ok ? 200 : 500, body };
  } catch (err) {
    console.error("[netlify/lead-nurture] fetch failed", { error: String(err) });
    return { statusCode: 500, body: String(err) };
  }
});

export default handler;
