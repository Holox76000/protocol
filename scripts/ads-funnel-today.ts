import { readFileSync } from "fs";
import { resolve } from "path";
const env = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
for (const line of env.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)/);
  if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
}
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-04-10" as any });

const ADS_SOURCES = ["ig", "fb", "meta", "instagram", "facebook", "tiktok", "tt"];

async function main() {
  const today = "2026-06-28T00:00:00Z";
  const todayEpoch = Math.floor(new Date(today).getTime() / 1000);
  
  // 1. Ad-attributed funnel sessions today
  const { data: allFunnels } = await sb.from("funnel_sessions").select("session_id, answers, created_at")
    .gte("created_at", today).order("created_at");
  
  const adFunnels = (allFunnels ?? []).filter(s => {
    const a = s.answers as any;
    return a && ADS_SOURCES.includes(String(a._utm_source ?? "").toLowerCase());
  });
  
  console.log(`\n=== Funnel sessions today: ${allFunnels?.length} total, ${adFunnels.length} from ads ===\n`);
  
  // 2. For each ad session, trace its journey
  const adSids = adFunnels.map(f => f.session_id);
  const adFunnelMap = new Map(adFunnels.map(f => [f.session_id, f]));
  
  // Get all event_sessions today that match any ad sid (as session_id or funnel_sid in payload)
  const { data: events } = await sb.from("event_sessions").select("session_id, event, payload, created_at")
    .gte("created_at", today)
    .order("created_at");
  
  // For each ad session, build its journey
  type Journey = {
    sid: string; created: string; utm_content: string; utm_campaign: string;
    max_step: number; email: string | null;
    report_viewed: boolean; preview_viewed: boolean; view_offer: boolean;
    pi_created: boolean; paid: boolean;
  };
  const journeys: Journey[] = [];
  
  for (const f of adFunnels) {
    const a = f.answers as any;
    const sid = f.session_id;
    // All events linked via session_id OR funnel_sid in payload
    const linked = (events ?? []).filter(e => e.session_id === sid || (e.payload as any)?.funnel_sid === sid);
    const j: Journey = {
      sid: sid.slice(0,8),
      created: f.created_at,
      utm_content: a._utm_content ?? "—",
      utm_campaign: a._utm_campaign ?? "—",
      max_step: a._max_step ?? 0,
      email: a.email ?? null,
      report_viewed: linked.some(e => e.event === "report_viewed"),
      preview_viewed: linked.some(e => e.event === "protocol_preview_viewed"),
      view_offer: linked.some(e => e.event === "view_offer"),
      pi_created: false,
      paid: false,
    };
    journeys.push(j);
  }
  
  // 3. Check Stripe PIs/payments matching ad sessions (via email match)
  const pis = await stripe.paymentIntents.list({ created: { gte: todayEpoch - 6*3600 }, limit: 100 });
  for (const j of journeys) {
    if (j.email) {
      const match = pis.data.find(pi => (pi as any).receipt_email === j.email || (pi.metadata as any)?.email === j.email);
      if (match) j.pi_created = true;
      if (match && match.status === "succeeded") j.paid = true;
    }
  }
  
  console.log("=== Ad-attributed funnels journey ===\n");
  console.log("sid       step  email                          report preview offer  pi  paid  utm_content");
  console.log("-".repeat(110));
  for (const j of journeys) {
    const e = (j.email ?? "(no email)").padEnd(30);
    console.log(`${j.sid}  ${String(j.max_step).padStart(2)}    ${e} ${j.report_viewed ? "✓" : "·"}      ${j.preview_viewed ? "✓" : "·"}       ${j.view_offer ? "✓" : "·"}      ${j.pi_created ? "✓" : "·"}   ${j.paid ? "✓" : "·"}    ${j.utm_content}`);
  }
  
  console.log("\n=== Ad funnel aggregate ===\n");
  console.log(`Sessions ads:           ${journeys.length}`);
  console.log(`Reached opt-in (email): ${journeys.filter(j => j.email).length}`);
  console.log(`Saw report:             ${journeys.filter(j => j.report_viewed).length}`);
  console.log(`Saw protocol-preview:   ${journeys.filter(j => j.preview_viewed).length}`);
  console.log(`Saw /f1/offer:          ${journeys.filter(j => j.view_offer).length}`);
  console.log(`Reached checkout (PI):  ${journeys.filter(j => j.pi_created).length}`);
  console.log(`Paid:                   ${journeys.filter(j => j.paid).length}`);
  
  // Returning leads from older days who reached /f1/offer today via ads
  console.log("\n=== Bonus: returning ad leads who reached /f1/offer today (older funnels) ===");
  const allOldFunnels = await sb.from("funnel_sessions").select("session_id, answers")
    .lt("created_at", today).order("created_at", { ascending: false }).limit(500);
  const oldAdSids = new Set((allOldFunnels.data ?? []).filter(s => {
    const a = s.answers as any;
    return a && ADS_SOURCES.includes(String(a._utm_source ?? "").toLowerCase());
  }).map(s => s.session_id));
  const todayViewOffer = (events ?? []).filter(e => e.event === "view_offer");
  const returningAd = todayViewOffer.filter(e => {
    const fs = (e.payload as any)?.funnel_sid;
    return fs && oldAdSids.has(fs);
  });
  const uniqReturning = new Set(returningAd.map(e => (e.payload as any).funnel_sid));
  console.log(`  Returning ad-attributed funnel_sids on /f1/offer today: ${uniqReturning.size}`);
  for (const sid of uniqReturning) console.log(`    funnel_sid=${sid.slice(0,8)}`);
}
main().catch(e => { console.error(e); process.exit(1); });
