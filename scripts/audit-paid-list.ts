import { readFileSync } from "fs";
import { resolve } from "path";
const env = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
for (const line of env.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)/);
  if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
}
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-04-10" as any });

const INTERNAL = ["patrypierreandre","sofiane.lekfif","sofiane@reddotgrowth","thibault.cdn","reddotgrowth"];
const isInternal = (e: string) => INTERNAL.some(p => (e ?? "").toLowerCase().includes(p));

async function main() {
  const since = Math.floor(Date.now()/1000) - 180*86400;
  const all: Stripe.PaymentIntent[] = [];
  let starting_after: string | undefined;
  while (true) {
    const page = await stripe.paymentIntents.list({ created: { gte: since }, limit: 100, starting_after });
    all.push(...page.data);
    if (!page.has_more) break;
    starting_after = page.data[page.data.length-1].id;
  }
  
  const paid = all.filter(pi => pi.status === "succeeded" && (pi.amount ?? 0) >= 100);
  console.log(`Total succeeded PIs >= $1 (last 180d): ${paid.length}`);
  console.log(`Without internal filter — listing ALL chronologically:\n`);
  paid.sort((a,b) => a.created - b.created);
  for (const pi of paid) {
    const date = new Date(pi.created * 1000).toISOString();
    const email = (pi as any).receipt_email ?? "—";
    const desc = pi.description ?? "—";
    const ls = (pi as any).latest_charge ?? "—";
    console.log(`  ${date}  $${(pi.amount/100).toFixed(2)} ${pi.currency.toUpperCase()}  email=${email.padEnd(35)} desc=${desc.slice(0,40).padEnd(40)} ${isInternal(email) ? "[INTERNAL]" : ""}`);
  }
  
  // Distinct amounts
  const amounts: Record<string, number> = {};
  for (const pi of paid) {
    const k = `$${(pi.amount/100).toFixed(2)} ${pi.currency.toUpperCase()}`;
    amounts[k] = (amounts[k] ?? 0) + 1;
  }
  console.log(`\n=== Distinct amounts ===`);
  for (const [k, v] of Object.entries(amounts).sort((a,b) => b[1]-a[1])) console.log(`  ${k.padEnd(20)} ${v}`);
  
  // By month
  const byMonth: Record<string, number> = {};
  for (const pi of paid) {
    const m = new Date(pi.created * 1000).toISOString().slice(0, 7);
    byMonth[m] = (byMonth[m] ?? 0) + 1;
  }
  console.log(`\n=== Paid PIs by month ===`);
  for (const [m, v] of Object.entries(byMonth).sort()) console.log(`  ${m}  ${v}`);
}
main().catch(e => { console.error(e); process.exit(1); });
