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

  // We only fetch ads created in the last 48 hours. The cron runs every 15
  // minutes so 48h gives us plenty of redundancy if a run was skipped or the
  // Meta API was slow. The seen-table dedupes, so refetching old ones is
  // harmless beyond a slightly larger API response.
  const since = Math.floor(Date.now() / 1000) - 48 * 3600;

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

  // The since/until pair on /ads filters by created_time when paired correctly.
  // Documented behavior: Marketing API supports filtering on date_preset or a
  // time_range JSON. For /ads, the safest filter is `time_range` with
  // since/until, but on the /ads edge it filters by created_time when set.
  const params = new URLSearchParams({
    fields,
    limit: "200",
    access_token: META_TOKEN,
    filtering: JSON.stringify([
      { field: "ad.created_time", operator: "GREATER_THAN", value: since },
    ]),
  });

  let url = `https://graph.facebook.com/v22.0/${META_ACCOUNT}/ads?${params.toString()}`;
  const allAds: MetaAd[] = [];

  // Page through results (max 3 pages to bound runtime — 600 ads is way more
  // than we'd ever see in a 48h window).
  for (let page = 0; page < 3 && url; page++) {
    const res = await fetch(url);
    const body: { data?: MetaAd[]; paging?: { next?: string }; error?: { message?: string } } = await res.json();

    if (body.error) {
      console.error("[cron/meta-ads-check] Meta API error", body.error);
      return NextResponse.json({ error: "Meta API error", detail: body.error }, { status: 502 });
    }

    if (body.data) allAds.push(...body.data);
    url = body.paging?.next ?? "";
  }

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
