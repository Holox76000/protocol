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
  // Look at all event_sessions to see what page_path values appear
  const { data } = await sb.from("event_sessions").select("event, payload, created_at").gte("created_at", since);
  const paths: Record<string, number> = {};
  for (const e of data ?? []) {
    const p = (e.payload as any)?.page_path ?? "—";
    paths[p] = (paths[p] ?? 0) + 1;
  }
  console.log("Event page_paths since 27/06:");
  for (const [k,v] of Object.entries(paths).sort((a,b) => b[1]-a[1])) console.log(`  ${k.padEnd(40)} ${v}`);
  
  // Look at events distinct
  const eventCounts: Record<string, number> = {};
  for (const e of data ?? []) eventCounts[e.event] = (eventCounts[e.event] ?? 0) + 1;
  console.log("\nEvents:");
  for (const [k,v] of Object.entries(eventCounts).sort((a,b) => b[1]-a[1])) console.log(`  ${k.padEnd(40)} ${v}`);
}
main().catch(e => console.error(e));
