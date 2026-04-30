// Generate funnel ethnicity reference images via Gemini (text-to-image)
// Usage: node --env-file=.env.local scripts/generate-funnel-ethnicity-images.mjs
// Generates 24 images: 4 ages × 6 ethnicities
// Skips existing files — safe to re-run after partial failure

import fs from "fs";
import path from "path";

const apiKey = process.env.NANOBANANA_API_KEY;
const MODEL  = process.env.NANOBANANA_MODEL || "gemini-3.1-flash-image-preview";

if (!apiKey) { console.error("NANOBANANA_API_KEY not set"); process.exit(1); }

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const OUT_DIR    = path.resolve("public/assets/funnel/ethnicity");

fs.mkdirSync(OUT_DIR, { recursive: true });

const AGES = [
  { key: "20-29",  ageDesc: "in his mid-20s",          agingDetails: "He has youthful skin, no visible aging lines or grey hair." },
  { key: "30-39",  ageDesc: "in his mid-30s",          agingDetails: "He has slightly mature features, very minimal aging signs." },
  { key: "40-49",  ageDesc: "in his mid-40s",          agingDetails: "He has natural aging details, fine lines visible, possibly slight grey at temples." },
  { key: "50plus", ageDesc: "in his early-to-mid 50s", agingDetails: "He has distinct aging features, grey or salt-and-pepper hair, deeper expression lines, natural older appearance." },
];

const ETHNICITIES = [
  { key: "caucasian",       desc: "Caucasian / White American man with fair skin and European features" },
  { key: "black",           desc: "Black / African-American man with dark skin and African features" },
  { key: "asian-east-se",   desc: "East or Southeast Asian man with typical East Asian features" },
  { key: "south-asian",     desc: "South Asian man (Indian or Pakistani) with medium-brown skin" },
  { key: "hispanic-latino", desc: "Hispanic or Latino man with olive skin and Latin American features" },
  { key: "mena",            desc: "Middle Eastern or North African man with olive to tan skin and MENA features" },
];

function buildPrompt(age, eth) {
  return `A photorealistic 3:4 portrait image, 600×800 px, of a well-dressed ${eth.desc} ${age.ageDesc} against a neutral grey studio background. Anchor the subject at the top: face and upper torso centered in the upper half, with the lower third kept simple and non-essential. ${age.agingDetails} He has a mildly softened, non-athletic build with slight fullness visible in the suit silhouette — not slim but not heavy. He wears an elegant dark suit, white shirt, and classic tie. Expression composed and professional. Use soft studio lighting with slight side depth, eye-level 50mm lens look, realistic skin texture, and accurate fabric folds. No props, no text, no logos, no extra people. Avoid distortion, over-smoothing, or exaggerated body shape. Output one clean PNG-style image.`;
}

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

const total = AGES.length * ETHNICITIES.length;
console.log(`Generating ${total} ethnicity images into ${OUT_DIR}\n`);

for (const age of AGES) {
  for (const eth of ETHNICITIES) {
    const filename = `${age.key}-${eth.key}.png`;
    const outPath  = path.join(OUT_DIR, filename);

    if (fs.existsSync(outPath)) {
      console.log(`[skip] ${filename}`);
      continue;
    }

    console.log(`[gen]  ${filename}`);

    const res = await fetchWithRetry(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: buildPrompt(age, eth) }] }],
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
      console.error(`  ✗ No image. Text: ${textPart?.text?.slice(0, 120) ?? "(none)"}`);
      continue;
    }

    const buffer = Buffer.from(imagePart.inlineData.data, "base64");
    fs.writeFileSync(outPath, buffer);
    console.log(`  ✓ Saved (${(buffer.length / 1024).toFixed(0)} KB)`);

    await new Promise(r => setTimeout(r, 800));
  }
}

console.log("\nDone.");
