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
  const { data: sessions } = await sb.from("funnel_sessions").select("session_id, answers, created_at")
    .gte("created_at", since).order("created_at");
  
  // GAY/BI + OPT-IN only
  const gayBiOptin = (sessions ?? []).filter(s => {
    const a = s.answers as any;
    const o = String(a?.sexual_orientation ?? "").toLowerCase();
    return ["gay","bisexual"].includes(o) && !isInternal(a?.email ?? "") && a?.email;
  });
  
  console.log(`\n=== Gay/Bi OPT-INs last 15d: ${gayBiOptin.length} ===\n`);
  
  for (const s of gayBiOptin) {
    const a = s.answers as any;
    (s as any)._family = archetypeFamily(a.morphology ?? "—", a.age_bracket ?? "—", a.weekly_time ?? "—");
  }
  
  const families: Record<string, any[]> = {};
  for (const s of gayBiOptin) {
    const f = (s as any)._family;
    families[f] = families[f] ?? [];
    families[f].push(s);
  }
  
  const { data: events } = await sb.from("event_sessions").select("session_id, event, payload, created_at")
    .gte("created_at", since).in("event", ["report_viewed","protocol_preview_viewed","view_offer"]);
  
  console.log("Family distribution (gay/bi opt-ins, 15d):\n");
  for (const [family, members] of Object.entries(families).sort((a,b) => b[1].length - a[1].length)) {
    const pct = (100*members.length/gayBiOptin.length).toFixed(0);
    console.log(`  ${family.padEnd(35)} ${String(members.length).padStart(3)}  (${pct}%)`);
  }
  
  console.log("\n=== Funnel by family (gay/bi opt-ins) ===\n");
  for (const [family, members] of Object.entries(families).sort((a,b) => b[1].length - a[1].length)) {
    const sids = new Set(members.map(s => s.session_id));
    function uniqFor(evt: string) {
      const linked = (events ?? []).filter(e => e.event === evt && (sids.has(e.session_id) || sids.has((e.payload as any)?.funnel_sid)));
      return new Set(linked.map(e => (e.payload as any)?.funnel_sid ?? e.session_id)).size;
    }
    const report = uniqFor("report_viewed");
    const preview = uniqFor("protocol_preview_viewed");
    const offer = uniqFor("view_offer");
    console.log(`━━━ ${family} (${members.length} opt-ins) ━━━`);
    console.log(`  Report viewed:    ${report}  (${(100*report/members.length).toFixed(0)}%)`);
    console.log(`  Preview viewed:   ${preview}  (${report ? (100*preview/report).toFixed(0) : 0}% of report)`);
    console.log(`  Offer viewed:     ${offer}  (${(100*offer/members.length).toFixed(0)}%)`);
    console.log("");
  }
  
  // Pain, past, dream by family (opt-ins only)
  console.log("=== PAIN by family (opt-ins) ===\n");
  for (const [family, members] of Object.entries(families).sort((a,b) => b[1].length - a[1].length).slice(0, 4)) {
    console.log(`━━━ ${family} (N=${members.length}) ━━━`);
    const pains: Record<string, number> = {};
    for (const s of members) {
      const p = (s.answers as any)?.pain_friction;
      if (Array.isArray(p)) for (const x of p) pains[x] = (pains[x] ?? 0) + 1;
    }
    for (const [p, c] of Object.entries(pains).sort((a,b) => b[1] - a[1]).slice(0, 4)) {
      console.log(`  ${c}× (${(100*c/members.length).toFixed(0)}%) ${p}`);
    }
    console.log("");
  }
  
  console.log("\n=== PAST SOLUTIONS by family (opt-ins) ===\n");
  for (const [family, members] of Object.entries(families).sort((a,b) => b[1].length - a[1].length).slice(0, 4)) {
    console.log(`━━━ ${family} (N=${members.length}) ━━━`);
    const past: Record<string, number> = {};
    for (const s of members) {
      const p = (s.answers as any)?.past_solutions;
      if (Array.isArray(p)) for (const x of p) past[x] = (past[x] ?? 0) + 1;
    }
    for (const [p, c] of Object.entries(past).sort((a,b) => b[1] - a[1])) {
      console.log(`  ${c}× (${(100*c/members.length).toFixed(0)}%) ${p}`);
    }
    console.log("");
  }
  
  console.log("\n=== DREAM by family (opt-ins) ===\n");
  for (const [family, members] of Object.entries(families).sort((a,b) => b[1].length - a[1].length).slice(0, 4)) {
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
}
main().catch(e => { console.error(e); process.exit(1); });
