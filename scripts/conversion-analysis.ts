import { readFileSync } from "fs";
import { resolve } from "path";

try {
  const lines = readFileSync(resolve(process.cwd(), ".env.local"), "utf8").split("\n");
  for (const line of lines) {
    const match = line.match(/^([^#=\s]+)\s*=\s*(.*)$/);
    if (match) process.env[match[1]] ??= match[2].replace(/^["']|["']$/g, "");
  }
} catch {}

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// Upsell went live ~15h08 UTC on May 7
const UPSELL_DATE = "2026-05-07T15:08:00.000Z";

function pct(num: number, den: number) {
  if (den === 0) return "—";
  return `${((num / den) * 100).toFixed(1)}%`;
}

async function main() {
  // All users with relevant fields
  const { data: users, error } = await supabase
    .from("users")
    .select("id, created_at, has_paid, paid_amount_cents, rush_delivery")
    .order("created_at", { ascending: true });

  if (error || !users) {
    console.error("Error:", error?.message);
    return;
  }

  const before = users.filter((u) => u.created_at < UPSELL_DATE);
  const after  = users.filter((u) => u.created_at >= UPSELL_DATE);

  const paidBefore = before.filter((u) => u.has_paid);
  const paidAfter  = after.filter((u) => u.has_paid);

  const rushAfter = paidAfter.filter((u) => u.rush_delivery);

  const avgAmountBefore = paidBefore.length
    ? paidBefore.reduce((s, u) => s + (u.paid_amount_cents ?? 0), 0) / paidBefore.length / 100
    : 0;
  const avgAmountAfter = paidAfter.length
    ? paidAfter.reduce((s, u) => s + (u.paid_amount_cents ?? 0), 0) / paidAfter.length / 100
    : 0;

  console.log("\n══════════════════════════════════════════════════");
  console.log("  Conversion avant/après upsell rush delivery");
  console.log(`  Cutoff : ${UPSELL_DATE}`);
  console.log("══════════════════════════════════════════════════");

  console.log("\n─── Inscriptions ──────────────────────────────────");
  console.log(`  Avant  : ${before.length} comptes créés`);
  console.log(`  Après  : ${after.length} comptes créés`);

  console.log("\n─── Paiements ─────────────────────────────────────");
  console.log(`  Avant  : ${paidBefore.length} payants  /  ${before.length} inscrits  = ${pct(paidBefore.length, before.length)}`);
  console.log(`  Après  : ${paidAfter.length} payants  /  ${after.length} inscrits  = ${pct(paidAfter.length, after.length)}`);

  console.log("\n─── Upsell rush delivery (après seulement) ────────");
  console.log(`  Rush pris  : ${rushAfter.length} / ${paidAfter.length} payants = ${pct(rushAfter.length, paidAfter.length)}`);

  console.log("\n─── Panier moyen ───────────────────────────────────");
  console.log(`  Avant  : $${avgAmountBefore.toFixed(2)}`);
  console.log(`  Après  : $${avgAmountAfter.toFixed(2)}`);
  const lift = avgAmountAfter - avgAmountBefore;
  console.log(`  Delta  : ${lift >= 0 ? "+" : ""}$${lift.toFixed(2)}`);

  console.log("\n─── Revenus totaux ─────────────────────────────────");
  const revBefore = paidBefore.reduce((s, u) => s + (u.paid_amount_cents ?? 0), 0) / 100;
  const revAfter  = paidAfter.reduce((s, u) => s + (u.paid_amount_cents ?? 0), 0) / 100;
  console.log(`  Avant  : $${revBefore.toFixed(2)}`);
  console.log(`  Après  : $${revAfter.toFixed(2)}`);

  // Répartition paid_amount_cents pour comprendre les valeurs distinctes
  const amounts: Record<number, number> = {};
  for (const u of paidBefore.concat(paidAfter)) {
    const a = Math.round((u.paid_amount_cents ?? 0) / 100);
    amounts[a] = (amounts[a] ?? 0) + 1;
  }
  console.log("\n─── Répartition des montants payés ─────────────────");
  for (const [amt, count] of Object.entries(amounts).sort((a, b) => Number(a[0]) - Number(b[0]))) {
    console.log(`  $${amt}  →  ${count} orders`);
  }

  console.log("\n══════════════════════════════════════════════════\n");
}

main().catch(console.error);
