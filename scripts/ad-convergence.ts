import { readFileSync } from "fs";
import { resolve } from "path";
const env = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
for (const line of env.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)/);
  if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
}
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

const TARGET_AD = "120248679211410660";
const INTERNAL = ["patrypierreandre","sofiane.lekfif","sofiane@reddotgrowth","thibault.cdn","reddotgrowth"];
const isInternal = (e: string) => INTERNAL.some(p => (e ?? "").toLowerCase().includes(p));

async function main() {
  // Pull all funnel_sessions (last 30d, plenty wide)
  const since = "2026-06-01T00:00:00Z";
  const { data: sessions } = await sb.from("funnel_sessions").select("session_id, answers, created_at")
    .gte("created_at", since).order("created_at", { ascending: true });
  
  const adSessions = (sessions ?? []).filter(s => {
    const a = s.answers as any;
    return a && a._utm_content === TARGET_AD;
  });
  
  console.log(`\n=== Ad ${TARGET_AD} — sessions since ${since.slice(0,10)} ===`);
  console.log(`Total sessions attributed to this ad: ${adSessions.length}\n`);
  
  // Step distribution
  const buckets: Record<string, number> = {
    "step 0-1 (intro/age)": 0,
    "step 2 (dream)": 0,
    "step 3-5 (stat,ethnicity,morpho)": 0,
    "step 6-7 (pain + timeline)": 0,
    "step 8-9 (orientation, info)": 0,
    "step 10-11 (height, weight)": 0,
    "step 12-13 (time + info)": 0,
    "step 14 (past solutions)": 0,
    "step 15 (photo upload)": 0,
    "step 16-18 (summary/howto/promise)": 0,
    "step 19-21 (yes-ladders)": 0,
    "step 22-23 (final-loading, optin)": 0,
    "step 24+ (post-optin)": 0,
    "GHOST (no _max_step)": 0,
  };
  
  let withEmail = 0, ghostCount = 0;
  const sids = adSessions.map(s => s.session_id);
  
  for (const s of adSessions) {
    const a = s.answers as any;
    const ms = a?._max_step;
    if (a?.email) withEmail++;
    if (ms === undefined || ms === null) { buckets["GHOST (no _max_step)"]++; ghostCount++; continue; }
    if (ms <= 1) buckets["step 0-1 (intro/age)"]++;
    else if (ms === 2) buckets["step 2 (dream)"]++;
    else if (ms <= 5) buckets["step 3-5 (stat,ethnicity,morpho)"]++;
    else if (ms <= 7) buckets["step 6-7 (pain + timeline)"]++;
    else if (ms <= 9) buckets["step 8-9 (orientation, info)"]++;
    else if (ms <= 11) buckets["step 10-11 (height, weight)"]++;
    else if (ms <= 13) buckets["step 12-13 (time + info)"]++;
    else if (ms === 14) buckets["step 14 (past solutions)"]++;
    else if (ms === 15) buckets["step 15 (photo upload)"]++;
    else if (ms <= 18) buckets["step 16-18 (summary/howto/promise)"]++;
    else if (ms <= 21) buckets["step 19-21 (yes-ladders)"]++;
    else if (ms <= 23) buckets["step 22-23 (final-loading, optin)"]++;
    else buckets["step 24+ (post-optin)"]++;
  }
  
  console.log("=== Where they stopped (last slide seen) ===");
  for (const [k, v] of Object.entries(buckets)) console.log(`  ${k.padEnd(40)} ${v}`);
  
  console.log(`\n=== Opt-in: ${withEmail}/${adSessions.length} = ${adSessions.length ? (100*withEmail/adSessions.length).toFixed(0) : 0}% ===`);
  
  // Cumulative funnel
  console.log(`\n=== Cumulative reach (% reaching each step) ===`);
  const checkpoints = [
    { label: "Started", ms: 0 },
    { label: "Reached dream (step 2)", ms: 2 },
    { label: "Reached pain (step 6)", ms: 6 },
    { label: "Reached orientation (step 8)", ms: 8 },
    { label: "Reached weight (step 11)", ms: 11 },
    { label: "Reached past_solutions (step 14)", ms: 14 },
    { label: "Reached photo (step 15)", ms: 15 },
    { label: "Reached yes-ladders (step 19)", ms: 19 },
    { label: "Reached optin (step 23)", ms: 23 },
  ];
  const denom = adSessions.length - ghostCount; // exclude ghosts from denominator
  for (const cp of checkpoints) {
    const n = adSessions.filter(s => {
      const ms = (s.answers as any)?._max_step;
      return typeof ms === "number" && ms >= cp.ms;
    }).length;
    const pct = denom ? (100*n/denom).toFixed(0) : "—";
    console.log(`  ${cp.label.padEnd(45)} ${n}/${denom}  (${pct}%)`);
  }
  
  // Optin + downstream
  console.log(`\n=== Post-quiz events ===`);
  const { data: events } = await sb.from("event_sessions").select("session_id, event, payload, created_at")
    .gte("created_at", since)
    .in("event", ["report_viewed", "protocol_preview_viewed", "view_offer"]);
  function uniqFor(evt: string) {
    const linked = (events ?? []).filter(e => e.event === evt && (sids.includes(e.session_id) || sids.includes((e.payload as any)?.funnel_sid)));
    const uniq = new Set(linked.map(e => (e.payload as any)?.funnel_sid ?? e.session_id));
    return uniq.size;
  }
  console.log(`  Optin (email captured):    ${withEmail}`);
  console.log(`  report_viewed unique:      ${uniqFor("report_viewed")}`);
  console.log(`  protocol_preview_viewed:   ${uniqFor("protocol_preview_viewed")}`);
  console.log(`  view_offer unique:         ${uniqFor("view_offer")}`);
  
  // Compare to ALL other ads
  console.log(`\n=== Comparison: this ad vs ALL other ads ===`);
  const allAds = (sessions ?? []).filter(s => {
    const a = s.answers as any;
    return a?._utm_content && a._utm_content !== TARGET_AD && ["ig","fb","meta","instagram","facebook"].includes(String(a._utm_source ?? "").toLowerCase());
  });
  console.log(`  Other ads total sessions: ${allAds.length}`);
  console.log(`  Other ads optin:          ${allAds.filter(s => (s.answers as any)?.email).length} (${allAds.length ? (100*allAds.filter(s => (s.answers as any)?.email).length/allAds.length).toFixed(0) : 0}%)`);
  
  // Distribution by date for the target ad
  console.log(`\n=== This ad per day ===`);
  const byDay: Record<string, number> = {};
  for (const s of adSessions) {
    const d = s.created_at.slice(0, 10);
    byDay[d] = (byDay[d] ?? 0) + 1;
  }
  for (const [d, n] of Object.entries(byDay).sort()) console.log(`  ${d}  ${n}`);
}
main().catch(e => { console.error(e); process.exit(1); });
