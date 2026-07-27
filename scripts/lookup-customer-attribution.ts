import { readFileSync } from "fs";
import { resolve } from "path";
const env = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
for (const line of env.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)/);
  if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
}
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-04-10" as any });

const EMAIL = process.argv[2] ?? "mr.happy.zebra@gmail.com";

async function main() {
  console.log(`\nLooking up: ${EMAIL}\n`);

  // 1) find customer
  const customers = await stripe.customers.list({ email: EMAIL, limit: 5 });
  for (const c of customers.data) {
    console.log(`Customer: ${c.id} · created=${new Date(c.created * 1000).toISOString()} · name=${c.name ?? "—"}`);
  }

  // 2) list checkout sessions for this customer
  const sessions: Stripe.Checkout.Session[] = [];
  for (const c of customers.data) {
    const ss = await stripe.checkout.sessions.list({ customer: c.id, limit: 20 });
    sessions.push(...ss.data);
  }
  console.log(`\n${sessions.length} checkout session(s) for this customer:`);
  for (const s of sessions) {
    console.log(`  ─────────────────────────────────`);
    console.log(`  session      : ${s.id}`);
    console.log(`  created      : ${new Date(s.created * 1000).toISOString()}`);
    console.log(`  amount_total : $${(s.amount_total ?? 0) / 100}`);
    console.log(`  status       : ${s.status}/${s.payment_status}`);
    console.log(`  metadata     :`, s.metadata);
    // Payment intent (metadata mirror lives there per code comment)
    if (typeof s.payment_intent === "string") {
      const pi = await stripe.paymentIntents.retrieve(s.payment_intent);
      console.log(`  pi metadata  :`, pi.metadata);
    }
  }

  // 3) list PaymentIntents for this customer
  for (const c of customers.data) {
    const pis = await stripe.paymentIntents.list({ customer: c.id, limit: 20 });
    if (pis.data.length) {
      console.log(`\n${pis.data.length} PaymentIntent(s) for ${c.id}:`);
      for (const pi of pis.data) {
        console.log(`  ${pi.id} · ${new Date(pi.created * 1000).toISOString()} · $${(pi.amount ?? 0) / 100} · ${pi.status} · metadata=`, pi.metadata);
      }
    }
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
