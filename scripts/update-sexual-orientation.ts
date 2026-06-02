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
  const { data: user, error: uErr } = await supabase
    .from("users")
    .select("id")
    .eq("email", "benj.brees@gmail.com")
    .single();

  if (uErr || !user) { console.error("Utilisateur introuvable:", uErr?.message); return; }

  const { error } = await supabase
    .from("questionnaire_responses")
    .update({ sexual_orientation: "gay" })
    .eq("user_id", user.id);

  if (error) { console.error("Erreur:", error.message); return; }
  console.log(`✓ sexual_orientation mis à "gay" pour benj.brees@gmail.com`);
}

main().catch(console.error);
