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
  // Pull all PIs from last 30 days
  const since = Math.floor(Date.now()/1000) - 30*86400;
  const all: Stripe.PaymentIntent[] = [];
  let starting_after: string | undefined;
  while (true) {
    const page = await stripe.paymentIntents.list({ created: { gte: since }, limit: 100, starting_after });
    all.push(...page.data);
    if (!page.has_more) break;
    starting_after = page.data[page.data.length-1].id;
  }
  const external = all.filter(pi => !isInternal((pi as any).receipt_email ?? "") && (pi.amount ?? 0) >= 100);
  
  // Chronological (oldest first)
  external.sort((a, b) => a.created - b.created);
  
  console.log(`\n=== All external PIs (last 30d): ${external.length} ===`);
  console.log(`status                       date                       email                          amount`);
  console.log("-".repeat(110));
  for (const pi of external) {
    const created = new Date(pi.created * 1000).toISOString();
    const email = (pi as any).receipt_email ?? "—";
    console.log(`${pi.status.padEnd(28)} ${created}  ${email.padEnd(30)}  $${(pi.amount ?? 0)/100}`);
  }
  
  // Find the last successful payment
  const succeeded = external.filter(pi => pi.status === "succeeded");
  const lastPaid = succeeded[succeeded.length - 1];
  console.log(`\n=== Last successful payment: ${lastPaid ? new Date(lastPaid.created*1000).toISOString() + " — " + (lastPaid as any).receipt_email : "NONE in last 30d"} ===`);
  
  // Group succeeded vs requires_payment_method per day
  console.log(`\n=== PIs by day ===`);
  const byDay: Record<string, { paid: number; abandoned: number; emails: string[] }> = {};
  for (const pi of external) {
    const day = new Date(pi.created * 1000).toISOString().slice(0, 10);
    byDay[day] = byDay[day] || { paid: 0, abandoned: 0, emails: [] };
    if (pi.status === "succeeded") byDay[day].paid++;
    else byDay[day].abandoned++;
    byDay[day].emails.push(`${pi.status === "succeeded" ? "✓" : "·"}${(pi as any).receipt_email ?? "—"}`);
  }
  console.log(`day         paid  abandoned  emails`);
  for (const [day, v] of Object.entries(byDay).sort()) {
    console.log(`${day}  ${v.paid}     ${v.abandoned}          ${v.emails.join(" | ")}`);
  }
}
main().catch(e => { console.error(e); process.exit(1); });
