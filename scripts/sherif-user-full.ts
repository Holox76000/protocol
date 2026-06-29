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
  // Look at full users table schema for sherif and see ALL columns
  const { data, error } = await sb.from("users").select("*").ilike("email", "sherif.haikal@gmail.com");
  console.log("=== Sherif users row FULL JSON ===");
  console.log(JSON.stringify(data?.[0] ?? null, null, 2));
  
  // Also dump column names
  if (data?.[0]) {
    console.log("\n=== All column names ===");
    console.log(Object.keys(data[0]).join("\n"));
  }
}
main().catch(e => { console.error(e); process.exit(1); });
