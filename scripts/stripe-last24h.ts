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
  // Last 30h
  const start = Math.floor(Date.now()/1000) - 30*3600;
  const sessions = await stripe.checkout.sessions.list({ created: { gte: start }, limit: 100 });
  console.log(`\n=== Stripe Checkout Sessions last 30h: ${sessions.data.length} ===\n`);
  for (const s of sessions.data) {
    const created = new Date(s.created * 1000).toISOString();
    const email = s.customer_details?.email ?? s.customer_email ?? "—";
    console.log(`  ${created}  status=${s.status}/${s.payment_status}  email=${email}  pi=${(s.payment_intent as string ?? "—").slice(-12)}`);
  }
  
  const pis = await stripe.paymentIntents.list({ created: { gte: start }, limit: 100 });
  console.log(`\n=== PaymentIntents last 30h: ${pis.data.length} ===\n`);
  for (const pi of pis.data) {
    const created = new Date(pi.created * 1000).toISOString();
    const md = pi.metadata as any;
    console.log(`  ${created}  ${pi.id.slice(-12)}  status=${pi.status}  $${(pi.amount ?? 0)/100}  email=${(pi as any).receipt_email ?? "—"}  funnel_sid=${(md?.funnel_sid ?? "—").slice(0,8)}`);
  }
}
main().catch(e => { console.error(e); process.exit(1); });
