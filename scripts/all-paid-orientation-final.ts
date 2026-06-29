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
  // ALL users with paid_at NOT NULL (any amount, includes $0 from older bug)
  const { data: paidUsers } = await sb.from("users").select("id, email, first_name, paid_at, paid_amount_cents")
    .not("paid_at", "is", null).order("paid_at", { ascending: true });
  
  const external = (paidUsers ?? []).filter(u => !isInternal(u.email ?? ""));
  console.log(`Total paid users (external): ${external.length}\n`);
  
  const profiles: any[] = [];
  for (const u of external) {
    // Sequential per user to avoid any oddness with promises
    const result = await sb.from("questionnaire_responses").select("*").eq("user_id", u.id).maybeSingle();
    const qr = result.data as any;
    profiles.push({
      paid_at: (u.paid_at as string).slice(0, 10),
      email: u.email,
      orientation: qr?.sexual_orientation ?? "—",
      morphology: qr?.morphology ?? "—",
      age_bracket: qr?.age_bracket ?? "—",
      weekly_time: qr?.weekly_time ?? "—",
      ethnicity: qr?.ethnicity ?? "—",
      pain_friction: qr?.pain_friction ?? null,
      past_solutions: qr?.past_solutions ?? null,
      dream_outcome: qr?.dream_outcome ?? null,
      qr_status: qr?.status ?? "—",
    });
  }
  
  console.log("=== ALL PAID PROFILES ===\n");
  console.log("date        email                                orientation    morpho         age      time");
  console.log("-".repeat(110));
  for (const p of profiles) {
    console.log(`${p.paid_at}  ${(p.email ?? "—").padEnd(36)} ${(p.orientation ?? "—").padEnd(14)} ${(p.morphology ?? "—").padEnd(14)} ${(p.age_bracket ?? "—").padEnd(8)} ${p.weekly_time}`);
  }
  
  // Orientation distribution
  console.log(`\n=== Orientation distribution (N=${profiles.length}) ===`);
  const orientCounts: Record<string, number> = {};
  for (const p of profiles) orientCounts[p.orientation] = (orientCounts[p.orientation] ?? 0) + 1;
  for (const [o, c] of Object.entries(orientCounts).sort((a,b) => b[1] - a[1])) {
    console.log(`  ${o.padEnd(20)} ${c}  (${(100*c/profiles.length).toFixed(0)}%)`);
  }
  
  // Of those with known orientation
  const known = profiles.filter(p => p.orientation !== "—");
  const gayBi = profiles.filter(p => ["gay", "bisexual"].includes(p.orientation));
  const straight = profiles.filter(p => p.orientation === "straight");
  console.log(`\n=== Among ${known.length} with known orientation ===`);
  console.log(`  Gay/Bi:   ${gayBi.length} (${(100*gayBi.length/known.length).toFixed(0)}%)`);
  console.log(`  Straight: ${straight.length} (${(100*straight.length/known.length).toFixed(0)}%)`);
  
  // Detail of gay/bi
  console.log(`\n=== Gay/Bi paid customers in detail ===`);
  for (const p of gayBi) {
    console.log(`\n  ${p.paid_at}  ${p.email}  (${p.orientation})`);
    console.log(`    morphology: ${p.morphology}  age: ${p.age_bracket}  ethnicity: ${p.ethnicity}  time: ${p.weekly_time}`);
    if (p.pain_friction) console.log(`    pain: ${JSON.stringify(p.pain_friction)}`);
    if (p.past_solutions) console.log(`    past: ${JSON.stringify(p.past_solutions)}`);
    if (p.dream_outcome) console.log(`    dream: ${typeof p.dream_outcome === "string" ? p.dream_outcome.slice(0,200) : JSON.stringify(p.dream_outcome).slice(0,200)}`);
  }
}
main().catch(e => { console.error(e); process.exit(1); });
