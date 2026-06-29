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

// Archetype classifier (heuristic)
function archetype(morph: string, age: string, time: string): string {
  const young = age === "20–29";
  const mature40plus = age === "40–49" || age === "50+";
  const heavyTraining = time === "3 to 5 hours" || time === "More than 5 hours";
  const lightTraining = time === "Zero effort right now" || time === "Less than 1 hour";
  const mediumTraining = time === "1 to 3 hours";

  if (morph === "Skinny" && young) return "Twink";
  if (morph === "Skinny" && !young && heavyTraining) return "Otter/Wolf (lean+trained)";
  if (morph === "Skinny" && !young) return "Otter (lean, less trained)";
  if (morph === "Skinny") return "Twink";
  if (morph === "Skinny-fat" && young) return "Pre-Twunk";
  if (morph === "Skinny-fat" && mature40plus) return "Skinny-fat 40+";
  if (morph === "Skinny-fat") return "Skinny-fat (recompo zone)";
  if (morph === "Average" && heavyTraining && !mature40plus) return "Jock / Twunk-Hunk";
  if (morph === "Average" && heavyTraining && mature40plus) return "Daddy-fit / mature Hunk";
  if (morph === "Average" && mediumTraining) return "Twunk";
  if (morph === "Average" && lightTraining && mature40plus) return "Daddy-bod";
  if (morph === "Average") return "Twunk-Avg";
  if (morph === "Overweight" && mature40plus && heavyTraining) return "Muscle Bear / Daddy";
  if (morph === "Overweight" && mature40plus) return "Bear / Daddy";
  if (morph === "Overweight" && young) return "Cub";
  if (morph === "Overweight") return "Cub / Chub";
  return "Unclassified";
}

async function main() {
  const since = new Date(Date.now() - 15*86400000).toISOString();
  console.log(`\n=== Quiz audience: last 15 days (since ${since.slice(0,10)}) ===\n`);
  
  const { data: sessions } = await sb.from("funnel_sessions").select("session_id, answers, created_at")
    .gte("created_at", since).order("created_at");
  
  const external = (sessions ?? []).filter(s => !isInternal((s.answers as any)?.email ?? ""));
  console.log(`Total external sessions: ${external.length}`);
  
  // Qualified = email captured
  const qualified = external.filter(s => (s.answers as any)?.email);
  console.log(`Qualified (email captured): ${qualified.length}`);
  
  // Orientation distribution among qualified
  const orientCounts: Record<string, number> = {};
  for (const s of qualified) {
    const o = String((s.answers as any)?.sexual_orientation ?? "—");
    orientCounts[o] = (orientCounts[o] ?? 0) + 1;
  }
  console.log(`\n=== Orientation (qualified, last 15d) ===`);
  for (const [o, c] of Object.entries(orientCounts).sort((a,b) => b[1] - a[1])) {
    console.log(`  ${o.padEnd(25)} ${String(c).padStart(3)}  (${(100*c/qualified.length).toFixed(0)}%)`);
  }
  
  // Gay/Bi subset
  const gayBi = qualified.filter(s => {
    const o = String((s.answers as any)?.sexual_orientation ?? "").toLowerCase();
    return ["gay","bisexual"].includes(o);
  });
  console.log(`\n=== Gay/Bi subset: ${gayBi.length}/${qualified.length} = ${(100*gayBi.length/qualified.length).toFixed(0)}% ===`);
  
  // Archetype distribution for gay/bi only
  const archCounts: Record<string, number> = {};
  for (const s of gayBi) {
    const a = s.answers as any;
    const arch = archetype(a.morphology ?? "—", a.age_bracket ?? "—", a.weekly_time ?? "—");
    archCounts[arch] = (archCounts[arch] ?? 0) + 1;
  }
  console.log(`\n=== Archetype distribution (gay/bi, last 15d) ===`);
  for (const [k, v] of Object.entries(archCounts).sort((a,b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(35)} ${String(v).padStart(3)}  (${(100*v/gayBi.length).toFixed(0)}%)`);
  }
  
  // Morpho × Age sanity
  console.log(`\n=== Morpho × Age cross-tab (gay/bi, last 15d) ===`);
  console.log("morphology         | 20–29 | 30–39 | 40–49 | 50+ | —");
  const morphAge: Record<string, Record<string, number>> = {};
  for (const s of gayBi) {
    const a = s.answers as any;
    const m = a.morphology ?? "—";
    const ag = a.age_bracket ?? "—";
    morphAge[m] = morphAge[m] ?? {};
    morphAge[m][ag] = (morphAge[m][ag] ?? 0) + 1;
  }
  for (const [m, ages] of Object.entries(morphAge)) {
    console.log(`  ${m.padEnd(18)} | ${String(ages["20–29"] ?? 0).padStart(5)} | ${String(ages["30–39"] ?? 0).padStart(5)} | ${String(ages["40–49"] ?? 0).padStart(5)} | ${String(ages["50+"] ?? 0).padStart(3)} | ${String(ages["—"] ?? 0).padStart(2)}`);
  }
  
  // Top pain_friction for gay/bi
  const painCounts: Record<string, number> = {};
  for (const s of gayBi) {
    const pain = (s.answers as any)?.pain_friction;
    if (Array.isArray(pain)) for (const p of pain) painCounts[p] = (painCounts[p] ?? 0) + 1;
    else if (typeof pain === "string") painCounts[pain] = (painCounts[pain] ?? 0) + 1;
  }
  console.log(`\n=== Top pain_friction (gay/bi, last 15d) ===`);
  for (const [p, c] of Object.entries(painCounts).sort((a,b) => b[1] - a[1]).slice(0, 8)) {
    console.log(`  ${p.padEnd(55)} ${c}  (${(100*c/gayBi.length).toFixed(0)}%)`);
  }
  
  // Past solutions
  const pastCounts: Record<string, number> = {};
  for (const s of gayBi) {
    const past = (s.answers as any)?.past_solutions;
    if (Array.isArray(past)) for (const p of past) pastCounts[p] = (pastCounts[p] ?? 0) + 1;
  }
  console.log(`\n=== Past solutions (gay/bi, last 15d) ===`);
  for (const [p, c] of Object.entries(pastCounts).sort((a,b) => b[1] - a[1])) {
    console.log(`  ${p.padEnd(40)} ${c}  (${(100*c/gayBi.length).toFixed(0)}%)`);
  }
  
  // Dream outcome
  const dreamCounts: Record<string, number> = {};
  for (const s of gayBi) {
    const dream = (s.answers as any)?.dream_outcome;
    if (dream) dreamCounts[String(dream).slice(0, 80)] = (dreamCounts[String(dream).slice(0, 80)] ?? 0) + 1;
  }
  console.log(`\n=== Top dream outcomes (gay/bi, last 15d) ===`);
  for (const [d, c] of Object.entries(dreamCounts).sort((a,b) => b[1] - a[1]).slice(0, 5)) {
    console.log(`  ${c}× ${d}`);
  }
  
  // Weekly time
  const timeCounts: Record<string, number> = {};
  for (const s of gayBi) {
    const t = (s.answers as any)?.weekly_time ?? "—";
    timeCounts[t] = (timeCounts[t] ?? 0) + 1;
  }
  console.log(`\n=== Weekly time (gay/bi, last 15d) ===`);
  for (const [t, c] of Object.entries(timeCounts).sort((a,b) => b[1] - a[1])) {
    console.log(`  ${t.padEnd(25)} ${c}  (${(100*c/gayBi.length).toFixed(0)}%)`);
  }
}
main().catch(e => { console.error(e); process.exit(1); });
