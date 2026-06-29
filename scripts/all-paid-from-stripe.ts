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

const INTERNAL = ["patrypierreandre","sofiane.lekfif","sofiane@reddotgrowth","thibault.cdn","reddotgrowth"];
const isInternal = (e: string) => INTERNAL.some(p => (e ?? "").toLowerCase().includes(p));

async function main() {
  // Pull ALL paid PIs from Stripe
  const since = Math.floor(new Date("2026-01-01").getTime() / 1000);
  const all: Stripe.PaymentIntent[] = [];
  let starting_after: string | undefined;
  while (true) {
    const page = await stripe.paymentIntents.list({ created: { gte: since }, limit: 100, starting_after });
    all.push(...page.data);
    if (!page.has_more) break;
    starting_after = page.data[page.data.length-1].id;
  }
  const paidPIs = all.filter(pi => pi.status === "succeeded" && (pi.amount ?? 0) === 8900 && !isInternal((pi as any).receipt_email ?? ""));
  
  // Dedupe by email (some emails paid twice)
  const seen = new Set<string>();
  const unique: Stripe.PaymentIntent[] = [];
  for (const pi of paidPIs) {
    const e = (pi as any).receipt_email ?? "";
    if (seen.has(e)) continue;
    seen.add(e); unique.push(pi);
  }
  console.log(`Unique paid $89 customers (Stripe): ${unique.length}\n`);
  
  // For each, find users + questionnaire_responses
  const profiles: any[] = [];
  for (const pi of unique) {
    const email = ((pi as any).receipt_email ?? "").toLowerCase().trim();
    if (!email) continue;
    const { data: usr } = await sb.from("users").select("id").ilike("email", email).maybeSingle();
    let orientation = "—";
    if (usr) {
      const { data: qr } = await sb.from("questionnaire_responses").select("sexual_orientation").eq("user_id", usr.id).maybeSingle();
      orientation = qr?.sexual_orientation ?? "—";
    }
    profiles.push({
      paid_at: new Date(pi.created*1000).toISOString().slice(0,10),
      email, orientation,
      hasUser: !!usr,
    });
  }
  
  profiles.sort((a,b) => a.paid_at.localeCompare(b.paid_at));
  console.log("=== ALL UNIQUE PAID CUSTOMERS (Stripe-source-of-truth) ===\n");
  for (const p of profiles) {
    const flag = p.hasUser ? "✓" : "✗";
    console.log(`  ${p.paid_at}  ${flag} user  ${p.email.padEnd(36)} ${p.orientation}`);
  }
  
  console.log(`\n=== Orientation distribution (N=${profiles.length}) ===`);
  const counts: Record<string, number> = {};
  for (const p of profiles) counts[p.orientation] = (counts[p.orientation] ?? 0) + 1;
  for (const [o, c] of Object.entries(counts).sort((a,b) => b[1] - a[1])) {
    console.log(`  ${o.padEnd(20)} ${c}  (${(100*c/profiles.length).toFixed(0)}%)`);
  }
  
  const known = profiles.filter(p => p.orientation !== "—");
  const gayBi = profiles.filter(p => ["gay", "bisexual"].includes(p.orientation));
  const straight = profiles.filter(p => p.orientation === "straight");
  console.log(`\n=== Among ${known.length} with known orientation ===`);
  console.log(`  Gay/Bi:   ${gayBi.length} (${(100*gayBi.length/known.length).toFixed(0)}%)`);
  console.log(`  Straight: ${straight.length} (${(100*straight.length/known.length).toFixed(0)}%)`);
}
main().catch(e => { console.error(e); process.exit(1); });
