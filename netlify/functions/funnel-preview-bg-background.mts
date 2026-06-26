import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_API_BASE    = "https://generativelanguage.googleapis.com/v1beta";
const ANALYSIS_MODEL      = "gemini-2.5-flash";
const GENERATION_MODEL    = "gemini-3.1-flash-image-preview";

const BODY_ANALYSIS_RESEARCH = `
## Key Research Findings: Male Physical Attractiveness (Visual)
- [Swami & Tovée, 2005] Shoulder-to-waist ratio (SWR) ~1.6 is the strongest single predictor of male attractiveness across cultures.
- [Maisey et al., 1999] The waist-to-chest ratio (WCR) — narrow waist relative to broad chest — is the primary driver of male body attractiveness ratings.
- [Tovée et al., 1999] 8–15% body fat is optimal for male attractiveness. Even small reductions in visible belly fat sharply increase ratings.
- [Cornelissen et al., 2009] Face leanness is tightly correlated with body fat percentage. A leaner face is rated significantly more attractive.
- [Carney et al., 2010] Upright posture with an open chest signals dominance and confidence.
- [Sell et al., 2009] Upper body strength — shoulder width and torso mass — is the primary physical characteristic women use to assess dominance potential.
- [Dixson et al., 2010] Muscular but not extreme physiques are most attractive — "athletic" (not "bodybuilder") maximizes perceived attractiveness.
`.trim();

const AGE_BRACKET_MID: Record<string, number> = {
  "20–29": 25, "30–39": 34, "40–49": 44, "50+": 54,
};

const MORPHOLOGY_DESC: Record<string, string> = {
  "Skinny": "visibly slim frame, narrow shoulders, minimal muscle mass, little bulk in chest or arms",
  "Skinny-fat": "average frame but soft body composition: slight belly, thin arms, rounded midsection, no muscle definition",
  "Overweight": "heavyset with visible protruding belly, fuller chest, broader rounded torso, fuller face",
  "Average": "mildly softened non-athletic build — not lean but not heavy, slight fullness around midsection",
};

function ageContextLine(age: number): string {
  if (age <= 25) return `Physical prime (age ~${age}) — full natural transformation potential.`;
  if (age <= 35) return `Age ~${age} — strong transformation potential, realistic over 12–18 months.`;
  if (age <= 45) return `Age ~${age} — moderate potential, hormone levels declining.`;
  if (age <= 55) return `Age ~${age} — conservative ceiling. Lean and toned improvement; no dramatic muscle gains.`;
  return `Age ~${age} — subtle, age-appropriate improvements only.`;
}

function buildAnalysisPrompt(ageBracket: string, morphology: string, socialEnv: string, goals: string[]): string {
  const age = AGE_BRACKET_MID[ageBracket] ?? 30;
  const morphDesc = MORPHOLOGY_DESC[morphology] ?? morphology;

  return `You are an expert physical transformation analyst with access to peer-reviewed research on male physical attractiveness.

${BODY_ANALYSIS_RESEARCH}

---

## Client Profile
- Age range: ${ageBracket} (representative age: ~${age})
- Self-reported body type: ${morphology} — ${morphDesc}
- Transformation goals: ${goals.length > 0 ? goals.join(", ") : "general body recomposition and proportional improvement"}
- Social environment: ${socialEnv || "unspecified"}
- ${ageContextLine(age)}

---

## Your Task
Look at the photo provided. Produce a concise transformation analysis:

### What I See in the Photo
Describe objectively: shoulder width relative to waist, chest development, arm size, waist leanness, posture, facial leanness. Be specific.

### Key Transformation Goals (Top 3, ranked by attractiveness impact)
For each: what you see now, what research says, target change after 12 weeks.

### Target Physique Description
Precise visual description of what this exact person should look like after a 12-week Protocol. This feeds directly into image generation — be specific about V-taper, shoulder development, waist leanness, face definition, posture.

Be clinical and precise.`;
}

function buildGenerationPrompt(ageBracket: string, analysis: string): string {
  const age = AGE_BRACKET_MID[ageBracket] ?? 30;
  const conservative = age >= 45;

  return `Using the reference image for camera angle, background, lighting, and the subject's facial features and skin tone — generate a professional fitness photo of this same man showing the physique improvements described below.

${ageContextLine(age)}
${conservative ? "Keep improvements conservative and realistic — no dramatic muscle gains for this age group." : ""}

---

## Target Physique (apply to the reference image subject)

${analysis}

---

## Requirements
— Same face, skin tone, hair, eye color as the reference image.
— Same camera angle and background.
— Professional fitness studio lighting revealing muscle separation, V-taper, and facial definition.
— V-taper: broader shoulders, narrower waist — within 12-week natural training limits.
— Leaner jawline and cheekbone definition.
— Athletic build (not bodybuilder).`;
}

function extractText(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const r = payload as Record<string, unknown>;
  if (Array.isArray(r.candidates)) {
    for (const c of r.candidates as Record<string, unknown>[]) {
      const content = c.content as Record<string, unknown> | undefined;
      if (!content) continue;
      const parts = content.parts as Record<string, unknown>[] | undefined;
      if (!parts) continue;
      const texts = parts.filter((p) => typeof p.text === "string").map((p) => p.text as string);
      if (texts.length > 0) return texts.join("\n");
    }
  }
  return null;
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

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, init: RequestInit, maxAttempts = 4, label = "gemini"): Promise<Response> {
  let lastStatus = 0;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) {
      const delay = 5_000 * Math.pow(3, attempt - 1);
      console.log(`[${label}] 429 retry ${attempt}/${maxAttempts - 1} — waiting ${delay / 1000}s`);
      await sleep(delay);
    }
    const res = await fetch(url, init);
    if (res.status !== 429) return res;
    const body = await res.clone().text();
    if (body.includes("limit: 0") || body.includes("billing")) return res;
    lastStatus = res.status;
  }
  return new Response(JSON.stringify({ error: "Rate limit exhausted." }), { status: lastStatus || 429 });
}

const handler: Handler = async (event) => {
  console.log("[funnel-preview-bg] Starting");

  let body: {
    session_id?: string;
    photo_path?: string;
    age_bracket?: string;
    morphology?: string;
    social_environment?: string;
    goals?: string[];
    secret?: string;
  } = {};

  try {
    body = JSON.parse(event.body ?? "{}");
  } catch {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  const { session_id, photo_path, age_bracket, morphology, social_environment, goals, secret } = body;

  if (secret !== process.env.BG_FN_SECRET) {
    console.error("[funnel-preview-bg] Invalid secret");
    return { statusCode: 401, body: "Unauthorized" };
  }

  if (!session_id || !photo_path || !age_bracket || !morphology) {
    return { statusCode: 400, body: "Missing required fields" };
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const markError = async (msg: string) => {
    await supabase.from("visualization_previews").update({
      after_path: `__error:${msg.slice(0, 200)}`,
    }).eq("preview_id", session_id);
  };

  try {
    // Download photo
    const { data: photoData, error: dlError } = await supabase.storage.from("user-photos").download(photo_path);
    if (dlError || !photoData) {
      await markError("Could not download photo.");
      return { statusCode: 200, body: "done (photo dl failed)" };
    }

    const photoBuffer = Buffer.from(await photoData.arrayBuffer());
    const photoBase64 = photoBuffer.toString("base64");
    const photoMime   = photoData.type || "image/jpeg";

    const apiKey = process.env.NANOBANANA_API_KEY;
    if (!apiKey) {
      await markError("API key not configured.");
      return { statusCode: 200, body: "done (no api key)" };
    }

    const analysisUrl   = `${DEFAULT_API_BASE}/models/${ANALYSIS_MODEL}:generateContent`;
    const generationUrl = `${DEFAULT_API_BASE}/models/${GENERATION_MODEL}:generateContent`;

    // Step 1: Analysis
    console.log("[funnel-preview-bg] Step 1 — analysis");
    const analysisRes = await fetchWithRetry(analysisUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [
          { inline_data: { mime_type: photoMime, data: photoBase64 } },
          { text: buildAnalysisPrompt(age_bracket, morphology, social_environment ?? "", goals ?? []) },
        ]}],
        generationConfig: { responseModalities: ["TEXT"], temperature: 0.3, maxOutputTokens: 1200 },
      }),
    }, 4, "step1");

    const analysisRaw = await analysisRes.text();
    if (!analysisRes.ok) {
      await markError(`Step 1 failed (${analysisRes.status}): ${analysisRaw.slice(0, 100)}`);
      return { statusCode: 200, body: "done (step1 failed)" };
    }

    const analysis = extractText(JSON.parse(analysisRaw));
    if (!analysis) {
      await markError("Step 1 returned no text.");
      return { statusCode: 200, body: "done (step1 empty)" };
    }
    console.log(`[funnel-preview-bg] Step 1 complete — ${analysis.length} chars`);

    // Step 2: Image generation
    console.log("[funnel-preview-bg] Step 2 — generation");
    const generationRes = await fetchWithRetry(generationUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [
          { inline_data: { mime_type: photoMime, data: photoBase64 } },
          { text: buildGenerationPrompt(age_bracket, analysis) },
        ]}],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
          imageConfig: { aspectRatio: "3:4", imageSize: "1K" },
          temperature: 0.4,
        },
      }),
    }, 4, "step2");

    const generationRaw = await generationRes.text();
    if (!generationRes.ok) {
      await markError(`Step 2 failed (${generationRes.status}): ${generationRaw.slice(0, 100)}`);
      return { statusCode: 200, body: "done (step2 failed)" };
    }

    const afterDataUrl = extractImage(JSON.parse(generationRaw));
    if (!afterDataUrl) {
      await markError("Gemini did not return an image.");
      return { statusCode: 200, body: "done (no image)" };
    }

    // Upload after image
    const match = afterDataUrl.match(/^data:(.+?);base64,(.+)$/);
    if (!match) {
      await markError("Malformed image data URL.");
      return { statusCode: 200, body: "done (bad dataurl)" };
    }
    const [, afterMime, afterBase64] = match;
    const ext       = afterMime === "image/png" ? "png" : "jpg";
    const afterPath = `funnel/${session_id}/after.${ext}`;

    const { error: uploadError } = await supabase.storage.from("user-photos").upload(
      afterPath, Buffer.from(afterBase64, "base64"), { contentType: afterMime, upsert: true },
    );
    if (uploadError) {
      await markError(`Upload failed: ${uploadError.message}`);
      return { statusCode: 200, body: "done (upload failed)" };
    }

    // Update DB
    await supabase.from("visualization_previews").update({
      after_path: afterPath,
    }).eq("preview_id", session_id);

    console.log(`[funnel-preview-bg] Done — ${afterPath}`);
    return { statusCode: 200, body: "done" };

  } catch (err) {
    console.error("[funnel-preview-bg] unhandled error", err);
    await markError(err instanceof Error ? err.message : String(err)).catch(() => {});
    return { statusCode: 200, body: "done (error)" };
  }
};

export { handler };
