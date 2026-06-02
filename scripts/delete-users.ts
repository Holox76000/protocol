import { readFileSync } from "fs";
import { resolve } from "path";

try {
  const lines = readFileSync(resolve(process.cwd(), ".env.local"), "utf8").split("\n");
  for (const line of lines) {
    const match = line.match(/^([^#=\s]+)\s*=\s*(.*)$/);
    if (match) process.env[match[1]] ??= match[2].replace(/^["']|["']$/g, "");
  }
} catch {}

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const EMAILS = [
  "patrypierreandre+5@gmail.com",
  "sofiane+1@reddotgrowth.com",
];

async function main() {
  for (const email of EMAILS) {
    const { data, error } = await supabase
      .from("users")
      .delete()
      .eq("email", email)
      .select("email");

    if (error) {
      console.error(`✗ ${email}: ${error.message}`);
    } else if (!data || data.length === 0) {
      console.log(`⚠ ${email}: not found`);
    } else {
      console.log(`✓ ${email}: deleted`);
    }
  }
}

main().catch(console.error);
