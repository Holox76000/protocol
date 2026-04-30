// Generate funnel morphology reference images via Gemini (text-to-image)
// Usage: node --env-file=.env.local scripts/generate-funnel-morphology-images.mjs
// Generates 96 images: 4 ages × 6 ethnicities × 4 body types
// Skips existing files — safe to re-run after partial failure

import fs from "fs";
import path from "path";

const apiKey = process.env.NANOBANANA_API_KEY;
const MODEL  = process.env.NANOBANANA_MODEL || "gemini-3.1-flash-image-preview";

if (!apiKey) { console.error("NANOBANANA_API_KEY not set"); process.exit(1); }

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const OUT_DIR    = path.resolve("public/assets/funnel/morphology");

fs.mkdirSync(OUT_DIR, { recursive: true });

// ── Combinations ─────────────────────────────────────────────────────────────

const AGES = [
  { key: "20-29",  ageDesc: "in his mid-20s",             agingDetails: "He has youthful skin, no visible aging lines or grey hair." },
  { key: "30-39",  ageDesc: "in his mid-30s",             agingDetails: "He has slightly mature features, very minimal aging signs." },
  { key: "40-49",  ageDesc: "in his mid-40s",             agingDetails: "He has natural aging details, fine lines visible, possibly slight grey at temples." },
  { key: "50plus", ageDesc: "in his early-to-mid 50s",    agingDetails: "He has distinct aging features, grey or salt-and-pepper hair, deeper expression lines, natural older appearance." },
];

const ETHNICITIES = [
  { key: "caucasian",       label: "Caucasian / White American" },
  { key: "black",           label: "Black / African-American" },
  { key: "asian-east-se",   label: "East or Southeast Asian" },
  { key: "south-asian",     label: "South Asian (Indian or Pakistani)" },
  { key: "hispanic-latino", label: "Hispanic or Latino" },
  { key: "mena",            label: "Middle Eastern or North African" },
];

const BODY_TYPES = [
  { key: "skinny",     bodyDesc: "He has a visibly slim and narrow frame, thin shoulders, minimal muscle mass, and little bulk in the chest or arms." },
  { key: "skinny-fat", bodyDesc: "He has an average-to-slim frame but with soft body composition: a slight belly, thin arms, a rounded midsection, and a soft chest with no muscle definition." },
  { key: "overweight", bodyDesc: "He is clearly heavyset with a visible protruding belly, fuller chest, broader rounded torso, and a fuller face." },
  { key: "average",    bodyDesc: "He has a mildly softened, non-athletic build — not lean but not heavy, with slight fullness around the midsection." },
];

// ── Prompt builder ────────────────────────────────────────────────────────────

function buildPrompt(age, eth, body) {
  return `A photorealistic 3:4 portrait image, 600×800 px, of a shirtless ${eth.label} man ${age.ageDesc} against a neutral grey studio background. He is wearing only plain dark casual trousers. Anchor the subject at the top: face and upper torso centered in the upper half, with the lower third kept simple and non-essential. ${age.agingDetails} ${body.bodyDesc} Expression neutral and natural. Use soft studio lighting with slight side depth, eye-level 50mm lens look, realistic skin texture. No props, no text, no logos, no extra people. Avoid distortion, over-smoothing, or exaggerated body shape. Output one clean PNG-style image.`;
}

// ── Retry helper ──────────────────────────────────────────────────────────────

async function fetchWithRetry(url, init, maxAttempts = 4) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await fetch(url, init);
    if (res.status === 429 && attempt < maxAttempts) {
      const delay = 5000 * Math.pow(3, attempt - 1);
      console.log(`  Rate limited, retrying in ${delay / 1000}s...`);
      await new Promise(r => setTimeout(r, delay));
      continue;
    }
    return res;
  }
}

// ── Main generation loop ──────────────────────────────────────────────────────

let generated = 0;
let skipped   = 0;
const total   = AGES.length * ETHNICITIES.length * BODY_TYPES.length;

console.log(`Generating ${total} images into ${OUT_DIR}\n`);

for (const age of AGES) {
  for (const eth of ETHNICITIES) {
    for (const body of BODY_TYPES) {
      const filename = `${age.key}-${eth.key}-${body.key}.png`;
      const outPath  = path.join(OUT_DIR, filename);

      if (fs.existsSync(outPath)) {
        console.log(`[skip] ${filename}`);
        skipped++;
        continue;
      }

      const prompt = buildPrompt(age, eth, body);
      console.log(`[gen]  ${filename}`);

      const res = await fetchWithRetry(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
            imageConfig: { aspectRatio: "3:4" },
            temperature: 0.3,
          },
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error(`  ✗ HTTP ${res.status}: ${err.slice(0, 200)}`);
        continue;
      }

      const json = await res.json();
      const parts = json.candidates?.[0]?.content?.parts ?? [];
      const imagePart = parts.find(p => p.inlineData?.mimeType?.startsWith("image/"));

      if (!imagePart) {
        const textPart = parts.find(p => p.text);
        console.error(`  ✗ No image in response. Text: ${textPart?.text?.slice(0, 120) ?? "(none)"}`);
        continue;
      }

      const buffer = Buffer.from(imagePart.inlineData.data, "base64");
      fs.writeFileSync(outPath, buffer);
      console.log(`  ✓ Saved (${(buffer.length / 1024).toFixed(0)} KB)`);
      generated++;

      // Small delay between calls to avoid rate limiting
      await new Promise(r => setTimeout(r, 800));
    }
  }
}

console.log(`\nDone. Generated: ${generated} · Skipped: ${skipped} · Total: ${total}`);
