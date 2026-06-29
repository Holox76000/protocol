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

function num(v: any): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function computeBMI(a: any): number | null {
  // weight_kg is always in kg (auto-computed from lbs entry by funnel)
  let weightKg = num(a.weight_kg);
  if (!weightKg) return null;
  
  // height_cm if metric, else compute from ft+in
  let heightCm = num(a.height_cm);
  if (!heightCm) {
    const ft = num(a.height_ft);
    const inches = num(a.height_in);
    if (ft) heightCm = ft * 30.48 + (inches ?? 0) * 2.54;
  }
  if (!heightCm || heightCm < 140 || heightCm > 220 || weightKg < 35 || weightKg > 250) return null;
  return weightKg / Math.pow(heightCm / 100, 2);
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
    const bmi = computeBMI(s.answers);
    if (bmi !== null) bmiCount++;
    optinByFamily[classify(bmi)]++;
  }
  
  console.log(`\nOpt-ins gay/bi 15j: ${gayBiOptin.length}`);
  console.log(`Avec BMI computable: ${bmiCount}\n`);
  
  // Paid 15d: classify with same rule
  const PAID_IN_15D = [
    { name: "Sherif",  paid: "2026-06-17", h: 180,  w: 86.6 },
    { name: "DJ",      paid: "2026-06-21", h: 140,  w: 77.1 }, // height data error
    { name: "Peter",   paid: "2026-06-23", h: 178,  w: 97.5 },
    { name: "Kyle",    paid: "2026-06-28", h: 170,  w: 94.3 },
    { name: "Mark",    paid: "2026-06-29", h: 191,  w: 124.7 },
  ];
  const paid15dByFamily: Record<string, number> = { SKINNY: 0, ATHLETIC: 0, "SF/OVERWEIGHT": 0, UNCLASSIFIED: 0 };
  for (const p of PAID_IN_15D) {
    const bmi = p.h && p.w ? p.w / Math.pow(p.h/100, 2) : null;
    const f = classify(bmi);
    paid15dByFamily[f]++;
  }
  
  console.log("╔════════════════════════════════════════════════════════════════════╗");
  console.log("║  TABLE DE CONVERSION — gay/bi opt-ins → paid (15 derniers jours)   ║");
  console.log("║  Règle BMI : <22 = SKINNY · 22-25 = ATHLETIC · ≥25 = SF/OVERWEIGHT ║");
  console.log("╚════════════════════════════════════════════════════════════════════╝\n");
  console.log("  Family            | Opt-ins | Paid 15j | Conv. opt-in → paid");
  console.log("  " + "─".repeat(65));
  for (const f of ["SKINNY", "ATHLETIC", "SF/OVERWEIGHT", "UNCLASSIFIED"]) {
    const o = optinByFamily[f];
    const p = paid15dByFamily[f];
    const conv = o > 0 ? `${(100*p/o).toFixed(1)}%` : "—";
    console.log(`  ${f.padEnd(17)} | ${String(o).padStart(7)} | ${String(p).padStart(8)} | ${conv.padStart(15)}`);
  }
  const totalOptin = gayBiOptin.length;
  const totalPaid = PAID_IN_15D.length;
  console.log("  " + "─".repeat(65));
  console.log(`  ${"TOTAL".padEnd(17)} | ${String(totalOptin).padStart(7)} | ${String(totalPaid).padStart(8)} | ${(100*totalPaid/totalOptin).toFixed(1)}%`);
  
  // Also output the classified (excluding UNCLASSIFIED) view
  const classifiedOptin = optinByFamily.SKINNY + optinByFamily.ATHLETIC + optinByFamily["SF/OVERWEIGHT"];
  const classifiedPaid = paid15dByFamily.SKINNY + paid15dByFamily.ATHLETIC + paid15dByFamily["SF/OVERWEIGHT"];
  console.log(`\n=== Vue classifiée uniquement (excl. UNCLASSIFIED) ===\n`);
  console.log("  Family            | Opt-ins | Paid 15j | Conv. opt-in → paid");
  console.log("  " + "─".repeat(65));
  for (const f of ["SKINNY", "ATHLETIC", "SF/OVERWEIGHT"]) {
    const o = optinByFamily[f];
    const p = paid15dByFamily[f];
    const conv = o > 0 ? `${(100*p/o).toFixed(1)}%` : "—";
    const pct = (100*o/classifiedOptin).toFixed(0);
    console.log(`  ${f.padEnd(17)} | ${String(o).padStart(3)} (${pct}%) | ${String(p).padStart(8)} | ${conv.padStart(15)}`);
  }
  console.log("  " + "─".repeat(65));
  console.log(`  ${"TOTAL classifié".padEnd(17)} | ${String(classifiedOptin).padStart(7)} | ${String(classifiedPaid).padStart(8)} | ${(100*classifiedPaid/classifiedOptin).toFixed(1)}%`);
}
main().catch(e => { console.error(e); process.exit(1); });
