import { readFileSync } from "fs";
import { resolve } from "path";
const env = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
for (const line of env.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)/);
  if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
}
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

const INTERNAL = ["patrypierreandre","sofiane.lekfif","sofiane@reddotgrowth","thibault.cdn","reddotgrowth"];
const isInternal = (e: string) => INTERNAL.some(p => (e ?? "").toLowerCase().includes(p));

async function main() {
  // since 2026-06-27 00:00 UTC
  const since = "2026-06-27T00:00:00Z";
  console.log(`\n=== Comparing Meta "Vue de destination" (98) vs our funnel data since ${since} ===\n`);
  
  // 1. ALL funnel_sessions since (no filter)
  const { data: allSessions } = await sb.from("funnel_sessions").select("session_id, answers, created_at")
    .gte("created_at", since);
  console.log(`(A) funnel_sessions total (any state): ${allSessions?.length}`);
  
  // 2. With _max_step (admin filter)
  const withStep = (allSessions ?? []).filter(s => {
    const ms = (s.answers as any)?._max_step;
    return typeof ms === "number" && ms >= 0;
  });
  console.log(`(B) funnel_sessions with _max_step >= 0 (admin shows this): ${withStep.length}`);
  
  // 3. External only
  const external = withStep.filter(s => !isInternal((s.answers as any)?.email ?? ""));
  console.log(`(C) Of B, external (no internal emails): ${external.length}`);
  
  // 4. From ads (utm_source = ig/fb/etc)
  const ADS_SOURCES = ["ig","fb","meta","instagram","facebook"];
  const ads = external.filter(s => {
    const a = s.answers as any;
    return a && ADS_SOURCES.includes(String(a._utm_source ?? "").toLowerCase());
  });
  console.log(`(D) Of C, from Meta ads (_utm_source=ig/fb): ${ads.length}`);
  
  // 5. PageView / quiz_started events
  const { data: pvEvents } = await sb.from("event_sessions").select("session_id, event, payload, created_at")
    .gte("created_at", since).in("event", ["quiz_started", "PageView", "page_view", "landing_page_view"]);
  console.log(`\n(E) event_sessions quiz_started or PageView since 27/06: ${pvEvents?.length}`);
  const byEvent: Record<string, number> = {};
  for (const e of pvEvents ?? []) byEvent[e.event] = (byEvent[e.event] ?? 0) + 1;
  for (const [k,v] of Object.entries(byEvent)) console.log(`    ${k}: ${v}`);
  
  // 6. Distinct funnel_sids who hit some page
  const allEvents = await sb.from("event_sessions").select("session_id, event, payload, created_at")
    .gte("created_at", since);
  const distinctSids = new Set((allEvents.data ?? []).map(e => e.session_id));
  console.log(`\n(F) Distinct session_ids that triggered ANY event since 27/06: ${distinctSids.size}`);
  
  // 7. Breakdown by day
  console.log(`\n=== Sessions started per day (admin view, external, with _max_step) ===`);
  const byDay: Record<string, number> = {};
  for (const s of external) {
    const d = s.created_at.slice(0, 10);
    byDay[d] = (byDay[d] ?? 0) + 1;
  }
  for (const [d,n] of Object.entries(byDay).sort()) console.log(`  ${d}  ${n}`);
  
  // 8. Sessions per day from ads
  console.log(`\n=== Sessions per day from Meta ads only ===`);
  const byDayAds: Record<string, number> = {};
  for (const s of ads) {
    const d = s.created_at.slice(0, 10);
    byDayAds[d] = (byDayAds[d] ?? 0) + 1;
  }
  for (const [d,n] of Object.entries(byDayAds).sort()) console.log(`  ${d}  ${n}`);
}
main().catch(e => { console.error(e); process.exit(1); });
