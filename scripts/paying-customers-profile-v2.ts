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
  // Last 180 days for more data
  const since = Math.floor(Date.now()/1000) - 180*86400;
  const all: Stripe.PaymentIntent[] = [];
  let starting_after: string | undefined;
  while (true) {
    const page = await stripe.paymentIntents.list({ created: { gte: since }, limit: 100, starting_after });
    all.push(...page.data);
    if (!page.has_more) break;
    starting_after = page.data[page.data.length-1].id;
  }
  const paid = all.filter(pi => pi.status === "succeeded" && (pi.amount ?? 0) >= 100 && !isInternal((pi as any).receipt_email ?? ""));
  console.log(`Paid customers (last 180d): ${paid.length}\n`);
  
  // For each, search funnel_sessions with ilike (case-insensitive) and also leads table
  const profiles: any[] = [];
  for (const pi of paid) {
    const email = ((pi as any).receipt_email ?? "").toLowerCase().trim();
    const paid_at = new Date(pi.created * 1000).toISOString();
    
    // funnel_sessions via ilike
    let { data: fs } = await sb.from("funnel_sessions").select("answers, session_id, created_at")
      .ilike("answers->>email", email).order("created_at", { ascending: false }).limit(1);
    
    // If not in funnel_sessions, try leads
    let leadAnswers: any = null;
    if (!fs || fs.length === 0) {
      const { data: leads } = await sb.from("leads").select("payload, created_at")
        .ilike("payload->>email", email).order("created_at", { ascending: false }).limit(1);
      if (leads && leads.length > 0) leadAnswers = leads[0].payload;
    }
    
    const a = fs?.[0]?.answers ?? leadAnswers ?? null;
    profiles.push({
      email, paid_at,
      source: fs?.[0] ? "funnel_sessions" : (leadAnswers ? "leads" : "—"),
      orientation: a?.sexual_orientation ?? "—",
      age_bracket: a?.age_bracket ?? "—",
      morphology: a?.morphology ?? "—",
      ethnicity: a?.ethnicity ?? "—",
      weekly_time: a?.weekly_time ?? "—",
      pain_friction: Array.isArray(a?.pain_friction) ? a.pain_friction : (a?.pain_friction ? [a.pain_friction] : []),
      past_solutions: Array.isArray(a?.past_solutions) ? a.past_solutions : (a?.past_solutions ? [a.past_solutions] : []),
      dream_outcome: a?.dream_outcome ?? "—",
      utm_source: a?._utm_source ?? a?.utm?.utm_source ?? "—",
      stripe_meta_utm: (pi.metadata as any)?.utm_source ?? "—",
    });
  }
  
  const matched = profiles.filter(p => p.source !== "—");
  console.log(`Profiles matched: ${matched.length}/${profiles.length}\n`);
  
  // Distributions
  function dist(field: string, label: string) {
    const counts: Record<string, number> = {};
    for (const p of matched) {
      const v = String(p[field] ?? "—");
      counts[v] = (counts[v] ?? 0) + 1;
    }
    console.log(`\n=== ${label} ===`);
    Object.entries(counts).sort((a,b) => b[1] - a[1]).forEach(([k, v]) => {
      console.log(`  ${k.padEnd(40)} ${v}  (${(100*v/matched.length).toFixed(0)}%)`);
    });
  }
  dist("orientation", "Orientation"); dist("age_bracket", "Age bracket");
  dist("morphology", "Morphology"); dist("ethnicity", "Ethnicity");
  dist("weekly_time", "Weekly time"); dist("dream_outcome", "Dream outcome");
  dist("source", "Source table");
  
  function multiDist(field: string, label: string) {
    const counts: Record<string, number> = {};
    for (const p of matched) for (const v of (p[field] ?? []) as string[]) counts[v] = (counts[v] ?? 0) + 1;
    console.log(`\n=== ${label} (multi) ===`);
    Object.entries(counts).sort((a,b) => b[1] - a[1]).forEach(([k, v]) => {
      console.log(`  ${k.padEnd(50)} ${v}  (${(100*v/matched.length).toFixed(0)}% of payers)`);
    });
  }
  multiDist("pain_friction", "Pain friction"); multiDist("past_solutions", "Past solutions");
  
  console.log(`\n========== ALL ${matched.length} PAYING PROFILES (chrono) ==========`);
  for (const p of matched.sort((a,b) => (a.paid_at ?? "").localeCompare(b.paid_at ?? ""))) {
    console.log(`  ${p.paid_at}  ${p.email}`);
    console.log(`     orient=${p.orientation}  age=${p.age_bracket}  morpho=${p.morphology}/${p.ethnicity}  time=${p.weekly_time}`);
    console.log(`     past=[${(p.past_solutions ?? []).join("|")}]  dream=${p.dream_outcome}  src=${p.source}/${p.utm_source}`);
  }
  
  // Gay/Bi specifically
  console.log(`\n========== GAY/BI PAYERS ==========`);
  const gayBi = matched.filter(p => ["Gay", "Bisexual", "gay", "bisexual"].includes(p.orientation));
  console.log(`Total: ${gayBi.length}/${matched.length}`);
  
  console.log(`\n========== UNMATCHED ==========`);
  const unmatched = profiles.filter(p => p.source === "—");
  for (const p of unmatched) console.log(`  ${p.paid_at}  ${p.email}`);
}
main().catch(e => { console.error(e); process.exit(1); });
