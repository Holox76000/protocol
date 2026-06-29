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
  // 1. Pull paid users
  const { data: users } = await sb.from("users").select("id, email, first_name, paid_at, paid_amount_cents")
    .eq("has_paid", true).order("paid_at", { ascending: true });
  
  const paid89 = (users ?? []).filter(u => u.paid_amount_cents === 8900 && !isInternal(u.email ?? ""));
  console.log(`Total paid $89 users: ${paid89.length}\n`);
  
  // 2. For each, fetch questionnaire_responses
  const profiles: any[] = [];
  for (const u of paid89) {
    const { data: qr } = await sb.from("questionnaire_responses").select("*").eq("user_id", u.id).maybeSingle();
    if (qr) {
      profiles.push({
        paid_at: (u.paid_at as string).slice(0, 10),
        email: u.email,
        first_name: u.first_name,
        orientation: (qr as any).sexual_orientation ?? "—",
        morphology: (qr as any).morphology ?? "—",
        age_bracket: (qr as any).age_bracket ?? "—",
        weekly_time: (qr as any).weekly_time ?? "—",
        height: (qr as any).height_cm ?? "—",
        weight: (qr as any).weight_kg ?? "—",
        pain: (qr as any).pain_friction ?? null,
        past: (qr as any).past_solutions ?? null,
        dream: (qr as any).dream_outcome ?? null,
      });
    } else {
      profiles.push({
        paid_at: (u.paid_at as string).slice(0, 10),
        email: u.email,
        first_name: u.first_name,
        orientation: "(no qr)",
      });
    }
  }
  
  console.log("=== ALL PAID PROFILES (chronological) ===\n");
  for (const p of profiles) {
    console.log(`  ${p.paid_at}  ${(p.email ?? "—").padEnd(36)} ${(p.orientation ?? "—").padEnd(20)} ${(p.morphology ?? "—").padEnd(14)} ${(p.age_bracket ?? "—").padEnd(8)} ${(p.weekly_time ?? "—").padEnd(20)}`);
  }
  
  // Orientation distribution
  const orientCounts: Record<string, number> = {};
  for (const p of profiles) orientCounts[p.orientation] = (orientCounts[p.orientation] ?? 0) + 1;
  console.log("\n=== Orientation distribution ===");
  for (const [o, c] of Object.entries(orientCounts).sort((a,b) => b[1] - a[1])) {
    console.log(`  ${o.padEnd(20)} ${c}  (${(100*c/profiles.length).toFixed(0)}%)`);
  }
  
  // Gay + Bi specifically
  const gayBi = profiles.filter(p => ["Gay", "Bisexual", "gay", "bisexual"].includes(p.orientation));
  console.log(`\n=== Confirmed Gay/Bi paid customers: ${gayBi.length} ===\n`);
  for (const p of gayBi) {
    console.log(`  ${p.paid_at}  ${p.email}  ${p.orientation}  ${p.morphology} ${p.age_bracket} ${p.weekly_time}`);
    if (p.pain) console.log(`    pain: ${JSON.stringify(p.pain)}`);
    if (p.past) console.log(`    past: ${JSON.stringify(p.past)}`);
    if (p.dream) console.log(`    dream: ${p.dream?.slice(0,100)}`);
  }
}
main().catch(e => { console.error(e); process.exit(1); });
