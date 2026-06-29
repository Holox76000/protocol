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
  // ALL PIs since Jan 2026 (go back as far as Stripe allows efficiently)
  const since = Math.floor(new Date("2026-01-01T00:00:00Z").getTime() / 1000);
  const allPIs: Stripe.PaymentIntent[] = [];
  let starting_after: string | undefined;
  while (true) {
    const page = await stripe.paymentIntents.list({ created: { gte: since }, limit: 100, starting_after });
    allPIs.push(...page.data);
    if (!page.has_more) break;
    starting_after = page.data[page.data.length-1].id;
  }
  const paid89 = allPIs.filter(pi => pi.status === "succeeded" && (pi.amount ?? 0) === 8900 && !isInternal((pi as any).receipt_email ?? ""));
  console.log(`Total paid $89 since 01/01: ${paid89.length}\n`);
  
  // For each, try multiple sources to find orientation
  const profiles: any[] = [];
  for (const pi of paid89) {
    const email = ((pi as any).receipt_email ?? "").toLowerCase().trim();
    if (!email) {
      profiles.push({ paid_at: new Date(pi.created * 1000).toISOString().slice(0,10), email: "(no email)", source: "—", orientation: "—" });
      continue;
    }
    
    // 1. Try funnel_sessions
    const { data: fs } = await sb.from("funnel_sessions").select("answers, created_at").ilike("answers->>email", email).order("created_at", { ascending: false }).limit(3);
    
    // 2. Try leads
    const { data: leads } = await sb.from("leads").select("payload, created_at").ilike("payload->>email", email).order("created_at", { ascending: false }).limit(3);
    
    // 3. Try users table for any captured data
    const { data: users } = await sb.from("users").select("*").ilike("email", email).limit(3);
    
    // Find any answer object with orientation
    let orientation = "—";
    let morphology = "—";
    let age = "—";
    let time = "—";
    let source = "—";
    let dataAvailable = false;
    
    for (const f of fs ?? []) {
      const a = f.answers as any;
      if (a?.sexual_orientation) { orientation = a.sexual_orientation; source = "funnel_sessions"; }
      if (a?.morphology) morphology = a.morphology;
      if (a?.age_bracket) age = a.age_bracket;
      if (a?.weekly_time) time = a.weekly_time;
      if (a) dataAvailable = true;
    }
    for (const l of leads ?? []) {
      const p = l.payload as any;
      if (orientation === "—" && p?.sexual_orientation) { orientation = p.sexual_orientation; source = "leads"; }
      if (morphology === "—" && p?.morphology) morphology = p.morphology;
      if (age === "—" && p?.age_bracket) age = p.age_bracket;
      if (time === "—" && p?.weekly_time) time = p.weekly_time;
      if (p) dataAvailable = true;
    }
    
    profiles.push({
      paid_at: new Date(pi.created * 1000).toISOString().slice(0,10),
      email, source, orientation, morphology, age, time,
      hasFunnelData: dataAvailable,
    });
  }
  
  console.log(`\n=== ALL PAID CUSTOMERS chronological ===\n`);
  profiles.sort((a,b) => (a.paid_at ?? "").localeCompare(b.paid_at ?? ""));
  for (const p of profiles) {
    console.log(`  ${p.paid_at}  ${p.email.padEnd(38)} ${(p.orientation ?? "—").padEnd(14)} ${(p.morphology ?? "—").padEnd(14)} ${(p.age ?? "—").padEnd(8)} ${(p.time ?? "—").padEnd(22)} src=${p.source}`);
  }
  
  // Distribution
  const orientCounts: Record<string, number> = {};
  for (const p of profiles) {
    const o = p.orientation === "—" ? "(no data)" : p.orientation;
    orientCounts[o] = (orientCounts[o] ?? 0) + 1;
  }
  console.log(`\n=== Orientation distribution among ALL paid ===`);
  for (const [o, c] of Object.entries(orientCounts).sort((a,b) => b[1] - a[1])) {
    console.log(`  ${o.padEnd(20)} ${c}  (${(100*c/profiles.length).toFixed(0)}%)`);
  }
  
  // Of those with orientation captured, count Gay/Bi
  const knownOrientation = profiles.filter(p => p.orientation !== "—");
  const gayBi = profiles.filter(p => ["Gay", "Bisexual"].includes(p.orientation));
  console.log(`\n=== Of ${profiles.length} paid customers ===`);
  console.log(`  ${knownOrientation.length} have orientation captured (funnel sessions or leads)`);
  console.log(`  ${gayBi.length} are confirmed Gay or Bisexual`);
  console.log(`  ${knownOrientation.length - gayBi.length} are Straight or other`);
  console.log(`  ${profiles.length - knownOrientation.length} have no quiz orientation data (pre-06-17)`);
  
  console.log(`\n=== Confirmed Gay/Bi paid customers ===`);
  for (const p of gayBi) {
    console.log(`  ${p.paid_at}  ${p.email}  ${p.orientation}  ${p.morphology} ${p.age} ${p.time}`);
  }
}
main().catch(e => { console.error(e); process.exit(1); });
