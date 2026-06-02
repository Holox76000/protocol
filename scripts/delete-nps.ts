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
  const { error } = await supabase
    .from("users")
    .update({
      nps_score: null,
      nps_category: null,
      nps_submitted_at: null,
      nps_answers: null,
      nps_testimonial: null,
      nps_token: null,
      nps_sent_at: null,
    })
    .eq("email", "benj.brees@gmail.com");

  if (error) { console.error("Erreur:", error.message); return; }
  console.log("✓ NPS supprimé pour benj.brees@gmail.com");
}

main().catch(console.error);
