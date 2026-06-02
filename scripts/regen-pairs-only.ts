/**
 * Deletes only the before/after pairs for a given combo (keeps portrait.png),
 * then triggers regeneration via the API.
 */
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

const BUCKET = "offer-images";
const MORPHOLOGY = "Skinny";
const ETHNICITY  = "Caucasian";
const AGE_BRACKET = "20-29";
const BASE_URL = "http://localhost:3000";
const SECRET = process.env.PREGENERATE_SECRET ?? "";

function sanitizeCacheKey(m: string, e: string, a: string) {
  return `${m}_${e}_${a}`
    .replace(/\+/g, "plus").replace(/[/\\]/g, "-")
    .replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "_");
}

const PAIRS = [
  "result-1-before.png", "result-1-after.png",
  "result-2-before.png", "result-2-after.png",
  "result-3-before.png", "result-3-after.png",
];

async function main() {
  const key = sanitizeCacheKey(MORPHOLOGY, ETHNICITY, AGE_BRACKET);
  const paths = PAIRS.map((f) => `${key}/${f}`);

  console.log(`Deleting 6 before/after files for ${key}…`);
  const { error } = await supabase.storage.from(BUCKET).remove(paths);
  if (error) { console.error("Delete error:", error.message); process.exit(1); }
  console.log("✓ Deleted");

  console.log("Triggering generation…");
  const res = await fetch(`${BASE_URL}/api/offer/personalized-images`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ age_bracket: AGE_BRACKET, morphology: MORPHOLOGY, ethnicity: ETHNICITY, secret: SECRET }),
  });
  const data = await res.json() as { status: string };
  console.log("Trigger status:", data.status);

  // Poll until done
  console.log("Polling…");
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 15_000));
    const poll = await fetch(`${BASE_URL}/api/offer/personalized-images?age_bracket=${AGE_BRACKET}&morphology=${MORPHOLOGY}&ethnicity=${ETHNICITY}`);
    const d = await poll.json() as { status: string };
    process.stdout.write(` ${d.status}`);
    if (d.status === "done") { console.log("\n✅ Done!"); break; }
    if (d.status === "error") { console.log("\n❌ Error during generation"); break; }
  }
}

main().catch(console.error);
