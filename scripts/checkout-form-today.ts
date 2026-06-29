import { readFileSync } from "fs";
import { resolve } from "path";
const env = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
for (const line of env.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)/);
  if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
}
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

async function main() {
  // Last 48h to be safe
  const since = "2026-06-26T00:00:00Z";
  const { data, error } = await sb.from("event_sessions").select("session_id, event, created_at, payload")
    .in("event", ["checkout_form_viewed", "view_offer", "cta_clicked"])
    .gte("created_at", since)
    .order("created_at", { ascending: false });
  if (error) { console.error(error); process.exit(1); }
  
  console.log(`\n=== Checkout-relevant events since ${since} ===\n`);
  const byEvent: Record<string, any[]> = {};
  for (const e of data ?? []) {
    byEvent[e.event] = byEvent[e.event] ?? [];
    byEvent[e.event].push(e);
  }
  for (const [evt, rows] of Object.entries(byEvent)) {
    console.log(`\n${evt} — ${rows.length} events`);
    for (const r of rows.slice(0, 20)) {
      const p = r.payload as any;
      console.log(`  ${r.created_at}  sid=${r.session_id?.slice(0,8) ?? "—"}  funnel_sid=${(p?.funnel_sid ?? "—").slice(0,8)}  stripe=${(p?.stripe_session_id ?? "—").slice(0,12)}`);
    }
  }
  
  // Today only
  const today = "2026-06-28T00:00:00Z";
  console.log(`\n=== Today only (>= ${today}) ===`);
  for (const evt of ["view_offer", "checkout_form_viewed"]) {
    const todayRows = (byEvent[evt] ?? []).filter((r: any) => r.created_at >= today);
    const uniqSids = new Set(todayRows.map((r: any) => r.payload?.funnel_sid ?? r.session_id));
    console.log(`  ${evt}: ${todayRows.length} events / ${uniqSids.size} unique`);
    for (const r of todayRows) {
      console.log(`    ${r.created_at}  sid=${r.session_id?.slice(0,8)}  funnel_sid=${(r.payload?.funnel_sid ?? "—").slice(0,8)}  stripe=${(r.payload?.stripe_session_id ?? "—").slice(0,12)}`);
    }
  }
}
main().catch(e => { console.error(e); process.exit(1); });
