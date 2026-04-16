import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const envFile = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
for (const line of envFile.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

async function main() {
  const { data: u1 } = await sb.from("users").select("*").eq("email", "plourde.matt@gmail.com").maybeSingle();
  const { data: u2 } = await sb.from("users").select("*").eq("email", "nachoscl@hotmail.com").maybeSingle();

  console.log("=== plourde.matt@gmail.com ===");
  console.log(JSON.stringify(u1, null, 2));
  console.log("\n=== nachoscl@hotmail.com ===");
  console.log(JSON.stringify(u2, null, 2));
}

main().catch(console.error);
