import { NextResponse } from "next/server";
import { readFile, appendFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { supabaseAdmin } from "../../../../lib/supabase";

const LOG_FILE = "/tmp/offer-gen-route.log";
async function routeLog(...args: unknown[]) {
  const line = `${new Date().toISOString()} ${args.map(String).join(" ")}\n`;
  await appendFile(LOG_FILE, line).catch(() => {});
  console.log(...args);
}

export const runtime = "nodejs";

const DEFAULT_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const BUCKET = "offer-images";

/* ─── Profile descriptions ───────────────────────────────────────────────── */

// Some ethnicity labels trigger Gemini IMAGE_SAFETY consistently — use safer alternatives in prompts
const ETHNICITY_PROMPT_LABEL: Record<string, string> = {
  "Hispanic-Latino": "Latin American",
  "Asian (East / SE)": "East Asian",
  "South Asian": "South Asian",
  "MENA": "Middle Eastern",
  "Caucasian": "White European",
  "Black": "African American",
};

const MORPHOLOGY_DESC: Record<string, string> = {
  Skinny: "visibly slim frame, narrow shoulders, minimal muscle mass, little bulk in chest or arms",
  "Skinny-fat": "average frame but soft body composition: slight belly, thin arms, rounded midsection, no muscle definition",
  Overweight: "heavyset with visible protruding belly, fuller chest, broader rounded torso, fuller face",
  Average: "mildly softened non-athletic build — not lean but not heavy, slight fullness around midsection",
};

const AGE_DESC: Record<string, string> = {
  "20-29": "man in his late 20s",
  "20–29": "man in his late 20s",
  "30-39": "man in his mid 30s",
  "30–39": "man in his mid 30s",
  "40-49": "man in his mid 40s",
  "40–49": "man in his mid 40s",
  "50+": "man in his early 50s",
};

const AGE_BRACKET_MID: Record<string, number> = {
  "20-29": 27, "20–29": 27,
  "30-39": 34, "30–39": 34,
  "40-49": 44, "40–49": 44,
  "50+": 52,
};

/* ─── Ethnicity-aware name pools ─────────────────────────────────────────── */

type AgeBracket = "20-29" | "20–29" | "30-39" | "30–39" | "40-49" | "40–49" | "50+";

const NAME_POOLS: Record<string, Record<string, string[]>> = {
  Black: {
    "20-29": ["Jaylen, 24", "Marcus, 26", "DeShawn, 23"],
    "20–29": ["Jaylen, 24", "Marcus, 26", "DeShawn, 23"],
    "30-39": ["Andre, 32", "Darius, 35", "Kevin, 31"],
    "30–39": ["Andre, 32", "Darius, 35", "Kevin, 31"],
    "40-49": ["Terrence, 43", "Derrick, 46", "James, 42"],
    "40–49": ["Terrence, 43", "Derrick, 46", "James, 42"],
    "50+": ["Alex, 51", "Marcus, 53", "James, 50"],
  },
  Caucasian: {
    "20-29": ["Jake, 24", "Ryan, 26", "Tyler, 23"],
    "20–29": ["Jake, 24", "Ryan, 26", "Tyler, 23"],
    "30-39": ["Matt, 33", "Chris, 36", "Scott, 31"],
    "30–39": ["Matt, 33", "Chris, 36", "Scott, 31"],
    "40-49": ["Brian, 43", "Mark, 46", "Steve, 41"],
    "40–49": ["Brian, 43", "Mark, 46", "Steve, 41"],
    "50+": ["Paul, 52", "David, 54", "Gary, 51"],
  },
  "Asian (East / SE)": {
    "20-29": ["Kevin, 24", "Danny, 26", "Sam, 23"],
    "20–29": ["Kevin, 24", "Danny, 26", "Sam, 23"],
    "30-39": ["Jason, 33", "Eric, 35", "Tony, 32"],
    "30–39": ["Jason, 33", "Eric, 35", "Tony, 32"],
    "40-49": ["Raymond, 42", "Victor, 45", "Michael, 43"],
    "40–49": ["Raymond, 42", "Victor, 45", "Michael, 43"],
    "50+": ["James, 51", "Peter, 53", "Thomas, 50"],
  },
  "South Asian": {
    "20-29": ["Arjun, 24", "Ravi, 26", "Amir, 23"],
    "20–29": ["Arjun, 24", "Ravi, 26", "Amir, 23"],
    "30-39": ["Prashant, 33", "Vikram, 35", "Rahul, 32"],
    "30–39": ["Prashant, 33", "Vikram, 35", "Rahul, 32"],
    "40-49": ["Suresh, 43", "Deepak, 46", "Manish, 42"],
    "40–49": ["Suresh, 43", "Deepak, 46", "Manish, 42"],
    "50+": ["Ramesh, 51", "Anand, 53", "Sanjay, 52"],
  },
  "Hispanic-Latino": {
    "20-29": ["Diego, 24", "Miguel, 26", "Carlos, 23"],
    "20–29": ["Diego, 24", "Miguel, 26", "Carlos, 23"],
    "30-39": ["Alejandro, 33", "Roberto, 35", "Luis, 32"],
    "30–39": ["Alejandro, 33", "Roberto, 35", "Luis, 32"],
    "40-49": ["Ricardo, 43", "Fernando, 46", "Hector, 42"],
    "40–49": ["Ricardo, 43", "Fernando, 46", "Hector, 42"],
    "50+": ["Jorge, 52", "Ernesto, 54", "Manuel, 51"],
  },
  MENA: {
    "20-29": ["Omar, 24", "Khalid, 26", "Tariq, 23"],
    "20–29": ["Omar, 24", "Khalid, 26", "Tariq, 23"],
    "30-39": ["Hassan, 33", "Youssef, 35", "Karim, 32"],
    "30–39": ["Hassan, 33", "Youssef, 35", "Karim, 32"],
    "40-49": ["Ahmad, 43", "Samir, 46", "Nizar, 42"],
    "40–49": ["Ahmad, 43", "Samir, 46", "Nizar, 42"],
    "50+": ["Faris, 52", "Jamal, 54", "Walid, 51"],
  },
};

function getPersonalizedNames(ethnicity: string, ageBracket: string): string[] {
  const pool = NAME_POOLS[ethnicity] ?? NAME_POOLS["Caucasian"];
  return pool[ageBracket] ?? ["Alex, 30", "Chris, 32", "Sam, 31"];
}

/* ─── Valid values ───────────────────────────────────────────────────────── */

const VALID_MORPHOLOGIES = new Set(["Skinny", "Skinny-fat", "Overweight", "Average"]);
const VALID_ETHNICITIES = new Set(["Caucasian", "Black", "Asian (East / SE)", "South Asian", "Hispanic-Latino", "MENA"]);
const VALID_AGE_BRACKETS = new Set(["20-29", "20–29", "30-39", "30–39", "40-49", "40–49", "50+"]);

/* ─── Cache helpers ──────────────────────────────────────────────────────── */

function sanitizeCacheKey(morphology: string, ethnicity: string, ageBracket: string): string {
  return `${morphology}_${ethnicity}_${ageBracket}`
    .replace(/\+/g, "plus")
    .replace(/[/\\]/g, "-")
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "_");
}

const CACHED_FILES = [
  "result-1-before.png",
  "result-1-after.png",
  "result-2-before.png",
  "result-2-after.png",
  "result-3-before.png",
  "result-3-after.png",
  "portrait.png",
];

async function listCachedFiles(cacheKey: string): Promise<string[]> {
  const { data } = await supabaseAdmin.storage.from(BUCKET).list(cacheKey);
  return (data ?? []).map((f) => f.name);
}

function getPublicUrl(filePath: string): string {
  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

function buildCachedResponse(cacheKey: string, ethnicity: string, ageBracket: string) {
  const [r1b, r1a, r2b, r2a, r3b, r3a, portrait] = CACHED_FILES.map(
    (f) => getPublicUrl(`${cacheKey}/${f}`)
  );
  const names = getPersonalizedNames(ethnicity, ageBracket);
  return NextResponse.json({
    status: "done",
    result1Before: r1b, result1After: r1a,
    result2Before: r2b, result2After: r2a,
    result3Before: r3b, result3After: r3a,
    portrait,
    names,
  });
}

/* ─── Sentinel helpers ───────────────────────────────────────────────────── */

// Minimal 1×1 transparent PNG — only image/png is accepted by the storage bucket
const SENTINEL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQ" +
  "AABjkB6QAAAABJRU5ErkJggg==",
  "base64"
);

async function uploadSentinel(path: string): Promise<boolean> {
  const { error } = await supabaseAdmin.storage.from(BUCKET).upload(path, SENTINEL_PNG, {
    contentType: "image/png",
    upsert: true,
  });
  if (error) console.error(`[offer-gen] sentinel upload failed ${path}:`, error.message);
  return !error;
}

/* ─── Image helpers ──────────────────────────────────────────────────────── */

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, init: RequestInit, maxAttempts = 4): Promise<Response> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) await sleep(5_000 * Math.pow(3, attempt - 1));
    const res = await fetch(url, init);
    if (res.status !== 429) return res;
    const body = await res.clone().text();
    // Bail only on TRUE daily quota exhaustion — per-minute limits should be retried
    if (body.includes("per_day") || body.includes("limit: 0") || body.includes("billing") || (body.includes("RESOURCE_EXHAUSTED") && body.includes("quota") && body.includes("day"))) return res;
    console.warn(`[offer-personalized-images] 429 on attempt ${attempt + 1}, retrying…`);
  }
  return new Response(JSON.stringify({ error: "Rate limit exhausted." }), { status: 429 });
}

function extractImage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const r = payload as Record<string, unknown>;
  if (Array.isArray(r.candidates)) {
    for (const candidate of r.candidates) {
      const result = extractImage(candidate);
      if (result) return result;
    }
  }
  if (r.content && typeof r.content === "object") {
    const content = r.content as Record<string, unknown>;
    if (Array.isArray(content.parts)) {
      for (const part of content.parts) {
        if (!part || typeof part !== "object") continue;
        const p = part as Record<string, unknown>;
        for (const key of ["inlineData", "inline_data"]) {
          const d = p[key] as Record<string, unknown> | undefined;
          if (d && typeof d.data === "string") {
            const mime = (d.mimeType ?? d.mime_type ?? "image/png") as string;
            return `data:${mime};base64,${d.data}`;
          }
        }
      }
    }
  }
  return null;
}

async function readPublicImage(filename: string): Promise<{ base64: string; mime: string }> {
  const filePath = path.join(process.cwd(), "public", "assets", filename);
  const buffer = await readFile(filePath);
  // Resize to max 1024px on longest side to keep payloads manageable for Gemini
  const resized = await sharp(buffer)
    .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();
  return { base64: resized.toString("base64"), mime: "image/jpeg" };
}

async function generateImage(
  apiKey: string,
  parts: Array<{ type: "image"; base64: string; mime: string } | { type: "text"; text: string }>,
  nullRetries = 2
): Promise<string | null> {
  const url = `${DEFAULT_API_BASE}/models/gemini-2.5-flash-image:generateContent`;
  const contentParts = parts.map((p) => {
    if (p.type === "image") {
      return { inline_data: { mime_type: p.mime, data: p.base64 } };
    }
    return { text: p.text };
  });

  const res = await fetchWithRetry(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      contents: [{ role: "user", parts: contentParts }],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: { aspectRatio: "3:4", imageSize: "1K" },
        temperature: 0.4,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    await routeLog(`[offer-gen] Gemini ${res.status}:`, errText.slice(0, 300));
    return null;
  }
  const json = await res.json();
  const img = extractImage(json);
  if (!img) {
    const candidates = (json as Record<string, unknown>).candidates as Array<Record<string, unknown>> | undefined;
    const reason = (candidates?.[0] as Record<string, unknown>)?.finishReason;
    await routeLog(`[offer-gen] no image extracted, finishReason=${reason}`, JSON.stringify(json).slice(0, 400));
    // IMAGE_SAFETY and IMAGE_OTHER can be transient — retry up to nullRetries times
    if (nullRetries > 0) {
      await sleep(8_000);
      return generateImage(apiKey, parts, nullRetries - 1);
    }
  }
  return img;
}

async function dataUrlToUpload(
  dataUrl: string,
  storagePath: string
): Promise<boolean> {
  const match = dataUrl.match(/^data:(.+?);base64,(.+)$/);
  if (!match) return false;
  const [, , base64] = match;
  // Compress to JPEG ~80KB — images are displayed at 200px wide, 2MB PNGs are overkill
  const compressed = await sharp(Buffer.from(base64, "base64"))
    .resize(600, 900, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toBuffer();
  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(storagePath, compressed, {
      contentType: "image/jpeg",
      upsert: true,
    });
  return !error;
}

async function removeWhiteBackground(buffer: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;
  const pixels = new Uint8Array(data);
  const visited = new Uint8Array(width * height);
  const stack: number[] = [];

  const enqueue = (x: number, y: number) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const idx = y * width + x;
    if (visited[idx]) return;
    visited[idx] = 1;
    stack.push(idx);
  };

  // Seed from all 4 edges
  for (let x = 0; x < width; x++) { enqueue(x, 0); enqueue(x, height - 1); }
  for (let y = 0; y < height; y++) { enqueue(0, y); enqueue(width - 1, y); }

  const THRESHOLD = 235;
  while (stack.length > 0) {
    const idx = stack.pop()!;
    const px = idx * 4;
    const r = pixels[px], g = pixels[px + 1], b = pixels[px + 2];
    if (r >= THRESHOLD && g >= THRESHOLD && b >= THRESHOLD) {
      pixels[px + 3] = 0; // transparent
      const x = idx % width, y = Math.floor(idx / width);
      enqueue(x - 1, y); enqueue(x + 1, y); enqueue(x, y - 1); enqueue(x, y + 1);
    }
  }

  return sharp(Buffer.from(pixels), {
    raw: { width, height, channels: 4 },
  })
    .resize(500, 750, { fit: "inside", withoutEnlargement: true })
    .png({ compressionLevel: 8 })
    .toBuffer();
}

async function generatePortraitAndUpload(
  apiKey: string,
  dir: string,
  ageBracket: string,
  ethnicity: string,
  morphology: string
): Promise<boolean> {
  await routeLog("[offer-portraits] generating portrait for", ethnicity, ageBracket);

  const dataUrl = await generateImage(apiKey, [
    { type: "text", text: buildPortraitPrompt(ageBracket, ethnicity, morphology) },
  ]);

  let finalBuffer: Buffer;

  if (!dataUrl) {
    await routeLog("[offer-portraits] Gemini returned no image — using static man.png fallback");
    finalBuffer = await readFile(path.join(process.cwd(), "public", "assets", "man.png"));
  } else {
    const match = dataUrl.match(/^data:(.+?);base64,(.+)$/);
    if (!match) {
      await routeLog("[offer-portraits] malformed dataUrl — using fallback");
      finalBuffer = await readFile(path.join(process.cwd(), "public", "assets", "man.png"));
    } else {
      const rawBuffer = Buffer.from(match[2], "base64");
      try {
        finalBuffer = await removeWhiteBackground(rawBuffer);
      } catch (e) {
        await routeLog("[offer-portraits] removeWhiteBackground failed:", String(e));
        finalBuffer = rawBuffer;
      }
    }
  }

  const { error } = await supabaseAdmin.storage.from(BUCKET).upload(
    `${dir}/portrait.png`,
    finalBuffer,
    { contentType: "image/png", upsert: true }
  );
  if (error) await routeLog("[offer-portraits] upload error:", String(error));
  return !error;
}

/* ─── Prompts ────────────────────────────────────────────────────────────── */

// Fixed appearance attributes per ethnicity/age — used verbatim in both before AND after
// so the generated images look like the same person even though they're generated independently.
const APPEARANCE: Record<string, Record<string, string>> = {
  "Caucasian": {
    "20-29": "short light brown hair, fair skin, clean-shaven, defined jaw",
    "30-39": "short dark brown hair, fair skin, light stubble, defined jaw",
    "40-49": "short salt-and-pepper hair, fair skin, clean-shaven, mature features",
    "50+": "short grey hair, fair skin, clean-shaven, mature face",
  },
  "Black": {
    "20-29": "short natural hair, dark skin, clean-shaven, strong jaw",
    "30-39": "short cropped hair, dark skin, light beard, strong jaw",
    "40-49": "short cropped hair, dark skin, short beard, mature features",
    "50+": "short grey-black hair, dark skin, short beard, mature face",
  },
  "African American": {
    "20-29": "short natural hair, dark skin, clean-shaven, strong jaw",
    "30-39": "short cropped hair, dark skin, light beard, strong jaw",
    "40-49": "short cropped hair, dark skin, short beard, mature features",
    "50+": "short grey-black hair, dark skin, short beard, mature face",
  },
  "Asian (East / SE)": {
    "20-29": "short black hair, light skin, clean-shaven, oval face",
    "30-39": "short black hair, light skin, clean-shaven, defined jaw",
    "40-49": "short black hair, medium skin, clean-shaven, mature features",
    "50+": "short salt-and-pepper hair, medium skin, clean-shaven, mature face",
  },
  "East Asian": {
    "20-29": "short black hair, light skin, clean-shaven, oval face",
    "30-39": "short black hair, light skin, clean-shaven, defined jaw",
    "40-49": "short black hair, medium skin, clean-shaven, mature features",
    "50+": "short salt-and-pepper hair, medium skin, clean-shaven, mature face",
  },
  "South Asian": {
    "20-29": "short black hair, medium-brown skin, clean-shaven, strong jaw",
    "30-39": "short black hair, medium-brown skin, light beard, defined jaw",
    "40-49": "short black hair, medium-brown skin, short beard, mature features",
    "50+": "short salt-and-pepper hair, medium-brown skin, short beard, mature face",
  },
  "Hispanic-Latino": {
    "20-29": "short dark brown hair, olive skin, clean-shaven, strong jaw",
    "30-39": "short dark brown hair, olive skin, light stubble, defined jaw",
    "40-49": "short dark hair, olive skin, short beard, mature features",
    "50+": "short grey-dark hair, olive skin, short beard, mature face",
  },
  "Latin American": {
    "20-29": "short dark brown hair, olive skin, clean-shaven, strong jaw",
    "30-39": "short dark brown hair, olive skin, light stubble, defined jaw",
    "40-49": "short dark hair, olive skin, short beard, mature features",
    "50+": "short grey-dark hair, olive skin, short beard, mature face",
  },
  "MENA": {
    "20-29": "short black hair, medium-tan skin, short beard, strong jaw",
    "30-39": "short black hair, medium-tan skin, full beard, defined jaw",
    "40-49": "short dark hair, medium-tan skin, trimmed beard, mature features",
    "50+": "short grey-black hair, medium-tan skin, trimmed beard, mature face",
  },
  "Middle Eastern": {
    "20-29": "short black hair, medium-tan skin, short beard, strong jaw",
    "30-39": "short black hair, medium-tan skin, full beard, defined jaw",
    "40-49": "short dark hair, medium-tan skin, trimmed beard, mature features",
    "50+": "short grey-black hair, medium-tan skin, trimmed beard, mature face",
  },
  "White European": {
    "20-29": "short light brown hair, fair skin, clean-shaven, defined jaw",
    "30-39": "short dark brown hair, fair skin, light stubble, defined jaw",
    "40-49": "short salt-and-pepper hair, fair skin, clean-shaven, mature features",
    "50+": "short grey hair, fair skin, clean-shaven, mature face",
  },
};

// Scene compositions for the 3 pairs — described in text so no reference image is needed
const SCENE_BEFORE: string[] = [
  "bathroom mirror selfie — standing in front of a bathroom mirror, taking a photo with a smartphone, wearing a grey t-shirt and dark jeans, bathroom products visible on the counter, natural overhead lighting",
  "gym locker room — standing shirtless in front of wooden gym lockers, wearing black athletic shorts, gym benches visible in background, fluorescent overhead lighting",
  "gym against a blue concrete block wall — standing shirtless against a blue cinder block wall, wearing grey athletic shorts, a wooden bench visible to the left, overhead gym lighting",
];

const SCENE_AFTER: string[] = [
  "bathroom mirror selfie — standing in front of the same bathroom mirror, taking a photo with a smartphone, wearing a grey t-shirt and dark jeans, same bathroom products on the counter, natural overhead lighting",
  "gym locker room — standing shirtless in front of wooden gym lockers, wearing black athletic shorts, gym benches visible in background, fluorescent overhead lighting",
  "gym against a blue concrete block wall — standing shirtless against a blue cinder block wall, wearing grey athletic shorts, a wooden bench visible to the left, overhead gym lighting",
];

const BEFORE_PHYSIQUE: Record<string, string> = {
  Skinny: "visibly slim frame, narrow shoulders, thin arms, minimal muscle mass, little bulk in chest",
  "Skinny-fat": "average frame but soft: slight belly, thin arms, rounded midsection, no muscle definition",
  Overweight: "heavyset with protruding belly, fuller chest, broader rounded torso, fuller face",
  Average: "mildly soft non-athletic build, slight fullness around midsection, not lean but not heavy",
};

const AFTER_PHYSIQUE: Record<string, string> = {
  Skinny: "lean and athletic — noticeably broader shoulders, fuller chest and arms, clear V-taper, visible muscle definition. Clearly transformed from thin to fit. Not a bodybuilder — naturally athletic",
  "Skinny-fat": "lean and toned — flat stomach, defined abs, sharp jawline, visible muscle. The belly is gone. Clearly fit and healthy",
  Overweight: "notably slimmer — much reduced belly, leaner face and sharper jawline, V-taper visible. Dramatically lighter than before",
  Average: "athletic and defined — tighter midsection, visible muscle tone, lean face, broader shoulders. Clearly fit",
};

const PORTRAIT_PHYSIQUE: Record<string, string> = {
  Skinny: "lean athletic build — toned arms and chest, moderate muscle, natural V-taper. Not bulky, not thin — visibly fit",
  "Skinny-fat": "lean and defined build — flat stomach, visible muscle tone, good posture",
  Overweight: "solid athletic build — broad shoulders, strong frame, fit and healthy",
  Average: "athletic build — toned, fit, natural muscle definition",
};

function getAppearance(ethnicity: string, ageBracket: string): string {
  const ethnicLabel = ETHNICITY_PROMPT_LABEL[ethnicity] ?? ethnicity;
  const byAge = APPEARANCE[ethnicLabel] ?? APPEARANCE[ethnicity] ?? {};
  return byAge[ageBracket] ?? `${ethnicLabel} features`;
}

function buildBeforePrompt(ageBracket: string, ethnicity: string, morphology: string, pairIndex: number): string {
  const ageDesc = AGE_DESC[ageBracket] ?? "man";
  const appearance = getAppearance(ethnicity, ageBracket);
  const physique = BEFORE_PHYSIQUE[morphology] ?? morphology;
  const scene = SCENE_BEFORE[pairIndex] ?? SCENE_BEFORE[0];
  return `Generate a realistic fitness "before" photo.
Subject: a ${ageDesc} with ${appearance}, ${physique} body.
Scene: ${scene}.
Natural pose, realistic everyday photo — not cinematic, not professional photography. No text, no watermarks.`;
}

function buildAfterPrompt(ageBracket: string, ethnicity: string, morphology: string, pairIndex: number): string {
  const ageDesc = AGE_DESC[ageBracket] ?? "man";
  const age = AGE_BRACKET_MID[ageBracket] ?? 30;
  const appearance = getAppearance(ethnicity, ageBracket);
  const physique = AFTER_PHYSIQUE[morphology] ?? "athletic and fit";
  const scene = SCENE_AFTER[pairIndex] ?? SCENE_AFTER[0];
  const conservative = age >= 45 ? "The improvement is realistic for this age — natural, not extreme." : "";
  return `Generate a realistic fitness "after" photo showing a dramatic 12-week transformation.
Subject: the SAME ${ageDesc} — ${appearance} — now with a ${physique} body.
Scene: ${scene}.
The physical transformation is CLEARLY and DRAMATICALLY visible compared to the "before". ${conservative}
Realistic everyday photo — not cinematic, not professional photography, not staged. Natural lighting. No text, no watermarks.`;
}

function buildPortraitPrompt(ageBracket: string, ethnicity: string, morphology: string): string {
  const ageDesc = AGE_DESC[ageBracket] ?? "man";
  const ethnicLabel = ETHNICITY_PROMPT_LABEL[ethnicity] ?? ethnicity;
  const physique = PORTRAIT_PHYSIQUE[morphology] ?? "athletic build, fit and healthy";
  return `Studio bust portrait of a ${ethnicLabel} ${ageDesc} with a ${physique}. He is wearing a white athletic t-shirt. He is facing the camera with a neutral confident expression. Plain white studio background, soft even lighting. Framed from chest to top of head — bust shot only, not full body. No text, no logos, photorealistic.`;
}

/* ─── Core generation ────────────────────────────────────────────────────── */

const REF_PAIRS: Array<{ before: string; after: string }> = [
  { before: "5-before.png",  after: "5-after.png"  },
  { before: "2-before.png",  after: "2-after.png"  },
  { before: "14-before.png", after: "14-after.png" },
];

async function downloadStorageFile(filePath: string): Promise<{ base64: string; mime: string } | null> {
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).download(filePath);
  if (error || !data) return null;
  const buffer = Buffer.from(await data.arrayBuffer());
  const mime = data.type || "image/jpeg";
  return { base64: buffer.toString("base64"), mime };
}

async function runGeneration(
  cacheKey: string,
  ageBracket: string,
  ethnicity: string,
  morphology: string
): Promise<void> {
  const apiKey = process.env.NANOBANANA_API_KEY;
  if (!apiKey) throw new Error("NANOBANANA_API_KEY not configured");

  const dir = cacheKey;
  const existingFiles = await listCachedFiles(cacheKey);
  console.log(`[offer-gen] START ${cacheKey} existing=${JSON.stringify(existingFiles)}`);

  // Generate 3 before/after pairs — skip already-done files
  for (let i = 0; i < REF_PAIRS.length; i++) {
    const ref = REF_PAIRS[i];
    const pairNum = i + 1;
    const beforeKey = `result-${pairNum}-before.png`;
    const afterKey  = `result-${pairNum}-after.png`;

    // Before image — text-only, no reference image (avoids ethnicity drift from reference)
    if (!existingFiles.includes(beforeKey)) {
      const beforeDataUrl = await generateImage(apiKey, [
        { type: "text", text: buildBeforePrompt(ageBracket, ethnicity, morphology, i) },
      ]);
      if (!beforeDataUrl) {
        console.error(`[offer-gen] FAIL before pair ${pairNum} for ${cacheKey}`);
        throw new Error(`Before generation failed for pair ${pairNum}`);
      }
      await dataUrlToUpload(beforeDataUrl, `${dir}/${beforeKey}`);
    }

    // After image — text-only with same appearance attrs, guarantees visible transformation
    if (!existingFiles.includes(afterKey)) {
      const afterDataUrl = await generateImage(apiKey, [
        { type: "text", text: buildAfterPrompt(ageBracket, ethnicity, morphology, i) },
      ]);
      if (!afterDataUrl) {
        console.error(`[offer-gen] FAIL after pair ${pairNum} for ${cacheKey}`);
        throw new Error(`After generation failed for pair ${pairNum}`);
      }
      await dataUrlToUpload(afterDataUrl, `${dir}/${afterKey}`);
    }
  }

  // Portrait — text-only prompt, idealized "after" state, white bg removed
  if (!existingFiles.includes("portrait.png")) {
    await generatePortraitAndUpload(apiKey, dir, ageBracket, ethnicity, morphology);
  }

  // Remove sentinel
  await supabaseAdmin.storage.from(BUCKET).remove([`${dir}/_generating`]);
}

/* ─── Route handler ──────────────────────────────────────────────────────── */

// GET — serve from cache only, never triggers generation
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ageBracket = searchParams.get("age_bracket") ?? "";
    const morphology = searchParams.get("morphology") ?? "";
    const ethnicity = searchParams.get("ethnicity") ?? "";

    if (!VALID_MORPHOLOGIES.has(morphology) || !VALID_ETHNICITIES.has(ethnicity) || !VALID_AGE_BRACKETS.has(ageBracket)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const cacheKey = sanitizeCacheKey(morphology, ethnicity, ageBracket);
    const existing = await listCachedFiles(cacheKey);

    if (CACHED_FILES.every((f) => existing.includes(f))) {
      return buildCachedResponse(cacheKey, ethnicity, ageBracket);
    }

    if (existing.includes("_generating")) {
      return NextResponse.json({ status: "generating" });
    }

    return NextResponse.json({ status: "not_ready" });
  } catch (err) {
    console.error("[offer-personalized-images] GET error", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// POST — trigger generation for a specific combination (pre-generation script only)
export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      age_bracket: string;
      morphology: string;
      ethnicity: string;
      secret?: string;
    };

    if (body.secret !== process.env.PREGENERATE_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { age_bracket: ageBracket, morphology, ethnicity } = body;
    if (!VALID_MORPHOLOGIES.has(morphology) || !VALID_ETHNICITIES.has(ethnicity) || !VALID_AGE_BRACKETS.has(ageBracket)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const cacheKey = sanitizeCacheKey(morphology, ethnicity, ageBracket);
    const existing = await listCachedFiles(cacheKey);

    if (CACHED_FILES.every((f) => existing.includes(f))) {
      return NextResponse.json({ status: "done" });
    }

    if (existing.includes("_generating")) {
      return NextResponse.json({ status: "generating" });
    }

    // Clear stale error sentinel if present
    if (existing.includes("_error")) {
      const dir = cacheKey;
      await supabaseAdmin.storage.from(BUCKET).remove([`${dir}/_error`]);
    }

    const dir = cacheKey;
    await uploadSentinel(`${dir}/_generating`);

    runGeneration(cacheKey, ageBracket, ethnicity, morphology).catch(async (err) => {
      console.error("[offer-personalized-images] generation error:", String(err));
      await uploadSentinel(`${dir}/_error`);
      await supabaseAdmin.storage.from(BUCKET).remove([`${dir}/_generating`]);
    });

    return NextResponse.json({ status: "generating" });
  } catch (err) {
    console.error("[offer-personalized-images] POST error", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
