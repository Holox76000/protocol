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
  const today = "2026-06-28T00:00:00Z";
  // Sample answers from today's funnel sessions
  const { data } = await sb.from("funnel_sessions").select("session_id, answers, created_at").gte("created_at", today).order("created_at");
  console.log(`\n=== Funnel sessions today (${data?.length}) — looking for UTM/fbclid keys ===\n`);
  for (const s of data ?? []) {
    const a = s.answers as any;
    const utmKeys = Object.keys(a || {}).filter(k => /utm|fbclid|click|source|ref/i.test(k));
    console.log(`  ${s.session_id.slice(0,8)}  ${s.created_at}  keys: ${utmKeys.join(", ") || "(none)"}`);
    if (utmKeys.length) console.log(`     -> ${JSON.stringify(Object.fromEntries(utmKeys.map(k => [k, a[k]])))}`);
  }
  
  // Event sessions — any with UTM in payload?
  const { data: events } = await sb.from("event_sessions").select("session_id, event, payload, created_at")
    .gte("created_at", today).order("created_at").limit(200);
  console.log(`\n=== Event payloads with UTM/fbclid (today) ===\n`);
  const withUtm = (events ?? []).filter(e => {
    const p = e.payload as any;
    return p && Object.keys(p).some(k => /utm|fbclid|click_id/i.test(k));
  });
  console.log(`Events with utm-like fields: ${withUtm.length} / ${events?.length}`);
  for (const e of withUtm.slice(0, 5)) {
    console.log(`  ${e.event}  ${e.created_at}  ${JSON.stringify(e.payload).slice(0,200)}`);
  }
  
  // Leads — what's in payload?
  const { data: leads } = await sb.from("leads").select("payload, created_at").gte("created_at", today).order("created_at");
  console.log(`\n=== Today's leads (${leads?.length}) ===`);
  for (const l of leads ?? []) {
    const p = l.payload as any;
    const utmKeys = Object.keys(p || {}).filter(k => /utm|fbclid|source|ref|click/i.test(k));
    console.log(`  ${l.created_at}  email=${p?.email}  utm_keys=[${utmKeys.join(",")}]  src=${p?.utm_source ?? p?.source ?? "—"}`);
  }
}
main().catch(e => { console.error(e); process.exit(1); });
