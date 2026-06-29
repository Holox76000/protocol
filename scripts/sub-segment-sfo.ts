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
const num = (v: any) => { if (v === null || v === undefined || v === "") return null; const n = Number(v); return Number.isFinite(n) ? n : null; };

function computeBMI(a: any): number | null {
  let weightKg = num(a?.weight_kg);
  if (!weightKg) return null;
  let heightCm = num(a?.height_cm);
  if (!heightCm) {
    const ft = num(a?.height_ft), inches = num(a?.height_in);
    if (ft) heightCm = ft * 30.48 + (inches ?? 0) * 2.54;
  }
  if (!heightCm || heightCm < 140 || heightCm > 220 || weightKg < 35 || weightKg > 250) return null;
  return weightKg / Math.pow(heightCm / 100, 2);
}

function bmiBracket(bmi: number): string {
  if (bmi < 25) return "—";
  if (bmi < 28) return "Mild 25-28";
  if (bmi < 32) return "Moderate 28-32";
  return "Severe 32+";
}

async function main() {
  const since = new Date(Date.now() - 15*86400000).toISOString();
  const { data: sessions } = await sb.from("funnel_sessions").select("session_id, answers, created_at")
    .gte("created_at", since).order("created_at");
  const sfo = (sessions ?? []).filter(s => {
    const a = s.answers as any;
    const o = String(a?.sexual_orientation ?? "").toLowerCase();
    if (!["gay","bisexual"].includes(o) || isInternal(a?.email ?? "") || !a?.email) return false;
    const bmi = computeBMI(a);
    return bmi !== null && bmi >= 25;
  });
  
  console.log(`\nSF/OVERWEIGHT gay/bi opt-ins (15j): ${sfo.length}`);
  
  // Paid 15d in SF/Overweight (we know all 5 are here)
  const PAID = [
    { name: "Sherif",  bmi: 26.7, age: 42, morphology_self: null,        weekly: "Inconsistent",   pain: ["Chest","Waist","Posture"] },
    { name: "DJ",      bmi: 39.3, age: 38, morphology_self: null,        weekly: "Mostly",         pain: ["Softness","Waist"] },
    { name: "Peter",   bmi: 30.8, age: 39, morphology_self: "Average",   weekly: "3 to 5 hours",   pain: ["Softness","Waist"] },
    { name: "Kyle",    bmi: 32.6, age: 34, morphology_self: "Overweight",weekly: "Zero effort",    pain: ["Chest","Waist","Softness"] },
    { name: "Mark",    bmi: 34.2, age: 64, morphology_self: null,        weekly: null,             pain: [] },
  ];
  
  // ==== Sub-segment 1: BMI severity ====
  console.log(`\n═══ SOUS-SEGMENT 1 : Sévérité BMI ═══`);
  const bmiSeverityOptin: Record<string, number> = { "Mild 25-28": 0, "Moderate 28-32": 0, "Severe 32+": 0 };
  for (const s of sfo) {
    const bmi = computeBMI(s.answers)!;
    bmiSeverityOptin[bmiBracket(bmi)]++;
  }
  const bmiSeverityPaid: Record<string, number> = { "Mild 25-28": 0, "Moderate 28-32": 0, "Severe 32+": 0 };
  for (const p of PAID) bmiSeverityPaid[bmiBracket(p.bmi)]++;
  console.log("Bracket           | Opt-ins | Paid | Conv. | %paid")
  console.log("─".repeat(60));
  for (const k of Object.keys(bmiSeverityOptin)) {
    const o = bmiSeverityOptin[k], p = bmiSeverityPaid[k];
    console.log(`  ${k.padEnd(18)} | ${String(o).padStart(7)} | ${String(p).padStart(4)} | ${o ? (100*p/o).toFixed(1)+"%" : "—"}`);
  }
  
  // ==== Sub-segment 2: Age bracket ====
  console.log(`\n═══ SOUS-SEGMENT 2 : Age bracket ═══`);
  const ageBands: Record<string, number> = { "20–29": 0, "30–39": 0, "40–49": 0, "50+": 0, "—": 0 };
  for (const s of sfo) {
    const age = (s.answers as any).age_bracket ?? "—";
    if (!(age in ageBands)) ageBands["—"]++; else ageBands[age]++;
  }
  const agePaid: Record<string, number> = { "20–29": 0, "30–39": 0, "40–49": 0, "50+": 0 };
  for (const p of PAID) {
    if (p.age < 30) agePaid["20–29"]++;
    else if (p.age < 40) agePaid["30–39"]++;
    else if (p.age < 50) agePaid["40–49"]++;
    else agePaid["50+"]++;
  }
  console.log("Age          | Opt-ins | Paid | Conv.")
  console.log("─".repeat(50));
  for (const k of ["20–29","30–39","40–49","50+"]) {
    const o = ageBands[k], p = agePaid[k] ?? 0;
    console.log(`  ${k.padEnd(11)} | ${String(o).padStart(7)} | ${String(p).padStart(4)} | ${o ? (100*p/o).toFixed(1)+"%" : "—"}`);
  }
  
  // ==== Sub-segment 3: Self-reported morphology ====
  console.log(`\n═══ SOUS-SEGMENT 3 : Self-reported morphology ═══`);
  const morphSelf: Record<string, number> = { "Skinny-fat": 0, "Overweight": 0, "Average": 0, "Skinny": 0, "—": 0 };
  for (const s of sfo) {
    const m = (s.answers as any).morphology ?? "—";
    if (!(m in morphSelf)) morphSelf["—"]++; else morphSelf[m]++;
  }
  const morphPaid: Record<string, number> = { "Skinny-fat": 0, "Overweight": 0, "Average": 0, "—": 0 };
  for (const p of PAID) {
    morphPaid[p.morphology_self ?? "—"] = (morphPaid[p.morphology_self ?? "—"] ?? 0) + 1;
  }
  console.log("Morpho perçue   | Opt-ins | Paid | Conv.")
  console.log("─".repeat(55));
  for (const k of ["Skinny-fat", "Overweight", "Average", "Skinny"]) {
    const o = morphSelf[k], p = morphPaid[k] ?? 0;
    console.log(`  ${k.padEnd(14)} | ${String(o).padStart(7)} | ${String(p).padStart(4)} | ${o ? (100*p/o).toFixed(1)+"%" : "—"}`);
  }
  console.log(`  ${"(unknown)".padEnd(14)} | ${String(morphSelf["—"]).padStart(7)} | ${String(morphPaid["—"]).padStart(4)} | ${morphSelf["—"] ? (100*morphPaid["—"]/morphSelf["—"]).toFixed(1)+"%" : "—"}`);
  
  // ==== Sub-segment 4: Weekly training ====
  console.log(`\n═══ SOUS-SEGMENT 4 : Training weekly ═══`);
  const trainBands: Record<string, number> = { "Zero effort right now": 0, "Less than 1 hour": 0, "1 to 3 hours": 0, "3 to 5 hours": 0, "More than 5 hours": 0, "—": 0 };
  for (const s of sfo) {
    const t = (s.answers as any).weekly_time ?? "—";
    if (!(t in trainBands)) trainBands["—"]++; else trainBands[t]++;
  }
  console.log("Train/sem            | Opt-ins")
  console.log("─".repeat(45));
  for (const k of Object.keys(trainBands)) {
    const o = trainBands[k];
    if (o > 0) console.log(`  ${k.padEnd(20)} | ${String(o).padStart(7)}`);
  }
  
  // ==== Cross-tab: BMI severity × Age ====
  console.log(`\n═══ CROSS-TAB : BMI × Age (gay/bi SF/OW opt-ins) ═══`);
  const xtab: Record<string, Record<string, number>> = {};
  for (const s of sfo) {
    const a = s.answers as any;
    const bmi = computeBMI(a)!;
    const sev = bmiBracket(bmi);
    const age = a.age_bracket ?? "—";
    xtab[sev] = xtab[sev] ?? {};
    xtab[sev][age] = (xtab[sev][age] ?? 0) + 1;
  }
  console.log("                  | 20–29 | 30–39 | 40–49 | 50+ | —");
  console.log("─".repeat(60));
  for (const sev of ["Mild 25-28","Moderate 28-32","Severe 32+"]) {
    const row = xtab[sev] ?? {};
    console.log(`  ${sev.padEnd(16)} | ${String(row["20–29"] ?? 0).padStart(5)} | ${String(row["30–39"] ?? 0).padStart(5)} | ${String(row["40–49"] ?? 0).padStart(5)} | ${String(row["50+"] ?? 0).padStart(3)} | ${String(row["—"] ?? 0).padStart(2)}`);
  }
  
  // Same for paid
  console.log("\nPayants (5) dans la même matrice :");
  console.log("                  | 20–29 | 30–39 | 40–49 | 50+");
  const xtabPaid: Record<string, Record<string, number>> = {};
  for (const p of PAID) {
    const sev = bmiBracket(p.bmi);
    const ageBand = p.age < 30 ? "20–29" : p.age < 40 ? "30–39" : p.age < 50 ? "40–49" : "50+";
    xtabPaid[sev] = xtabPaid[sev] ?? {};
    xtabPaid[sev][ageBand] = (xtabPaid[sev][ageBand] ?? 0) + 1;
  }
  for (const sev of ["Mild 25-28","Moderate 28-32","Severe 32+"]) {
    const row = xtabPaid[sev] ?? {};
    console.log(`  ${sev.padEnd(16)} | ${String(row["20–29"] ?? 0).padStart(5)} | ${String(row["30–39"] ?? 0).padStart(5)} | ${String(row["40–49"] ?? 0).padStart(5)} | ${String(row["50+"] ?? 0).padStart(3)}`);
  }
}
main().catch(e => { console.error(e); process.exit(1); });
