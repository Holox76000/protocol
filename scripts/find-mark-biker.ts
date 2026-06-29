import { readFileSync } from "fs";
import { resolve } from "path";
const env = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
for (const line of env.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)/);
  if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
}
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-04-10" as any });

async function main() {
  // Pull last 7 days of Stripe PIs
  const since = Math.floor(Date.now()/1000) - 7*86400;
  const list = await stripe.paymentIntents.list({ created: { gte: since }, limit: 100 });
  console.log(`Last 7 days PIs: ${list.data.length}`);
  for (const pi of list.data) {
    const date = new Date(pi.created*1000).toISOString();
    const email = (pi as any).receipt_email ?? "—";
    console.log(`  ${date}  $${(pi.amount/100).toFixed(2)}  ${pi.status.padEnd(28)} ${email}`);
  }
  
  // Find Mark in users
  console.log(`\n=== Search users with email containing 'mark' OR 'biker' ===`);
  const { data: users1 } = await sb.from("users").select("*").ilike("email", "%mark%");
  const { data: users2 } = await sb.from("users").select("*").ilike("email", "%biker%");
  const matches = [...(users1 ?? []), ...(users2 ?? [])].filter((u, i, arr) => arr.findIndex(x => x.email === u.email) === i);
  for (const u of matches) {
    console.log(`\nuser: ${u.email}  first_name=${u.first_name}  has_paid=${u.has_paid}  paid_at=${u.paid_at}  amount=${u.paid_amount_cents}`);
    const { data: qr } = await sb.from("questionnaire_responses").select("*").eq("user_id", u.id).maybeSingle();
    if (qr) {
      const q = qr as any;
      console.log(`  qr.sexual_orientation: ${q.sexual_orientation}`);
      console.log(`  qr.age: ${q.age}`);
      console.log(`  qr.height_cm: ${q.height_cm}  weight_kg: ${q.weight_kg}`);
      console.log(`  qr.training_consistency: ${q.training_consistency}`);
      console.log(`  qr.concern_areas: ${JSON.stringify(q.concern_areas)}`);
      console.log(`  qr.professional_environment: ${q.professional_environment}`);
      console.log(`  qr.coach_notes: ${(q.coach_notes ?? "").slice(0, 300)}`);
    } else {
      console.log(`  (no qr)`);
    }
  }
}
main().catch(e => { console.error(e); process.exit(1); });
