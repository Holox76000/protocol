import { schedule } from "@netlify/functions";

// Admin delivery reminder — fires once per order, 24h after payment,
// if protocol is not yet delivered. Runs hourly: granularity is more
// than enough for a "<24h late" trigger and keeps load minimal.

const SITE_URL = process.env.URL ?? "https://protocol-club.com";

const handler = schedule("15 * * * *", async () => {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[netlify/delivery-reminder] CRON_SECRET not set");
    return { statusCode: 500, body: "CRON_SECRET missing" };
  }

  try {
    const res = await fetch(`${SITE_URL}/api/cron/delivery-reminder`, {
      method: "GET",
      headers: { authorization: `Bearer ${secret}` },
    });
    const body = await res.text();
    console.log("[netlify/delivery-reminder] response", { status: res.status, body });
    return { statusCode: res.ok ? 200 : 500, body };
  } catch (err) {
    console.error("[netlify/delivery-reminder] fetch failed", { error: String(err) });
    return { statusCode: 500, body: String(err) };
  }
});

export default handler;
