/**
 * Deletes all cached offer images for all combinations EXCEPT the ones listed in SKIP.
 * Use this before re-running pregenerate-offer-images.ts with new prompts.
 *
 * Usage:
 *   npx tsx scripts/reset-offer-images.ts
 *   # then:
 *   PREGENERATE_SECRET=<secret> BASE_URL=http://localhost:3000 npx tsx scripts/pregenerate-offer-images.ts
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local manually (dotenv not installed)
try {
  const envPath = resolve(process.cwd(), ".env.local");
  const lines = readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const match = line.match(/^([^#=\s]+)\s*=\s*(.*)$/);
    if (match) process.env[match[1]] ??= match[2].replace(/^["']|["']$/g, "");
  }
} catch { /* env.local not found — rely on process.env */ }

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET = "offer-images";

const MORPHOLOGIES = ["Skinny", "Skinny-fat", "Overweight", "Average"];
const ETHNICITIES = ["Caucasian", "Black", "Asian (East / SE)", "South Asian", "Hispanic-Latino", "MENA"];
const AGE_BRACKETS = ["20-29", "30-39", "40-49", "50+"];

// These combos already have the new text-only approach — keep them
const SKIP = new Set([
  "Skinny_Caucasian_20-29",
]);

function sanitizeCacheKey(morphology: string, ethnicity: string, ageBracket: string): string {
  return `${morphology}_${ethnicity}_${ageBracket}`
    .replace(/\+/g, "plus")
    .replace(/[/\\]/g, "-")
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "_");
}

async function deleteCombo(key: string): Promise<number> {
  const { data } = await supabase.storage.from(BUCKET).list(key);
  if (!data || data.length === 0) return 0;
  const paths = data.map((f) => `${key}/${f.name}`);
  const { error } = await supabase.storage.from(BUCKET).remove(paths);
  if (error) {
    console.error(`  ✗ error deleting ${key}:`, error.message);
    return 0;
  }
  return paths.length;
}

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("❌  NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
    process.exit(1);
  }

  const all = MORPHOLOGIES.flatMap((m) =>
    ETHNICITIES.flatMap((e) => AGE_BRACKETS.map((a) => ({ m, e, a, key: sanitizeCacheKey(m, e, a) })))
  );

  const toDelete = all.filter(({ key }) => !SKIP.has(key));
  const skipped = all.filter(({ key }) => SKIP.has(key));

  console.log(`Resetting ${toDelete.length} combos (skipping ${skipped.length} with new approach)\n`);

  let deleted = 0;
  for (const { m, e, a, key } of toDelete) {
    const count = await deleteCombo(key);
    if (count > 0) {
      console.log(`  ✓ deleted ${count} files  ${m} / ${e} / ${a}`);
      deleted++;
    } else {
      console.log(`  - empty    ${m} / ${e} / ${a}`);
    }
  }

  console.log(`\n✅  Reset complete — ${deleted} combos cleared`);
  console.log(`\nNow run:`);
  console.log(`  PREGENERATE_SECRET=<secret> BASE_URL=http://localhost:3000 npx tsx scripts/pregenerate-offer-images.ts`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
