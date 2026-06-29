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

// Body archetype classifier — based on the labels the user provided
function classify(morph: string, age: string, time: string): string {
  const young = age === "20–29";
  const mature40plus = age === "40–49" || age === "50+";
  const heavyTraining = time === "3 to 5 hours" || time === "More than 5 hours";
  const lightTraining = time === "Zero effort right now" || time === "Less than 1 hour";
  const mediumTraining = time === "1 to 3 hours";

  // Skinny axis
  if (morph === "Skinny" && young) return "Twink";
  if (morph === "Skinny" && !young && heavyTraining) return "Otter/Wolf (lean+trained)";
  if (morph === "Skinny" && !young) return "Otter (lean, less trained)";
  if (morph === "Skinny") return "Twink";

  // Skinny-fat axis - the awkward state
  if (morph === "Skinny-fat" && young) return "Pre-Twunk";
  if (morph === "Skinny-fat" && mature40plus) return "Skinny-fat 40+";
  if (morph === "Skinny-fat") return "Skinny-fat (recompo zone)";

  // Average axis - the swing state
  if (morph === "Average" && heavyTraining && !mature40plus) return "Jock / Twunk-Hunk";
  if (morph === "Average" && heavyTraining && mature40plus) return "Daddy-fit / mature Hunk";
  if (morph === "Average" && mediumTraining) return "Twunk";
  if (morph === "Average" && lightTraining && mature40plus) return "Daddy-bod";
  if (morph === "Average") return "Twunk-Avg";

  // Overweight axis - bear territory
  if (morph === "Overweight" && mature40plus && heavyTraining) return "Muscle Bear / Daddy";
  if (morph === "Overweight" && mature40plus) return "Bear / Daddy";
  if (morph === "Overweight" && young) return "Cub";
  if (morph === "Overweight") return "Cub / Chub";

  return "Unclassified";
}

async function main() {
  // 1. ALL gay/bi quiz takers (last 90d)
  const since = "2026-04-01T00:00:00Z";
  const { data: sessions } = await sb.from("funnel_sessions").select("session_id, answers, created_at")
    .gte("created_at", since).order("created_at");
  
  const gayBi = (sessions ?? []).filter(s => {
    const a = s.answers as any;
    const o = String(a?.sexual_orientation ?? "").toLowerCase();
    return ["gay", "bisexual"].includes(o) && !isInternal(a?.email ?? "");
  });
  
  console.log(`\n=== Quiz audience: Gay/Bi sessions since ${since.slice(0,10)} ===`);
  console.log(`Total: ${gayBi.length}\n`);
  
  // Distribution
  const counts: Record<string, number> = {};
  const classified: any[] = [];
  for (const s of gayBi) {
    const a = s.answers as any;
    const arch = classify(a.morphology ?? "—", a.age_bracket ?? "—", a.weekly_time ?? "—");
    counts[arch] = (counts[arch] ?? 0) + 1;
    classified.push({ ...a, arch });
  }
  
  console.log("=== Distribution archetype (quiz takers gay/bi) ===");
  Object.entries(counts).sort((a,b) => b[1] - a[1]).forEach(([k, v]) => {
    const pct = (100*v/gayBi.length).toFixed(0);
    console.log(`  ${k.padEnd(35)} ${String(v).padStart(3)}  (${pct}%)`);
  });
  
  // Cross-tabs: archetype × age, archetype × morphology
  console.log("\n=== Sanity check: morpho × age (gay/bi only) ===");
  const morphAge: Record<string, Record<string, number>> = {};
  for (const c of classified) {
    morphAge[c.morphology] = morphAge[c.morphology] ?? {};
    morphAge[c.morphology][c.age_bracket] = (morphAge[c.morphology][c.age_bracket] ?? 0) + 1;
  }
  console.log("morphology         | 20–29 | 30–39 | 40–49 | 50+ | —");
  for (const [m, ages] of Object.entries(morphAge)) {
    console.log(`  ${m.padEnd(18)} | ${String(ages["20–29"] ?? 0).padStart(5)} | ${String(ages["30–39"] ?? 0).padStart(5)} | ${String(ages["40–49"] ?? 0).padStart(5)} | ${String(ages["50+"] ?? 0).padStart(3)} | ${String(ages["—"] ?? 0).padStart(2)}`);
  }
  
  // 2. PAID gay/bi specifically
  const stripeStart = Math.floor(new Date("2026-03-01T00:00:00Z").getTime() / 1000);
  const stripePIs: Stripe.PaymentIntent[] = [];
  let starting_after: string | undefined;
  while (true) {
    const page = await stripe.paymentIntents.list({ created: { gte: stripeStart }, limit: 100, starting_after });
    stripePIs.push(...page.data);
    if (!page.has_more) break;
    starting_after = page.data[page.data.length-1].id;
  }
  const paid89 = stripePIs.filter(pi => pi.status === "succeeded" && (pi.amount ?? 0) === 8900 && !isInternal((pi as any).receipt_email ?? ""));
  console.log(`\n=== Paid $89 customers since 01/03: ${paid89.length} ===`);
  
  const paidProfiles: any[] = [];
  for (const pi of paid89) {
    const email = ((pi as any).receipt_email ?? "").toLowerCase().trim();
    if (!email) continue;
    const { data: fs } = await sb.from("funnel_sessions").select("answers").ilike("answers->>email", email).order("created_at", { ascending: false }).limit(1);
    if (fs?.[0]) {
      const a = fs[0].answers as any;
      paidProfiles.push({
        email,
        paid_at: new Date(pi.created * 1000).toISOString().slice(0,10),
        orientation: a.sexual_orientation ?? "—",
        morphology: a.morphology ?? "—",
        age_bracket: a.age_bracket ?? "—",
        weekly_time: a.weekly_time ?? "—",
        archetype: classify(a.morphology ?? "—", a.age_bracket ?? "—", a.weekly_time ?? "—"),
      });
    } else {
      paidProfiles.push({ email, paid_at: new Date(pi.created * 1000).toISOString().slice(0,10), orientation: "(no funnel data)", archetype: "?" });
    }
  }
  
  console.log("\n=== PAID profiles (chronological) ===");
  paidProfiles.sort((a,b) => (a.paid_at ?? "").localeCompare(b.paid_at ?? ""));
  for (const p of paidProfiles) {
    console.log(`  ${p.paid_at}  ${p.email.padEnd(35)} ${p.orientation.padEnd(12)} ${p.morphology?.padEnd(14) ?? "—".padEnd(14)} ${p.age_bracket?.padEnd(8) ?? "—".padEnd(8)} ${(p.weekly_time ?? "—").padEnd(20)} → ${p.archetype}`);
  }
  
  // Paid Gay/Bi only
  const paidGayBi = paidProfiles.filter(p => ["Gay", "Bisexual"].includes(p.orientation));
  console.log(`\n=== Paid Gay/Bi customers: ${paidGayBi.length}/${paidProfiles.length} (with funnel data) ===`);
  const paidArchCounts: Record<string, number> = {};
  for (const p of paidGayBi) paidArchCounts[p.archetype] = (paidArchCounts[p.archetype] ?? 0) + 1;
  Object.entries(paidArchCounts).sort((a,b) => b[1] - a[1]).forEach(([k, v]) => {
    console.log(`  ${k.padEnd(35)} ${v}`);
  });
}
main().catch(e => { console.error(e); process.exit(1); });
