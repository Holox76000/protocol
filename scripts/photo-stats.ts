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
  // funnel/ subfolder contains session folders
  const { data: sessions } = await supabase.storage.from("user-photos").list("funnel", { limit: 1000 });
  console.log(`Dossiers dans funnel/ : ${sessions?.length ?? 0}`);

  // Count photos (files named photo.png or similar inside each session folder)
  let withPhoto = 0;
  for (const session of sessions ?? []) {
    const { data: files } = await supabase.storage.from("user-photos").list(`funnel/${session.name}`, { limit: 10 });
    if (files && files.length > 0) withPhoto++;
  }

  // Total sessions in DB
  const { count } = await supabase.from("funnel_sessions").select("*", { count: "exact", head: true });

  console.log(`\nTotal sessions (DB)   : ${count}`);
  console.log(`Avec photo (storage)  : ${withPhoto}`);
  console.log(`Sans photo            : ${(count ?? 0) - withPhoto}`);
}
main().catch(console.error);
