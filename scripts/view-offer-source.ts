import { readFileSync } from "fs";
import { resolve } from "path";
const env = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
for (const line of env.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)/);
  if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
}
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

async function main() {
  const today = "2026-06-28T00:00:00Z";
  
  // 1. view_offer events today
  const { data: viewOffer } = await sb.from("event_sessions").select("*")
    .eq("event", "view_offer").gte("created_at", today).order("created_at");
  
  // 2. Funnel sessions that started today
  const { data: funnelToday } = await sb.from("funnel_sessions").select("session_id, answers, created_at")
    .gte("created_at", today);
  const todaySids = new Set((funnelToday ?? []).map(f => f.session_id));
  
  // 3. All funnel sessions (any date) to detect "returning user from a prior day"
  const { data: allFunnels } = await sb.from("funnel_sessions").select("session_id, created_at").order("created_at", { ascending: false }).limit(2000);
  const allSids = new Set((allFunnels ?? []).map(f => f.session_id));
  
  // Bucket each view_offer
  const buckets = {
    "(a) Today funnel - completed today": 0,
    "(b) Returning - funnel from a previous day": 0,
    "(c) No funnel_sid, but has a funnel session today (probably direct nav)": 0,
    "(d) Cold traffic - no funnel session anywhere": 0,
  };
  const details: string[] = [];
  for (const e of viewOffer ?? []) {
    const p = e.payload as any;
    const fs = p?.funnel_sid;
    const sid = e.session_id;
    let bucket = "";
    if (fs && todaySids.has(fs)) bucket = "(a) Today funnel - completed today";
    else if (fs && allSids.has(fs)) bucket = "(b) Returning - funnel from a previous day";
    else if (!fs && (todaySids.has(sid) || allSids.has(sid))) bucket = "(c) No funnel_sid, but has a funnel session today (probably direct nav)";
    else bucket = "(d) Cold traffic - no funnel session anywhere";
    (buckets as any)[bucket]++;
    details.push(`  ${e.created_at}  sid=${sid.slice(0,8)}  fs=${(fs ?? "—").slice(0,8)}  → ${bucket}`);
  }
  
  console.log(`\n=== view_offer events today: ${viewOffer?.length} ===`);
  const uniq = new Set((viewOffer ?? []).map((e: any) => e.payload?.funnel_sid ?? e.session_id));
  console.log(`Unique sessions: ${uniq.size}\n`);
  
  for (const [k, v] of Object.entries(buckets)) console.log(`  ${k.padEnd(70)} ${v}`);
  console.log(`\n=== Details ===`);
  for (const d of details) console.log(d);
  
  // Check if any view_offer sessions ALSO have a leads row (i.e. opted-in)
  const sidsViewOffer = Array.from(new Set((viewOffer ?? []).map((e: any) => e.session_id)));
  const { data: leadsWithSid } = await sb.from("leads").select("payload").in("payload->>session_id", sidsViewOffer.slice(0, 50));
  console.log(`\n=== view_offer sessions with a lead row: ${leadsWithSid?.length ?? 0} / ${sidsViewOffer.length} ===`);
}
main().catch(e => { console.error(e); process.exit(1); });
