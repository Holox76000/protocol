// Bulk-append a WHOLE-BODY SKIN TONE clause to every dating_templates.prompt.
// Idempotent: detects the sentinel and skips rows that already have it.
//
// Fixes a common face-swap artifact where the face gets swapped but the
// neck / arms / hands keep the template subject's original skin tone,
// creating a visible tone break at the jawline.

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

const SENTINEL = "WHOLE-BODY SKIN TONE (critical — do not leave the template subject's tone on non-face skin):";

const CLAUSE = [
  "",
  SENTINEL,
  "- Apply the SELFIES' exact skin tone AND undertone (warm / cool / neutral / golden / olive / red-tinted) to ALL VISIBLE SKIN in the output, not just the face.",
  "- This means: face, neck, throat, ears, chest (if the shirt neckline shows it), collarbones, shoulders, upper arms, forearms, elbows, wrists, hands, fingers, knuckles — everything.",
  "- The template subject's skin tone must be ENTIRELY overridden across the whole body. Do not blend or average with the template subject's tone.",
  "- The transition at the jawline, hairline, and neck must be SEAMLESS. NO visible tone break, NO color mismatch, NO hard edge where the face meets the neck.",
  "- Preserve any tan lines, natural redness (cheeks, nose bridge, ears, knuckles), freckling density, and sun exposure patterns from the SELFIES.",
  "- If the SELFIES only show the face, extrapolate the same tone (with slight natural body variation) to the rest of the visible skin — do not use the template's tone as a fallback.",
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
      console.log(`  ↷ ${t.slug} — already has whole-body skin tone clause`);
      skipped++;
      continue;
    }
    const newPrompt = `${t.prompt.trimEnd()}\n${CLAUSE}`;
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
