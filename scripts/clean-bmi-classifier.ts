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

function classifyByBMI(heightCm: number | null, weightKg: number | null): string {
  if (!heightCm || !weightKg || heightCm < 140 || heightCm > 220 || weightKg < 35 || weightKg > 200) return "UNCLASSIFIED";
  const bmi = weightKg / Math.pow(heightCm / 100, 2);
  if (bmi < 22) return "SKINNY";
  if (bmi < 25) return "ATHLETIC";
  return "SF/OVERWEIGHT";
}

async function main() {
  const since = new Date(Date.now() - 15*86400000).toISOString();
  
  // ==== OPT-INS ====
  const { data: sessions } = await sb.from("funnel_sessions").select("session_id, answers, created_at")
    .gte("created_at", since).order("created_at");
  const gayBiOptin = (sessions ?? []).filter(s => {
    const a = s.answers as any;
    const o = String(a?.sexual_orientation ?? "").toLowerCase();
    return ["gay","bisexual"].includes(o) && !isInternal(a?.email ?? "") && a?.email;
  });
  
  const optinByFamily: Record<string, number> = { SKINNY: 0, ATHLETIC: 0, "SF/OVERWEIGHT": 0, UNCLASSIFIED: 0 };
  for (const s of gayBiOptin) {
    const a = s.answers as any;
    const family = classifyByBMI(a?.height_cm, a?.weight_kg);
    optinByFamily[family]++;
  }
  
  console.log(`\n=== Opt-ins gay/bi last 15d (classified by BMI) ===`);
  console.log(`Total: ${gayBiOptin.length}\n`);
  for (const [f, n] of Object.entries(optinByFamily)) {
    const pct = (100*n/gayBiOptin.length).toFixed(0);
    console.log(`  ${f.padEnd(20)} ${String(n).padStart(3)}  (${pct}%)`);
  }
  
  // ==== PAID ====
  // The 7 confirmed gay/bi paid customers
  const paidProfiles: any[] = [
    { name: "Benjamin Brees", email: "benj.brees@gmail.com", paid: "2026-04-18", in15d: false },
    { name: "Stephen Tomac", email: "stephen.tomac@gmail.com", paid: "2026-06-06", in15d: false },
    { name: "Sherif Haikal", email: "sherif.haikal@gmail.com", paid: "2026-06-17", in15d: true },
    { name: "DJ", email: "dj@djcap.net", paid: "2026-06-21", in15d: true },
    { name: "Peter (higpeter)", email: "higpeter@gmail.com", paid: "2026-06-23", in15d: true },
    { name: "Kyle Vernor", email: "kyle.k.vernor@gmail.com", paid: "2026-06-28", in15d: true },
    { name: "Mark Biker-Bears", email: "mark@bikerbears.net", paid: "2026-06-29", in15d: true },
  ];
  
  for (const p of paidProfiles) {
    const { data: u } = await sb.from("users").select("id").ilike("email", p.email).maybeSingle();
    if (!u) { p.height = null; p.weight = null; continue; }
    const { data: qr } = await sb.from("questionnaire_responses").select("height_cm, weight_kg").eq("user_id", u.id).maybeSingle();
    p.height = qr?.height_cm ?? null;
    p.weight = qr?.weight_kg ?? null;
    p.bmi = p.height && p.weight ? (p.weight / Math.pow(p.height/100, 2)) : null;
    p.family = classifyByBMI(p.height, p.weight);
  }
  
  console.log(`\n=== Paid gay/bi (BMI-classified) ===\n`);
  console.log("Client                date         h(cm)  w(kg)  BMI    family");
  console.log("─".repeat(80));
  for (const p of paidProfiles) {
    const bmiStr = p.bmi ? p.bmi.toFixed(1) : "—";
    console.log(`${p.name.padEnd(22)} ${p.paid}  ${String(p.height ?? "—").padStart(5)}  ${String(p.weight ?? "—").padStart(5)}  ${bmiStr.padStart(5)}  ${p.family}`);
  }
  
  // Conversion table
  const paid15dByFamily: Record<string, number> = { SKINNY: 0, ATHLETIC: 0, "SF/OVERWEIGHT": 0, UNCLASSIFIED: 0 };
  for (const p of paidProfiles) if (p.in15d) paid15dByFamily[p.family]++;
  
  console.log(`\n═══════════════════════════════════════════════════════`);
  console.log(`CONVERSION TABLE (15 jours, gay/bi)`);
  console.log(`═══════════════════════════════════════════════════════`);
  console.log("Family            | Opt-ins | Paid 15j | Conv. opt-in→paid");
  console.log("─".repeat(60));
  for (const f of ["SKINNY", "ATHLETIC", "SF/OVERWEIGHT", "UNCLASSIFIED"]) {
    const o = optinByFamily[f];
    const p = paid15dByFamily[f];
    const conv = o > 0 ? `${(100*p/o).toFixed(1)}%` : "—";
    console.log(`  ${f.padEnd(15)} | ${String(o).padStart(7)} | ${String(p).padStart(8)} | ${conv.padStart(10)}`);
  }
  const totalOptin = Object.values(optinByFamily).reduce((a,b) => a+b, 0);
  const totalPaid = Object.values(paid15dByFamily).reduce((a,b) => a+b, 0);
  console.log(`  ${"TOTAL".padEnd(15)} | ${String(totalOptin).padStart(7)} | ${String(totalPaid).padStart(8)} | ${(100*totalPaid/totalOptin).toFixed(1)}%`);
}
main().catch(e => { console.error(e); process.exit(1); });
