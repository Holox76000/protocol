import { readFileSync } from "fs";
import { resolve } from "path";
const env = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
for (const line of env.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)/);
  if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
}
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-04-10" as any });

async function main() {
  const start = Math.floor(new Date("2026-06-28T00:00:00Z").getTime() / 1000);
  const sessions = await stripe.checkout.sessions.list({ created: { gte: start }, limit: 100 });
  console.log(`\n=== Stripe Checkout Sessions today: ${sessions.data.length} ===\n`);
  for (const s of sessions.data) {
    const created = new Date(s.created * 1000).toISOString();
    const email = s.customer_details?.email ?? s.customer_email ?? "—";
    console.log(`  ${created}  id=${s.id.slice(-12)}  status=${s.status}/${s.payment_status}  email=${email}  amount=$${(s.amount_total ?? 0)/100}  url_visited=?`);
    // Check metadata for funnel_sid
    if (s.metadata) console.log(`    meta: ${JSON.stringify(s.metadata)}`);
  }
  
  // Payment intents that show form interaction
  const pis = await stripe.paymentIntents.list({ created: { gte: start }, limit: 100 });
  console.log(`\n=== Stripe PaymentIntents today: ${pis.data.length} ===\n`);
  for (const pi of pis.data) {
    const created = new Date(pi.created * 1000).toISOString();
    console.log(`  ${created}  id=${pi.id.slice(-12)}  status=${pi.status}  amount=$${(pi.amount ?? 0)/100}  email=${(pi as any).receipt_email ?? "—"}`);
  }
}
main().catch(e => { console.error(e); process.exit(1); });
