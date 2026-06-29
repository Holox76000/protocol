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
  const since = "2026-06-27T00:00:00Z";
  const { data } = await sb.from("funnel_sessions").select("session_id, answers, created_at").gte("created_at", since);
  let withMaxStepUndef = 0, withMaxStep0 = 0, withMaxStep1plus = 0, withUtm = 0, noUtm = 0;
  const ghostSessions: any[] = [];
  for (const s of data ?? []) {
    const a = s.answers as any;
    const ms = a?._max_step;
    if (ms === undefined || ms === null) { withMaxStepUndef++; ghostSessions.push(s); }
    else if (ms === 0) withMaxStep0++;
    else withMaxStep1plus++;
    if (a?._utm_source) withUtm++;
    else noUtm++;
  }
  console.log(`Total funnel_sessions since 27/06: ${data?.length}`);
  console.log(`  _max_step undefined/null:  ${withMaxStepUndef}  ← ghost sessions, row exists but never reached slide 0`);
  console.log(`  _max_step = 0:             ${withMaxStep0}     ← saw intro slide only`);
  console.log(`  _max_step >= 1:            ${withMaxStep1plus}     ← progressed past intro`);
  console.log(`With UTM source:  ${withUtm}`);
  console.log(`No UTM source:    ${noUtm}`);
  console.log(`\nGhost sessions sample:`);
  for (const s of ghostSessions.slice(0, 10)) {
    const a = s.answers as any;
    console.log(`  ${s.created_at}  sid=${s.session_id?.slice(0,8)}  utm=${a?._utm_source ?? "—"}  keys=[${Object.keys(a || {}).join(",")}]`);
  }
}
main().catch(e => { console.error(e); process.exit(1); });
