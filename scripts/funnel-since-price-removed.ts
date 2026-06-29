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
// Commit 4534510 deployed at 2026-06-27 09:12:41 UTC. Round to 09:00 UTC to be safe.
const CUTOFF = "2026-06-27T09:00:00Z";
const cutoffEpoch = Math.floor(new Date(CUTOFF).getTime() / 1000);
const INTERNAL = ["patrypierreandre","sofiane.lekfif","sofiane@reddotgrowth","thibault.cdn","reddotgrowth"];
const isInternal = (e: string) => INTERNAL.some(p => (e ?? "").toLowerCase().includes(p));

async function main() {
  console.log(`\n=== Stats since price-removed on /protocol-preview CTAs (${CUTOFF}) ===\n`);
  
  // All funnel sessions since cutoff
  const { data: funnels } = await sb.from("funnel_sessions").select("session_id, answers, created_at")
    .gte("created_at", CUTOFF).order("created_at");
  
  // Filter out internal
  const external = (funnels ?? []).filter(s => !isInternal((s.answers as any)?.email ?? ""));
  const ads = external.filter(s => {
    const a = s.answers as any;
    return a && ADS_SOURCES.includes(String(a._utm_source ?? "").toLowerCase());
  });
  const direct = external.filter(s => {
    const a = s.answers as any;
    return !a?._utm_source;
  });
  
  console.log(`Total sessions: ${external.length} (external)`);
  console.log(`  - From ads:     ${ads.length}`);
  console.log(`  - Direct/no UTM: ${direct.length}`);
  console.log(`  - Other UTMs:   ${external.length - ads.length - direct.length}`);
  
  // Events since cutoff
  const { data: events } = await sb.from("event_sessions").select("session_id, event, payload, created_at")
    .gte("created_at", CUTOFF).order("created_at");
  
  function funnelFor(group: any[], label: string) {
    const sids = new Set(group.map(g => g.session_id));
    const linked = (events ?? []).filter(e => sids.has(e.session_id) || sids.has((e.payload as any)?.funnel_sid));
    const optin = group.filter(g => (g.answers as any)?.email).length;
    const reportSids = new Set(linked.filter(e => e.event === "report_viewed").map(e => (e.payload as any)?.funnel_sid ?? e.session_id));
    const previewSids = new Set(linked.filter(e => e.event === "protocol_preview_viewed").map(e => (e.payload as any)?.funnel_sid ?? e.session_id));
    const offerSids = new Set(linked.filter(e => e.event === "view_offer").map(e => (e.payload as any)?.funnel_sid ?? e.session_id));
    console.log(`\n=== ${label} ===`);
    console.log(`  Sessions:           ${group.length}`);
    console.log(`  Opt-in (email):     ${optin}  (${group.length ? (100*optin/group.length).toFixed(0) : 0}%)`);
    console.log(`  Report viewed:      ${reportSids.size}  (${optin ? (100*reportSids.size/optin).toFixed(0) : 0}% of opt-ins)`);
    console.log(`  Preview viewed:     ${previewSids.size}  (${reportSids.size ? (100*previewSids.size/reportSids.size).toFixed(0) : 0}% of report)`);
    const pctOff = previewSids.size ? (100*offerSids.size/previewSids.size).toFixed(0) : "0"; console.log(`  /f1/offer viewed:   ${offerSids.size}  (${pctOff}% of preview)`);
    return { group, optin, reportSids, previewSids, offerSids };
  }
  
  const adFunnel = funnelFor(ads, `Funnel ADS depuis 27/06 09:00 UTC`);
  const directFunnel = funnelFor(direct, `Funnel DIRECT/ORGANIC depuis 27/06 09:00 UTC`);
  
  // Stripe — PIs and successful payments since cutoff
  const pis = await stripe.paymentIntents.list({ created: { gte: cutoffEpoch }, limit: 100 });
  const externalPis = pis.data.filter(pi => !isInternal((pi as any).receipt_email ?? ""));
  console.log(`\n=== Cart (Stripe) depuis 27/06 09:00 UTC ===`);
  console.log(`  PaymentIntents created:  ${externalPis.length}`);
  console.log(`  Succeeded (paid):         ${externalPis.filter(pi => pi.status === "succeeded").length}`);
  console.log(`  Requires payment method:  ${externalPis.filter(pi => pi.status === "requires_payment_method").length}`);
  for (const pi of externalPis) {
    const created = new Date(pi.created * 1000).toISOString();
    console.log(`    ${created}  ${pi.status.padEnd(28)}  ${(pi as any).receipt_email ?? "—"}`);
  }
  
  // Comparison window — 24h before cutoff (same window length for fair comparison)
  console.log(`\n=== Comparison: 24h BEFORE cutoff (2026-06-26 09:00 → 2026-06-27 09:00 UTC) ===`);
  const beforeStart = "2026-06-26T09:00:00Z";
  const { data: beforeFunnels } = await sb.from("funnel_sessions").select("session_id, answers, created_at")
    .gte("created_at", beforeStart).lt("created_at", CUTOFF);
  const beforeExt = (beforeFunnels ?? []).filter(s => !isInternal((s.answers as any)?.email ?? ""));
  const beforeAds = beforeExt.filter(s => {
    const a = s.answers as any; return a && ADS_SOURCES.includes(String(a._utm_source ?? "").toLowerCase());
  });
  const { data: beforeEvents } = await sb.from("event_sessions").select("session_id, event, payload, created_at")
    .gte("created_at", beforeStart).lt("created_at", CUTOFF);
  const beforeAdSids = new Set(beforeAds.map(g => g.session_id));
  const beforeLinked = (beforeEvents ?? []).filter(e => beforeAdSids.has(e.session_id) || beforeAdSids.has((e.payload as any)?.funnel_sid));
  const bo = beforeAds.filter(g => (g.answers as any)?.email).length;
  const bp = new Set(beforeLinked.filter(e => e.event === "protocol_preview_viewed").map(e => (e.payload as any)?.funnel_sid ?? e.session_id)).size;
  const bof = new Set(beforeLinked.filter(e => e.event === "view_offer").map(e => (e.payload as any)?.funnel_sid ?? e.session_id)).size;
  console.log(`  Sessions ads:       ${beforeAds.length}`);
  console.log(`  Opt-in:             ${bo}`);
  console.log(`  Preview viewed:     ${bp}`);
  console.log(`  /f1/offer viewed:   ${bof}`);
  
  const beforePIs = await stripe.paymentIntents.list({ created: { gte: Math.floor(new Date(beforeStart).getTime()/1000), lte: cutoffEpoch }, limit: 100 });
  const beforeExtPi = beforePIs.data.filter(pi => !isInternal((pi as any).receipt_email ?? ""));
  console.log(`  Cart PIs:           ${beforeExtPi.length}`);
  console.log(`  Paid:               ${beforeExtPi.filter(pi => pi.status === "succeeded").length}`);
}
main().catch(e => { console.error(e); process.exit(1); });
