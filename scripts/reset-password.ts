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
import bcrypt from "bcryptjs";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const EMAIL = "abrar_art@hotmail.com";
const NEW_PASSWORD = "azerty";

async function main() {
  const hash = await bcrypt.hash(NEW_PASSWORD, 10);

  const { data, error } = await supabase
    .from("users")
    .update({ password_hash: hash })
    .eq("email", EMAIL)
    .select("id, email")
    .single();

  if (error) { console.error("Erreur:", error.message); return; }
  console.log(`✓ Mot de passe réinitialisé pour ${data.email} (id: ${data.id})`);
}

main().catch(console.error);
