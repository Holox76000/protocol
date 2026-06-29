import { readFileSync } from "fs";
import { resolve } from "path";

const env = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
for (const line of env.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)/);
  if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
}

import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-02-24.acacia" });

const EMAIL = "mattquintanilla@gmail.com";

async function main() {
  const { data: user } = await sb.from("users").select("*").eq("email", EMAIL).maybeSingle();
  console.log("USER:", JSON.stringify(user, null, 2));

  const customers = await stripe.customers.list({ email: EMAIL, limit: 5 });
  console.log("\nSTRIPE CUSTOMERS:", customers.data.length);
  for (const c of customers.data) {
    console.log(`  ${c.id} | created ${new Date(c.created*1000).toISOString()}`);
    const charges = await stripe.charges.list({ customer: c.id, limit: 10 });
    console.log(`    charges: ${charges.data.length}`);
    for (const ch of charges.data) {
      console.log(`      ${ch.id} | ${ch.amount/100} ${ch.currency} | ${ch.status} | ${ch.failure_message || ""} | ${new Date(ch.created*1000).toISOString()}`);
    }
    const pi = await stripe.paymentIntents.list({ customer: c.id, limit: 10 });
    console.log(`    payment intents: ${pi.data.length}`);
    for (const p of pi.data) {
      console.log(`      ${p.id} | ${p.amount/100} ${p.currency} | ${p.status} | ${p.last_payment_error?.message || ""} | ${new Date(p.created*1000).toISOString()}`);
    }
  }
}
main().catch(e => { console.error(e); process.exit(1); });
