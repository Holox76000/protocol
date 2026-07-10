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

async function main() {
  const { data, error } = await supabase.storage.createBucket("dating-photos", {
    public: false,
    fileSizeLimit: 10 * 1024 * 1024,
  });

  if (error) {
    console.log("Bucket result:", error.message);
  } else {
    console.log("Bucket créé:", JSON.stringify(data));
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
