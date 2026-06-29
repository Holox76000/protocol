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

function archetypeFamily(morph: string, age: string, time: string): string {
  const young = age === "20–29";
  const mature40plus = age === "40–49" || age === "50+";
  const heavyTraining = time === "3 to 5 hours" || time === "More than 5 hours";
  const mediumTraining = time === "1 to 3 hours";
  const lightTraining = time === "Zero effort right now" || time === "Less than 1 hour";

  if (morph === "Average" && heavyTraining) return "ATHLETIC-ASPIRATIONAL";
  if (morph === "Skinny" && heavyTraining) return "ATHLETIC-ASPIRATIONAL";
  if (morph === "Average" && mediumTraining) return "ATHLETIC-ASPIRATIONAL";
  if (morph === "Skinny" && young) return "TWINK / OTTER";
  if (morph === "Skinny") return "TWINK / OTTER";
  if (morph === "Skinny-fat") return "SKINNY-FAT";
  if (morph === "Overweight") return "CUB/BEAR/CHUB";
  if (morph === "Average") return "AVG (low train)";
  return "Other";
}

async function main() {
  const since = new Date(Date.now() - 15*86400000).toISOString();
  
  // Quiz sessions gay/bi last 15d
  const { data: sessions } = await sb.from("funnel_sessions").select("session_id, answers, created_at")
    .gte("created_at", since).order("created_at");
  const gayBi = (sessions ?? []).filter(s => {
    const a = s.answers as any;
    const o = String(a?.sexual_orientation ?? "").toLowerCase();
    return ["gay","bisexual"].includes(o) && !isInternal(a?.email ?? "");
  });
  
  // Tag each with family
  for (const s of gayBi) {
    const a = s.answers as any;
    (s as any)._family = archetypeFamily(a.morphology ?? "—", a.age_bracket ?? "—", a.weekly_time ?? "—");
  }
  
  // Aggregate per family
  const families: Record<string, any[]> = {};
  for (const s of gayBi) {
    const f = (s as any)._family;
    families[f] = families[f] ?? [];
    families[f].push(s);
  }
  
  // For each family, compute funnel metrics
  console.log(`\n=== Gay/Bi sessions last 15d, by family ===\n`);
  
  // Pre-fetch events
  const { data: events } = await sb.from("event_sessions").select("session_id, event, payload, created_at")
    .gte("created_at", since).in("event", ["report_viewed","protocol_preview_viewed","view_offer"]);
  
  for (const [family, members] of Object.entries(families).sort((a,b) => b[1].length - a[1].length)) {
    const sids = new Set(members.map(s => s.session_id));
    
    const optin = members.filter(s => (s.answers as any)?.email).length;
    const yesLadderReached = members.filter(s => {
      const ms = (s.answers as any)?._max_step;
      return typeof ms === "number" && ms >= 19;
    }).length;
    
    function uniqFor(evt: string) {
      const linked = (events ?? []).filter(e => e.event === evt && (sids.has(e.session_id) || sids.has((e.payload as any)?.funnel_sid)));
      return new Set(linked.map(e => (e.payload as any)?.funnel_sid ?? e.session_id)).size;
    }
    const report = uniqFor("report_viewed");
    const preview = uniqFor("protocol_preview_viewed");
    const offer = uniqFor("view_offer");
    
    console.log(`━━━ ${family} ━━━`);
    console.log(`  Sessions:         ${members.length}`);
    console.log(`  Reached yes-ladders (step 19): ${yesLadderReached}  (${(100*yesLadderReached/members.length).toFixed(0)}%)`);
    console.log(`  Opt-in:           ${optin}  (${(100*optin/members.length).toFixed(0)}%)`);
    console.log(`  Report viewed:    ${report}  (${optin ? (100*report/optin).toFixed(0) : 0}% of opt-in)`);
    console.log(`  Preview viewed:   ${preview}  (${report ? (100*preview/report).toFixed(0) : 0}% of report)`);
    console.log(`  Offer viewed:     ${offer}  (${preview ? (100*offer/preview).toFixed(0) : 0}% of preview)`);
    console.log("");
  }
  
  // Now also look at dream and pain by family
  console.log(`\n=== DREAM OUTCOME by family ===\n`);
  for (const [family, members] of Object.entries(families).sort((a,b) => b[1].length - a[1].length).slice(0, 5)) {
    console.log(`━━━ ${family} (N=${members.length}) ━━━`);
    const dreams: Record<string, number> = {};
    for (const s of members) {
      const d = String((s.answers as any)?.dream_outcome ?? "—").slice(0, 80);
      dreams[d] = (dreams[d] ?? 0) + 1;
    }
    for (const [d, c] of Object.entries(dreams).sort((a,b) => b[1] - a[1]).slice(0, 3)) {
      console.log(`  ${c}× ${d}`);
    }
    console.log("");
  }
  
  console.log(`\n=== PAIN by family ===\n`);
  for (const [family, members] of Object.entries(families).sort((a,b) => b[1].length - a[1].length).slice(0, 5)) {
    console.log(`━━━ ${family} (N=${members.length}) ━━━`);
    const pains: Record<string, number> = {};
    for (const s of members) {
      const p = (s.answers as any)?.pain_friction;
      if (Array.isArray(p)) for (const x of p) pains[x] = (pains[x] ?? 0) + 1;
    }
    for (const [p, c] of Object.entries(pains).sort((a,b) => b[1] - a[1]).slice(0, 4)) {
      console.log(`  ${c}× ${p}`);
    }
    console.log("");
  }
  
  // Past solutions by family
  console.log(`\n=== PAST SOLUTIONS by family ===\n`);
  for (const [family, members] of Object.entries(families).sort((a,b) => b[1].length - a[1].length).slice(0, 5)) {
    console.log(`━━━ ${family} (N=${members.length}) ━━━`);
    const past: Record<string, number> = {};
    for (const s of members) {
      const p = (s.answers as any)?.past_solutions;
      if (Array.isArray(p)) for (const x of p) past[x] = (past[x] ?? 0) + 1;
    }
    for (const [p, c] of Object.entries(past).sort((a,b) => b[1] - a[1]).slice(0, 5)) {
      console.log(`  ${c}× (${(100*c/members.length).toFixed(0)}%) ${p}`);
    }
    console.log("");
  }
}
main().catch(e => { console.error(e); process.exit(1); });
