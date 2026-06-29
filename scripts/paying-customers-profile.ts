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
  // Pull all paid PIs in last 90 days
  const since = Math.floor(Date.now()/1000) - 90*86400;
  const all: Stripe.PaymentIntent[] = [];
  let starting_after: string | undefined;
  while (true) {
    const page = await stripe.paymentIntents.list({ created: { gte: since }, limit: 100, starting_after });
    all.push(...page.data);
    if (!page.has_more) break;
    starting_after = page.data[page.data.length-1].id;
  }
  const paid = all.filter(pi => pi.status === "succeeded" && (pi.amount ?? 0) >= 100 && !isInternal((pi as any).receipt_email ?? ""));
  console.log(`Paid customers (last 90d): ${paid.length}\n`);
  
  // Get emails
  const emails = paid.map(pi => (pi as any).receipt_email).filter(Boolean) as string[];
  
  // For each email, find their funnel_sessions answers
  const profiles: any[] = [];
  for (const email of emails) {
    const { data } = await sb.from("funnel_sessions").select("answers, created_at").like("answers->>email", email).order("created_at", { ascending: false }).limit(1);
    if (data && data.length > 0) {
      const a = data[0].answers as any;
      profiles.push({
        email,
        paid_at: paid.find(pi => (pi as any).receipt_email === email)?.created,
        orientation: a?.sexual_orientation ?? "—",
        age_bracket: a?.age_bracket ?? "—",
        morphology: a?.morphology ?? "—",
        ethnicity: a?.ethnicity ?? "—",
        weekly_time: a?.weekly_time ?? "—",
        pain_friction: Array.isArray(a?.pain_friction) ? a.pain_friction : (a?.pain_friction ? [a.pain_friction] : []),
        past_solutions: Array.isArray(a?.past_solutions) ? a.past_solutions : (a?.past_solutions ? [a.past_solutions] : []),
        dream_outcome: a?.dream_outcome ?? "—",
        utm_source: a?._utm_source ?? "—",
        utm_campaign: a?._utm_campaign ?? "—",
      });
    } else {
      profiles.push({ email, no_funnel_session: true });
    }
  }
  
  console.log(`Profiles matched to funnel_sessions: ${profiles.filter(p => !p.no_funnel_session).length}/${profiles.length}\n`);
  
  // Distribution: orientation
  const matched = profiles.filter(p => !p.no_funnel_session);
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
  
  dist("orientation", "Sexual orientation");
  dist("age_bracket", "Age bracket");
  dist("morphology", "Morphology");
  dist("ethnicity", "Ethnicity");
  dist("weekly_time", "Weekly time");
  dist("dream_outcome", "Dream outcome");
  dist("utm_source", "Source");
  
  // Multi-value: pain_friction + past_solutions
  function multiDist(field: string, label: string) {
    const counts: Record<string, number> = {};
    for (const p of matched) {
      for (const v of (p[field] ?? []) as string[]) {
        counts[v] = (counts[v] ?? 0) + 1;
      }
    }
    console.log(`\n=== ${label} (multi) ===`);
    Object.entries(counts).sort((a,b) => b[1] - a[1]).forEach(([k, v]) => {
      console.log(`  ${k.padEnd(50)} ${v}  (${(100*v/matched.length).toFixed(0)}% of payers)`);
    });
  }
  multiDist("pain_friction", "Pain friction");
  multiDist("past_solutions", "Past solutions");
  
  // Focus: paying customers who are gay/bi
  console.log(`\n\n========== GAY/BI PAYING CUSTOMERS ==========`);
  const gayBi = matched.filter(p => ["gay", "bisexual"].includes(String(p.orientation).toLowerCase()));
  console.log(`Total gay/bi payers: ${gayBi.length}/${matched.length} (${matched.length ? (100*gayBi.length/matched.length).toFixed(0) : 0}%)\n`);
  for (const p of gayBi) {
    console.log(`  ${p.email}  ${p.age_bracket}  ${p.morphology}/${p.ethnicity}  time=${p.weekly_time}  pain=[${(p.pain_friction ?? []).join("|")}]  past=[${(p.past_solutions ?? []).join("|")}]`);
  }
  
  // Same for straight payers
  console.log(`\n========== STRAIGHT PAYING CUSTOMERS ==========`);
  const straight = matched.filter(p => String(p.orientation).toLowerCase() === "straight");
  console.log(`Total straight payers: ${straight.length}/${matched.length}\n`);
  for (const p of straight) {
    console.log(`  ${p.email}  ${p.age_bracket}  ${p.morphology}/${p.ethnicity}  time=${p.weekly_time}  pain=[${(p.pain_friction ?? []).join("|")}]`);
  }
  
  console.log(`\n========== UNMATCHED / NO DATA ==========`);
  const noFunnel = profiles.filter(p => p.no_funnel_session);
  for (const p of noFunnel.slice(0, 30)) console.log(`  ${p.email}`);
}
main().catch(e => { console.error(e); process.exit(1); });
