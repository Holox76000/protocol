// Bulk-append an EXPRESSION MICRO-FEATURES clause to every dating_templates.prompt.
// Idempotent: detects the sentinel and skips rows that already have it.

import { readFileSync } from "fs";
import { resolve } from "path";
const env = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
for (const line of env.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)/);
  if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
}

import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

// Sentinel used to detect prior application — if a prompt already contains
// this marker we skip it so re-runs are safe.
const SENTINEL = "EXPRESSION MICRO-FEATURES (match the SELFIES, not the template subject):";

const EXPRESSION_CLAUSE = [
  "",
  SENTINEL,
  "- The OVERALL EMOTION (smiling / neutral / pensive / laughing / etc.) matches this scene as described above.",
  "- BUT the MICRO-FEATURES of that expression must be copied from the SELFIES, NOT from the template subject:",
  "  • dimple presence — if he has no dimples in his selfies, DO NOT add them (even if the template subject has deep ones)",
  "  • smile shape and asymmetry — reproduce his personal smile curve, not a generic one",
  "  • teeth pattern — how many teeth show, top / bottom / both, any gap or slight imperfection visible in his selfies",
  "  • eye crinkle — if his eyes don't crinkle when smiling, do not add crow's feet",
  "  • cheek lift, forehead lines, brow movement — match HIS personal expression mechanics",
  "- Preserve his personal expression signature. A friend must recognize how HE smiles, not a stranger's smile pasted on his face.",
].join("\n");

async function main() {
  const { data: templates, error } = await sb
    .from("dating_templates")
    .select("id, slug, prompt");
  if (error) { console.error(error); process.exit(1); }

  let patched = 0, skipped = 0;
  for (const t of templates ?? []) {
    if (typeof t.prompt !== "string") continue;
    if (t.prompt.includes(SENTINEL)) {
      console.log(`  ↷ ${t.slug} — already has expression clause`);
      skipped++;
      continue;
    }
    const newPrompt = `${t.prompt.trimEnd()}\n${EXPRESSION_CLAUSE}`;
    const { error: upErr } = await sb
      .from("dating_templates")
      .update({ prompt: newPrompt })
      .eq("id", t.id);
    if (upErr) {
      console.error(`  ✗ ${t.slug} — ${upErr.message}`);
      continue;
    }
    console.log(`  ✓ ${t.slug} — clause appended`);
    patched++;
  }
  console.log(`\nPatched ${patched}, skipped ${skipped} of ${templates?.length ?? 0}.`);
}
main().catch(e => { console.error(e); process.exit(1); });
