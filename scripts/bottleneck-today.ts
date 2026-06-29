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
  const startOfToday = "2026-06-28T00:00:00Z";
  // Sessions today
  const { data: sessions } = await sb.from("funnel_sessions").select("session_id, answers, created_at")
    .gte("created_at", startOfToday).order("created_at");
  const externalSessions = (sessions ?? []).filter(s => !isInternal((s.answers as any)?.email ?? ""));
  
  console.log(`\n=== FUNNEL TODAY (${startOfToday.slice(0,10)} UTC) ===\n`);
  console.log(`Total sessions: ${externalSessions.length}`);
  
  // Step distribution
  const stepBuckets: Record<string, number> = {
    "step 0-1 (intro/age)": 0,
    "step 2 (dream)": 0,
    "step 3-5 (stat,ethnicity,morpho)": 0,
    "step 6 (pain)": 0,
    "step 7-9 (timeline,orientation,info0)": 0,
    "step 10-12 (height,weight,time)": 0,
    "step 13 (info_time)": 0,
    "step 14 (past_solutions)": 0,
    "step 15-16 (photo,summary)": 0,
    "step 17-19 (how-it-works,promise,yes-ladder1)": 0,
    "step 20-22 (yes-ladders 2-3,final-loading)": 0,
    "step 23+ (optin slide)": 0,
  };
  
  for (const s of externalSessions) {
    const ms = (s.answers as any)?._max_step ?? 0;
    if (ms <= 1) stepBuckets["step 0-1 (intro/age)"]++;
    else if (ms === 2) stepBuckets["step 2 (dream)"]++;
    else if (ms <= 5) stepBuckets["step 3-5 (stat,ethnicity,morpho)"]++;
    else if (ms === 6) stepBuckets["step 6 (pain)"]++;
    else if (ms <= 9) stepBuckets["step 7-9 (timeline,orientation,info0)"]++;
    else if (ms <= 12) stepBuckets["step 10-12 (height,weight,time)"]++;
    else if (ms === 13) stepBuckets["step 13 (info_time)"]++;
    else if (ms === 14) stepBuckets["step 14 (past_solutions)"]++;
    else if (ms <= 16) stepBuckets["step 15-16 (photo,summary)"]++;
    else if (ms <= 19) stepBuckets["step 17-19 (how-it-works,promise,yes-ladder1)"]++;
    else if (ms <= 22) stepBuckets["step 20-22 (yes-ladders 2-3,final-loading)"]++;
    else stepBuckets["step 23+ (optin slide)"]++;
  }
  
  console.log("\n=== Where they stopped ===");
  let cum = externalSessions.length;
  for (const [k, v] of Object.entries(stepBuckets)) {
    console.log(`  ${k.padEnd(50)} | ${v} stopped here`);
  }
  
  // Opt-in
  const optins = externalSessions.filter(s => (s.answers as any)?.email);
  console.log(`\n=== Reached opt-in: ${optins.length}/${externalSessions.length} = ${(100*optins.length/externalSessions.length).toFixed(1)}% ===`);
  
  // Cumulative reach
  console.log(`\n=== Cumulative reach (% reaching each step) ===`);
  const checkpoints = [
    { label: "Started (step 0)", ms: 0 },
    { label: "Reached dream (step 2)", ms: 2 },
    { label: "Reached pain (step 6)", ms: 6 },
    { label: "Reached photo (step 15)", ms: 15 },
    { label: "Reached optin (step 23)", ms: 23 },
    { label: "Opt-in (email captured)", ms: -1 }, // marker
  ];
  for (const cp of checkpoints) {
    const n = cp.ms === -1 ? optins.length : externalSessions.filter(s => ((s.answers as any)?._max_step ?? 0) >= cp.ms).length;
    const pct = 100*n/externalSessions.length;
    console.log(`  ${cp.label.padEnd(40)} ${n}/${externalSessions.length} = ${pct.toFixed(1)}%`);
  }
  
  // Drop between consecutive checkpoints
  console.log(`\n=== Biggest drops between steps ===`);
  for (let i = 1; i < checkpoints.length; i++) {
    const prev = checkpoints[i-1];
    const cur = checkpoints[i];
    const prevN = prev.ms === -1 ? optins.length : externalSessions.filter(s => ((s.answers as any)?._max_step ?? 0) >= prev.ms).length;
    const curN = cur.ms === -1 ? optins.length : externalSessions.filter(s => ((s.answers as any)?._max_step ?? 0) >= cur.ms).length;
    const drop = prevN > 0 ? 100*(prevN - curN)/prevN : 0;
    console.log(`  ${prev.label.padEnd(30)} -> ${cur.label.padEnd(30)} ${prevN}->${curN} | drop -${drop.toFixed(1)}%`);
  }
  
  // Events: report, preview, offer, checkout
  console.log(`\n=== Downstream events today ===`);
  for (const evt of ["report_viewed", "protocol_preview_viewed", "view_offer", "checkout_form_viewed"]) {
    const { data: events } = await sb.from("event_sessions").select("session_id, payload")
      .eq("event", evt).gte("created_at", startOfToday);
    const uniqSids = new Set((events ?? []).map((e: any) => e.payload?.funnel_sid ?? e.session_id));
    console.log(`  ${evt.padEnd(30)} ${events?.length ?? 0} events, ${uniqSids.size} unique session(s)`);
  }
  
  // Payments today
  const { data: paid } = await sb.from("users").select("email, paid_at, paid_amount_cents")
    .gte("paid_at", startOfToday);
  console.log(`\n=== Paid today: ${paid?.length ?? 0} ===`);
  if (paid?.length) for (const p of paid) console.log(`  ${p.email} | $${(p.paid_amount_cents ?? 0)/100} | ${p.paid_at}`);
}
main().catch(e => { console.error(e); process.exit(1); });
