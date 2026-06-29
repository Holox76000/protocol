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
  const since = new Date(Date.now() - 15*86400000).toISOString();
  const { data } = await sb.from("funnel_sessions").select("answers").gte("created_at", since).limit(5);
  for (const s of data ?? []) {
    const a = s.answers as any;
    if (!a?.email) continue;
    const keys = Object.keys(a);
    const bodyKeys = keys.filter(k => /height|weight/i.test(k));
    console.log(`Body keys: ${bodyKeys.join(", ")}`);
    for (const k of bodyKeys) console.log(`  ${k}: ${a[k]} (type=${typeof a[k]})`);
    console.log("");
  }
}
main();
