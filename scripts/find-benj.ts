import { readFileSync } from "fs";
import { resolve } from "path";
const env = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
for (const line of env.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)/);
  if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
}
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

async function main() {
  const email = "benj.brees@gmail.com";
  console.log(`Searching for ${email}\n`);
  
  // 1. users table (any state)
  const { data: u } = await sb.from("users").select("*").ilike("email", email);
  console.log(`users: ${u?.length ?? 0} rows`);
  if (u?.[0]) {
    console.log(`  id=${u[0].id}  has_paid=${u[0].has_paid}  paid_at=${u[0].paid_at}  amount=${u[0].paid_amount_cents}`);
  }
  
  // 2. questionnaire_responses — search by user_id from users, or any column matching email
  if (u?.[0]) {
    const { data: qr } = await sb.from("questionnaire_responses").select("*").eq("user_id", u[0].id);
    console.log(`\nquestionnaire_responses for user_id ${u[0].id}: ${qr?.length ?? 0} rows`);
    if (qr?.[0]) {
      console.log(`  FULL JSON:`);
      console.log(JSON.stringify(qr[0], null, 2));
    }
  }
  
  // 3. Now let's also do the FULL paid-customer search by joining users (regardless of has_paid)
  console.log(`\n\n=== Re-run paid analysis: include all users with paid_at NOT NULL (not just has_paid=true) ===\n`);
  const { data: paidUsers } = await sb.from("users").select("id, email, first_name, paid_at, paid_amount_cents, has_paid")
    .not("paid_at", "is", null).order("paid_at", { ascending: true });
  console.log(`Users with paid_at: ${paidUsers?.length ?? 0}`);
  
  const INTERNAL = ["patrypierreandre","sofiane.lekfif","sofiane@reddotgrowth","thibault.cdn","reddotgrowth"];
  const isInternal = (e: string) => INTERNAL.some(p => (e ?? "").toLowerCase().includes(p));
  const external = (paidUsers ?? []).filter(u => !isInternal(u.email ?? ""));
  console.log(`External: ${external.length}\n`);
  
  for (const usr of external) {
    const { data: qr } = await sb.from("questionnaire_responses").select("sexual_orientation, morphology, age_bracket, weekly_time").eq("user_id", usr.id).maybeSingle();
    const orient = qr?.sexual_orientation ?? "(no qr)";
    const morph = qr?.morphology ?? "—";
    const age = qr?.age_bracket ?? "—";
    const time = qr?.weekly_time ?? "—";
    const status = usr.has_paid ? "✓" : "·";
    console.log(`  ${status}  ${(usr.paid_at as string).slice(0,10)}  $${(usr.paid_amount_cents ?? 0)/100}  ${(usr.email ?? "—").padEnd(36)} ${orient.padEnd(14)} ${morph.padEnd(14)} ${age.padEnd(8)} ${time}`);
  }
}
main().catch(e => { console.error(e); process.exit(1); });
