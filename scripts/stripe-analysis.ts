import { readFileSync } from "fs";
import { resolve } from "path";

try {
  const lines = readFileSync(resolve(process.cwd(), ".env.local"), "utf8").split("\n");
  for (const line of lines) {
    const match = line.match(/^([^#=\s]+)\s*=\s*(.*)$/);
    if (match) process.env[match[1]] ??= match[2].replace(/^["']|["']$/g, "");
  }
} catch {}

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Upsell ajouté le 7 mai ~15h08 UTC
const UPSELL_TS = Math.floor(new Date("2026-05-07T15:08:00.000Z").getTime() / 1000);
const BEFORE_START = Math.floor(new Date("2026-04-15T00:00:00.000Z").getTime() / 1000);

function label(ts: number) {
  return new Date(ts * 1000).toISOString().slice(0, 16).replace("T", " ");
}

async function fetchAll(params: Stripe.PaymentIntentListParams): Promise<Stripe.PaymentIntent[]> {
  const all: Stripe.PaymentIntent[] = [];
  let page = await stripe.paymentIntents.list({ ...params, limit: 100 });
  all.push(...page.data);
  while (page.has_more) {
    page = await stripe.paymentIntents.list({ ...params, limit: 100, starting_after: page.data[page.data.length - 1].id });
    all.push(...page.data);
  }
  return all;
}

async function main() {
  // Récupérer tous les payment intents depuis jan 2026
  const all = await fetchAll({ created: { gte: BEFORE_START } });

  const ADMIN_KEYWORDS = ["sofiane", "patry", "thibault"];
  const isAdmin = (pi: Stripe.PaymentIntent) => {
    const email = (pi.metadata?.customer_email ?? pi.receipt_email ?? "").toLowerCase();
    return ADMIN_KEYWORDS.some((k) => email.includes(k));
  };

  const real = all.filter((pi) => !isAdmin(pi));
  const before = real.filter((pi) => pi.created < UPSELL_TS);
  const after  = real.filter((pi) => pi.created >= UPSELL_TS);

  function summarize(pis: Stripe.PaymentIntent[], label: string) {
    const byStatus: Record<string, number> = {};
    for (const pi of pis) {
      byStatus[pi.status] = (byStatus[pi.status] ?? 0) + 1;
    }
    const succeeded = pis.filter((pi) => pi.status === "succeeded");
    const total = succeeded.reduce((s, pi) => s + pi.amount_received, 0) / 100;
    console.log(`\n─── ${label} (${pis.length} payment intents) ───────────────────`);
    for (const [status, count] of Object.entries(byStatus).sort()) {
      console.log(`  ${status.padEnd(30)} : ${count}`);
    }
    console.log(`  ${"succeeded → revenue".padEnd(30)} : $${total.toFixed(2)}`);
    if (succeeded.length > 0) {
      const avg = (total / succeeded.length).toFixed(2);
      console.log(`  ${"panier moyen".padEnd(30)} : $${avg}`);
    }
    return { byStatus, succeeded, total };
  }

  console.log("\n══════════════════════════════════════════════════");
  console.log("  Stripe — Payment Intents avant/après upsell");
  console.log(`  Cutoff : 2026-05-07 15:08 UTC`);
  console.log("══════════════════════════════════════════════════");

  const bef = summarize(before, "AVANT upsell");
  const aft = summarize(after,  "APRÈS upsell");

  // Détail des paiements après l'upsell
  if (after.length > 0) {
    console.log("\n─── Détail des payment intents APRÈS ──────────────");
    for (const pi of after.sort((a, b) => a.created - b.created)) {
      const amt = `$${(pi.amount / 100).toFixed(2)}`;
      const recv = pi.amount_received > 0 ? ` → reçu $${(pi.amount_received / 100).toFixed(2)}` : "";
      const meta = pi.metadata ? JSON.stringify(pi.metadata) : "";
      console.log(`  ${label(pi.created)}  ${pi.status.padEnd(25)} ${amt}${recv}  ${meta}`);
    }
  }

  // Montants distincts après (pour voir rush delivery à $118)
  if (aft.succeeded.length > 0) {
    const amts: Record<number, number> = {};
    for (const pi of aft.succeeded) {
      const a = pi.amount_received / 100;
      amts[a] = (amts[a] ?? 0) + 1;
    }
    console.log("\n─── Répartition montants payés APRÈS ───────────────");
    for (const [amt, count] of Object.entries(amts).sort()) {
      const tag = Number(amt) === 118 ? " ← avec rush" : Number(amt) === 89 ? " ← sans rush" : "";
      console.log(`  $${amt}${tag}  →  ${count} orders`);
    }
  }

  console.log("\n══════════════════════════════════════════════════\n");
}

main().catch(console.error);
