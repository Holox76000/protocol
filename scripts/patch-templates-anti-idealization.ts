// Bulk-append an ANTI-IDEALIZATION clause to every dating_templates.prompt.
// Idempotent: detects the sentinel and skips rows that already have it.
//
// The clause is a template-body-level insurance policy: even if the
// promptAnalyzer refinement fails or Gemini forgets to include the
// negative constraints, the raw template prompt carries them.

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

const SENTINEL = "ANTI-IDEALIZATION (critical — the image model has strong biases toward Hollywood beautification, resist them):";

const CLAUSE = [
  "",
  SENTINEL,
  "- DO NOT slim, sculpt, or narrow the face — preserve the natural fullness from the SELFIES (soft cheeks, any under-chin softness, real face shape).",
  "- DO NOT sharpen, angle, or taper the jaw — preserve the exact jaw shape from the SELFIES (if it's square, keep it square; if it's soft, keep it soft).",
  "- DO NOT change the eye color — if his eyes are green / hazel / grey in the SELFIES, DO NOT render them as blue. Match the exact color.",
  "- DO NOT thin the lips — preserve the exact lip fullness from the SELFIES, especially the lower lip.",
  "- DO NOT refine or straighten the nose — keep the exact nose width, bridge, and tip shape from the SELFIES.",
  "- DO NOT lighten the eyebrows to match hair color — keep them the exact color and thickness from the SELFIES (often darker than scalp hair).",
  "- DO NOT airbrush, smooth, or beautify the skin — keep pores, natural texture, any redness, and any imperfection.",
  "- DO NOT make him look younger, leaner, or more idealized than he actually is.",
  "- This is a real man, not a fashion model. Fidelity beats beautification. If you have to choose between a flattering rendering and an accurate one, choose accurate every time.",
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
      console.log(`  ↷ ${t.slug} — already has anti-idealization clause`);
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
