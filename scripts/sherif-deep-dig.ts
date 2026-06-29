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
  const email = "sherif.haikal@gmail.com";
  
  console.log("=== SUPABASE: list all tables I have access to ===");
  // Try to list known tables
  const knownTables = ["funnel_sessions", "leads", "users", "event_sessions", "questionnaire_responses", "visualization_previews", "client_messages", "clients", "customers", "intake", "intake_responses"];
  
  for (const table of knownTables) {
    try {
      const { data, error, count } = await sb.from(table).select("*", { count: "exact", head: true });
      if (error) {
        if (!error.message.includes("does not exist")) console.log(`  ${table}: error → ${error.message.slice(0,60)}`);
      } else {
        console.log(`  ${table}: ${count} rows`);
      }
    } catch {}
  }
  
  console.log(`\n=== Search for ${email} across all tables ===\n`);
  
  // 1. funnel_sessions
  const { data: fs } = await sb.from("funnel_sessions").select("*").ilike("answers->>email", email);
  console.log(`funnel_sessions: ${fs?.length ?? 0} rows`);
  for (const r of fs ?? []) {
    console.log(`  created: ${r.created_at}`);
    console.log(`  answers keys: ${Object.keys(r.answers ?? {}).join(", ")}`);
    console.log(`  full answers: ${JSON.stringify(r.answers, null, 2).slice(0, 1500)}`);
  }
  
  // 2. leads
  const { data: leads } = await sb.from("leads").select("*").ilike("payload->>email", email);
  console.log(`\nleads: ${leads?.length ?? 0} rows`);
  for (const r of leads ?? []) {
    console.log(`  created: ${r.created_at}`);
    console.log(`  payload: ${JSON.stringify(r.payload, null, 2).slice(0, 2000)}`);
  }
  
  // 3. users
  const { data: users } = await sb.from("users").select("*").ilike("email", email);
  console.log(`\nusers: ${users?.length ?? 0} rows`);
  for (const r of users ?? []) console.log(`  ${JSON.stringify(r, null, 2).slice(0, 1500)}`);
  
  // 4. questionnaire_responses
  try {
    const { data: qr } = await sb.from("questionnaire_responses").select("*").ilike("email", email);
    console.log(`\nquestionnaire_responses: ${qr?.length ?? 0} rows`);
    for (const r of qr ?? []) console.log(`  ${JSON.stringify(r, null, 2).slice(0, 2000)}`);
  } catch (e) { console.log(`questionnaire_responses error: ${e}`); }
  
  // 5. Stripe customer
  console.log(`\n=== STRIPE customer ===`);
  const customers = await stripe.customers.list({ email, limit: 10 });
  for (const c of customers.data) {
    console.log(`  Customer ${c.id}: name=${c.name}`);
    console.log(`  metadata: ${JSON.stringify(c.metadata)}`);
    console.log(`  description: ${c.description ?? "—"}`);
  }
  
  // 6. Stripe PaymentIntent metadata
  const PIs = await stripe.paymentIntents.search({ query: `metadata['email']:'${email}' OR receipt_email:'${email}'`, limit: 5 });
  console.log(`\nStripe PIs found: ${PIs.data.length}`);
  for (const pi of PIs.data) {
    console.log(`  ${pi.id} created=${new Date(pi.created*1000).toISOString()} amount=$${pi.amount/100}`);
    console.log(`  metadata: ${JSON.stringify(pi.metadata)}`);
  }
  
  // 7. Stripe Checkout Sessions
  try {
    const cs = await stripe.checkout.sessions.search({ query: `metadata['email']:'${email}'`, limit: 5 });
    console.log(`\nStripe Checkout Sessions: ${cs.data.length}`);
    for (const s of cs.data) {
      console.log(`  ${s.id} metadata: ${JSON.stringify(s.metadata)}`);
    }
  } catch (e) {}
}
main().catch(e => { console.error(e); process.exit(1); });
