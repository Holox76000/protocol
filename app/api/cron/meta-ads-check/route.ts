import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { postToSlack } from "../../../../lib/slack";

export const runtime = "nodejs";
export const maxDuration = 60;

const META_TOKEN = process.env.META_ACCESS_TOKEN!;
const META_ACCOUNT = process.env.META_AD_ACCOUNT_ID!;
const ADS_MANAGER_BASE = "https://business.facebook.com/adsmanager/manage/ads";

type MetaAd = {
  id: string;
  name?: string;
  effective_status?: string;
  status?: string;
  created_time?: string;
  adset?: { name?: string; id?: string };
  campaign?: { name?: string; id?: string };
  creative?: { name?: string; thumbnail_url?: string };
};

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!META_TOKEN || !META_ACCOUNT) {
    console.error("[cron/meta-ads-check] META_ACCESS_TOKEN or META_AD_ACCOUNT_ID missing");
    return NextResponse.json({ error: "Meta config missing" }, { status: 500 });
  }

  // Fetch the most recent ads (newest first) — no server-side date filter
  // because Meta's `filtering` param on /ads doesn't reliably support
  // ad.created_time. We sort + slice client-side instead.
  const sinceMs = Date.now() - 48 * 3600 * 1000;

  const fields = [
    "id",
    "name",
    "effective_status",
    "status",
    "created_time",
    "adset{name,id}",
    "campaign{name,id}",
    "creative{name,thumbnail_url}",
  ].join(",");

  const params = new URLSearchParams({
    fields,
    limit: "100",
    access_token: META_TOKEN,
  });

  const initialUrl = `https://graph.facebook.com/v22.0/${META_ACCOUNT}/ads?${params.toString()}`;
  let url: string = initialUrl;
  const allAds: MetaAd[] = [];

  // Page through results, bounded by both page count and result count.
  for (let page = 0; page < 5 && url; page++) {
    let res: Response;
    let body: { data?: MetaAd[]; paging?: { next?: string }; error?: unknown };
    try {
      res = await fetch(url);
      body = await res.json();
    } catch (err) {
      console.error("[cron/meta-ads-check] fetch/parse failed", { error: String(err), urlPrefix: url.split("?")[0] });
      return NextResponse.json({ error: "Meta fetch failed", detail: String(err) }, { status: 502 });
    }

    if (body.error) {
      // Stringify in case body.error is an Error instance with non-enumerable props.
      const errStr = JSON.stringify(body.error, Object.getOwnPropertyNames(body.error as object));
      console.error("[cron/meta-ads-check] Meta API error", { error: body.error, errStr, urlPrefix: url.split("?")[0] });
      return NextResponse.json({ error: "Meta API error", detail: body.error, errStr }, { status: 502 });
    }

    if (body.data) allAds.push(...body.data);
    url = body.paging?.next ?? "";

    // Stop early if we're already past the 48h window — older ads aren't useful.
    if (body.data && body.data.length > 0) {
      const oldestThisPage = body.data[body.data.length - 1].created_time;
      if (oldestThisPage && new Date(oldestThisPage).getTime() < sinceMs - 24 * 3600 * 1000) break;
    }
  }

  // Filter client-side to ads created in the last 48h.
  const recentAds = allAds.filter(a => a.created_time && new Date(a.created_time).getTime() >= sinceMs);
  console.log("[cron/meta-ads-check] fetched", { totalFetched: allAds.length, recentAds: recentAds.length });

  // Use only the recent ads for the rest of the diff logic.
  allAds.length = 0;
  allAds.push(...recentAds);

  if (allAds.length === 0) {
    return NextResponse.json({ checked: 0, new: 0, notified: 0 });
  }

  // Check which ones we've already seen
  const adIds = allAds.map(a => a.id);
  const { data: seenRows } = await supabaseAdmin
    .from("meta_ads_seen")
    .select("ad_id")
    .in("ad_id", adIds);
  const seenSet = new Set((seenRows ?? []).map(r => r.ad_id));

  const newAds = allAds.filter(a => !seenSet.has(a.id));

  // First-run safety: if the table is empty AND we'd be notifying more than 10
  // ads at once, seed instead of notify. Prevents Slack spam on cold start.
  const { count: totalSeen } = await supabaseAdmin
    .from("meta_ads_seen")
    .select("ad_id", { count: "exact", head: true });

  const isFirstRun = (totalSeen ?? 0) === 0;
  const wouldSpam = newAds.length > 10;

  if (isFirstRun && wouldSpam) {
    // Seed all without notifying
    const rows = allAds.map(a => ({
      ad_id: a.id,
      name: a.name ?? null,
      campaign_name: a.campaign?.name ?? null,
      adset_name: a.adset?.name ?? null,
      effective_status: a.effective_status ?? a.status ?? null,
      thumbnail_url: a.creative?.thumbnail_url ?? null,
      created_time: a.created_time ?? null,
    }));
    await supabaseAdmin.from("meta_ads_seen").upsert(rows, { onConflict: "ad_id" });

    void postToSlack("ads", {
      text: `:seedling: *Meta ads cron seeded* — ${allAds.length} existing ads stored as baseline. Future runs will notify only new creatives.`,
    });

    return NextResponse.json({ checked: allAds.length, new: 0, seeded: allAds.length });
  }

  // Insert new ads + notify each one
  let notified = 0;
  for (const ad of newAds) {
    // Insert first so we never double-notify if Slack succeeds but the run
    // crashes before the next iteration.
    const { error } = await supabaseAdmin.from("meta_ads_seen").insert({
      ad_id: ad.id,
      name: ad.name ?? null,
      campaign_name: ad.campaign?.name ?? null,
      adset_name: ad.adset?.name ?? null,
      effective_status: ad.effective_status ?? ad.status ?? null,
      thumbnail_url: ad.creative?.thumbnail_url ?? null,
      created_time: ad.created_time ?? null,
    });
    if (error) {
      // Probable race — another run already inserted. Skip notify.
      console.warn("[cron/meta-ads-check] Insert skipped (likely race)", { adId: ad.id, error: error.message });
      continue;
    }

    const status = ad.effective_status ?? ad.status ?? "UNKNOWN";
    const statusEmoji = status === "ACTIVE" ? ":large_green_circle:" : status.includes("PAUSED") ? ":pause_button:" : ":new:";
    const adsManagerLink = `${ADS_MANAGER_BASE}/edit?act=${META_ACCOUNT.replace("act_", "")}&selected_ad_ids=${ad.id}`;

    void postToSlack("ads", {
      text: [
        `<!channel> :new: *New Meta creative detected*`,
        `*Name:* ${ad.name ?? "—"}`,
        `*Status:* ${statusEmoji} \`${status}\``,
        `*Campaign:* ${ad.campaign?.name ?? "—"}`,
        `*Ad set:* ${ad.adset?.name ?? "—"}`,
        `*Created:* ${ad.created_time ?? "—"}`,
        `*Open in Ads Manager:* <${adsManagerLink}|view ad>`,
      ].join("\n"),
    });
    notified++;
  }

  return NextResponse.json({
    checked: allAds.length,
    new: newAds.length,
    notified,
  });
}
