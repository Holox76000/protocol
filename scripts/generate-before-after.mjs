// One-shot generation script — bypasses API auth
// Usage: node --env-file=.env.local scripts/generate-before-after.mjs <userId>

import { createClient } from "@supabase/supabase-js";

const userId = process.argv[2];
if (!userId) { console.error("Usage: node scripts/generate-before-after.mjs <userId>"); process.exit(1); }

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const apiKey   = process.env.NANOBANANA_API_KEY;
const MODEL    = process.env.NANOBANANA_MODEL || "gemini-3.1-flash-image-preview";

if (!apiKey) { console.error("NANOBANANA_API_KEY not set"); process.exit(1); }

const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

// ── Fetch data ──────────────────────────────────────────────────────────────
console.log("Fetching data for", userId);
const [{ data: proto }, { data: qr }] = await Promise.all([
  supabase.from("protocols").select("metrics").eq("user_id", userId).maybeSingle(),
  supabase.from("questionnaire_responses")
    .select("photo_front_path,age,height_cm,weight_kg,waist_circumference_cm,training_experience,professional_environment,professional_environment_other,typical_clothing,social_perception")
    .eq("user_id", userId).maybeSingle(),
]);

if (!proto?.metrics) { console.error("No metrics found"); process.exit(1); }
if (!qr?.photo_front_path) { console.error("No front photo"); process.exit(1); }

const metrics   = proto.metrics;
const photoPath = qr.photo_front_path;
console.log("Photo path:", photoPath);
console.log("Metrics:", metrics);

// ── Download photo ──────────────────────────────────────────────────────────
console.log("Downloading photo...");
const { data: photoData, error: dlErr } = await supabase.storage.from("user-photos").download(photoPath);
if (dlErr || !photoData) { console.error("Download failed:", dlErr); process.exit(1); }
const photoBase64 = Buffer.from(await photoData.arrayBuffer()).toString("base64");
const photoMime   = photoData.type || "image/jpeg";
console.log("Photo downloaded:", photoMime, photoBase64.length, "bytes b64");

// ── Step 1: Analysis ────────────────────────────────────────────────────────
console.log("\nStep 1: Photo analysis...");
const step1Body = {
  contents: [{ role: "user", parts: [
    { inline_data: { mime_type: photoMime, data: photoBase64 } },
    { text: `You are an expert physical transformation analyst. Look at this photo and describe:
1. Current body composition (estimated BF%, muscle development)
2. Key physical weaknesses that impact attractiveness (shoulders, waist, posture, face leanness)
3. Target physique description for this specific person after optimal 12-week transformation
4. Be precise and clinical — this feeds into image generation.

Current metrics: SWR=${metrics.swr}, CWR=${metrics.cwr}, BF=${metrics.bf}%, PAS=${metrics.pas}/100, TI=${metrics.ti}
Age: ${qr.age || 30}` },
  ]}],
  generationConfig: { responseModalities: ["TEXT"], temperature: 0.3, maxOutputTokens: 1500 },
};

const r1 = await fetch(geminiUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
  body: JSON.stringify(step1Body),
});

const raw1 = await r1.text();
if (!r1.ok) {
  console.error("Step 1 failed:", r1.status, raw1.slice(0, 500));
  process.exit(1);
}

const payload1 = JSON.parse(raw1);
const analysis = payload1?.candidates?.[0]?.content?.parts?.filter(p => p.text)?.map(p => p.text)?.join("\n") || null;
if (!analysis) { console.error("No analysis text returned"); process.exit(1); }
console.log("Analysis length:", analysis.length, "chars");
console.log("Preview:", analysis.slice(0, 200), "...");

// ── Step 2: Image generation ────────────────────────────────────────────────
console.log("\nStep 2: Image generation (this takes 1-3 min)...");
const step2Body = {
  contents: [{ role: "user", parts: [
    { inline_data: { mime_type: photoMime, data: photoBase64 } },
    { text: `Create a realistic "after" transformation photo of this exact person. Show the best realistic result of natural training.

${analysis}

ABSOLUTE RULES:
— Preserve identity exactly: same face, skin tone, ethnicity, hair, eyes.
— Same camera angle and background.
— Professional fitness studio lighting revealing muscle definition.
— Maximize V-taper silhouette.
— Leaner face, visible jawline and cheekbones.
— Must look like a real photo, not a render.
— Age ${qr.age || 30} — physiologically realistic gains only.` },
  ]}],
  generationConfig: {
    responseModalities: ["TEXT", "IMAGE"],
    imageConfig: { aspectRatio: "3:4", imageSize: "1K" },
    temperature: 0.4,
  },
};

const r2 = await fetch(geminiUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
  body: JSON.stringify(step2Body),
});

const raw2 = await r2.text();
if (!r2.ok) {
  console.error("Step 2 failed:", r2.status, raw2.slice(0, 500));
  process.exit(1);
}

const payload2 = JSON.parse(raw2);

// Extract image
let afterDataUrl = null;
function findImage(obj) {
  if (!obj || typeof obj !== "object") return null;
  if (Array.isArray(obj)) { for (const x of obj) { const r = findImage(x); if (r) return r; } return null; }
  for (const key of ["inlineData", "inline_data"]) {
    if (obj[key]?.data) {
      const mime = obj[key].mimeType || obj[key].mime_type || "image/png";
      return `data:${mime};base64,${obj[key].data}`;
    }
  }
  for (const v of Object.values(obj)) { const r = findImage(v); if (r) return r; }
  return null;
}
afterDataUrl = findImage(payload2);

if (!afterDataUrl) {
  console.error("No image in response. Response keys:", Object.keys(payload2));
  const text2 = payload2?.candidates?.[0]?.content?.parts?.filter(p => p.text)?.map(p => p.text)?.join("\n");
  if (text2) console.log("Text response:", text2.slice(0, 300));
  process.exit(1);
}
console.log("Image generated, data URL length:", afterDataUrl.length);

// ── Upload ──────────────────────────────────────────────────────────────────
const match = afterDataUrl.match(/^data:(.+?);base64,(.+)$/);
const [, afterMime, afterBase64] = match;
const storagePath = `before-after/${userId}.${afterMime === "image/png" ? "png" : "jpg"}`;
console.log("\nUploading to", storagePath);

const { error: upErr } = await supabase.storage.from("user-photos").upload(
  storagePath, Buffer.from(afterBase64, "base64"), { contentType: afterMime, upsert: true },
);
if (upErr) { console.error("Upload failed:", upErr); process.exit(1); }

// ── Persist ─────────────────────────────────────────────────────────────────
await supabase.from("protocols").update({
  before_after_preview_path: storagePath,
  before_after_analysis: analysis,
}).eq("user_id", userId);

console.log("\n✓ Done! Path:", storagePath);
