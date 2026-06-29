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

function getBMI(a: any): { bmi: number | null; height: number | null; weight: number | null } {
  let heightCm: number | null = null;
  let weightKg: number | null = null;
  
  // Height
  if (typeof a.height_cm === "number" && a.height_cm > 0) heightCm = a.height_cm;
  else if (typeof a.height_ft === "number" && typeof a.height_in === "number") {
    heightCm = a.height_ft * 30.48 + a.height_in * 2.54;
  } else if (typeof a.height_ft === "number") heightCm = a.height_ft * 30.48;
  
  // Weight
  if (typeof a.weight_kg === "number" && a.weight_kg > 0) weightKg = a.weight_kg;
  else if (typeof a.weight_lbs === "number" && a.weight_lbs > 0) weightKg = a.weight_lbs * 0.453592;
  
  if (!heightCm || !weightKg || heightCm < 140 || heightCm > 220 || weightKg < 35 || weightKg > 250) return { bmi: null, height: heightCm, weight: weightKg };
  return { bmi: weightKg / Math.pow(heightCm / 100, 2), height: heightCm, weight: weightKg };
}

function classify(bmi: number | null): string {
  if (bmi === null) return "UNCLASSIFIED";
  if (bmi < 22) return "SKINNY";
  if (bmi < 25) return "ATHLETIC";
  return "SF/OVERWEIGHT";
}

async function main() {
  const since = new Date(Date.now() - 15*86400000).toISOString();
  
  const { data: sessions } = await sb.from("funnel_sessions").select("session_id, answers, created_at")
    .gte("created_at", since).order("created_at");
  const gayBiOptin = (sessions ?? []).filter(s => {
    const a = s.answers as any;
    const o = String(a?.sexual_orientation ?? "").toLowerCase();
    return ["gay","bisexual"].includes(o) && !isInternal(a?.email ?? "") && a?.email;
  });
  
  const optinByFamily: Record<string, number> = { SKINNY: 0, ATHLETIC: 0, "SF/OVERWEIGHT": 0, UNCLASSIFIED: 0 };
  let bmiCount = 0;
  for (const s of gayBiOptin) {
    const a = s.answers as any;
    const { bmi } = getBMI(a);
    if (bmi !== null) bmiCount++;
    optinByFamily[classify(bmi)]++;
  }
  
  console.log(`\nTotal opt-ins gay/bi 15j: ${gayBiOptin.length}`);
  console.log(`With computable BMI: ${bmiCount}`);
  console.log(`\nDistribution:`);
  for (const [f, n] of Object.entries(optinByFamily)) {
    const pct = (100*n/gayBiOptin.length).toFixed(0);
    console.log(`  ${f.padEnd(20)} ${String(n).padStart(3)}  (${pct}%)`);
  }
  
  // Paid (7 confirmed) — all are SF/OVERWEIGHT per first run
  const paidIn15d = [
    { name: "Sherif", paid: "2026-06-17", family: "SF/OVERWEIGHT", bmi: 26.7 },
    { name: "DJ",     paid: "2026-06-21", family: "SF/OVERWEIGHT", bmi: 39.3 },
    { name: "Peter",  paid: "2026-06-23", family: "SF/OVERWEIGHT", bmi: 30.8 },
    { name: "Kyle",   paid: "2026-06-28", family: "SF/OVERWEIGHT", bmi: 32.6 },
    { name: "Mark",   paid: "2026-06-29", family: "SF/OVERWEIGHT", bmi: 34.2 },
  ];
  const paid15dByFamily: Record<string, number> = { SKINNY: 0, ATHLETIC: 0, "SF/OVERWEIGHT": 0, UNCLASSIFIED: 0 };
  for (const p of paidIn15d) paid15dByFamily[p.family]++;
  
  console.log(`\n═══════════════════════════════════════════════════════════════`);
  console.log(`CONVERSION TABLE — gay/bi opt-ins → paid (15 derniers jours)`);
  console.log(`═══════════════════════════════════════════════════════════════`);
  console.log("Family            | Opt-ins | Paid 15j | Conv. opt-in→paid");
  console.log("──────────────────────────────────────────────────────────────");
  for (const f of ["SKINNY", "ATHLETIC", "SF/OVERWEIGHT", "UNCLASSIFIED"]) {
    const o = optinByFamily[f];
    const p = paid15dByFamily[f];
    const conv = o > 0 ? `${(100*p/o).toFixed(1)}%` : "—";
    console.log(`  ${f.padEnd(15)} | ${String(o).padStart(7)} | ${String(p).padStart(8)} | ${conv.padStart(10)}`);
  }
  const totalOptin = gayBiOptin.length;
  const totalPaid = paidIn15d.length;
  console.log("──────────────────────────────────────────────────────────────");
  console.log(`  ${"TOTAL".padEnd(15)} | ${String(totalOptin).padStart(7)} | ${String(totalPaid).padStart(8)} | ${(100*totalPaid/totalOptin).toFixed(1)}%`);
}
main().catch(e => { console.error(e); process.exit(1); });
