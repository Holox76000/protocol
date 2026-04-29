import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { getAgeRanges, bfRealisticTarget, muscleGainMultiplier } from "../../lib/attractivenessScore";
import { socialContextBlock } from "../../lib/socialContext";

// ── Types ─────────────────────────────────────────────────────────────────

interface CalibrationMetrics {
  swr: number; cwr: number; bf: number; pas: number; ti: number;
  [key: string]: unknown;
}

interface PromptParams {
  age: number;
  metrics: CalibrationMetrics;
  heightCm: number | null;
  weightKg: number | null;
  waistCm: number | null;
  trainingExperience: string | null;
  professionalEnvironment: string | null;
  professionalEnvironmentOther: string | null;
  typicalClothing: string | null;
  socialPerception: string[] | null;
}

// ── Research reference ────────────────────────────────────────────────────

const BODY_ANALYSIS_RESEARCH = `
## Key Research Findings: Male Physical Attractiveness (Visual)

### Optimal Body Proportions
- [Swami & Tovée, 2005] Shoulder-to-waist ratio (SWR) ~1.6 is the strongest single predictor of male attractiveness across cultures.
- [Maisey et al., 1999] The waist-to-chest ratio (WCR) is the primary driver of male body attractiveness ratings.
- [Lassek & Gaulin, 2009] V-taper (broad shoulders, narrow waist) signals testosterone-driven development and correlates with reproductive success.
- [Dixson et al., 2010] Muscular but not extreme physiques are most attractive — "athletic" (not "bodybuilder") maximizes perceived attractiveness.

### Body Fat & Composition
- [Tovée et al., 1999] 8–15% body fat is optimal for male attractiveness.
- [Cornelissen et al., 2009] Face leanness is tightly correlated with body fat percentage. A leaner face is rated significantly more attractive.

### Posture & Dominance
- [Carney et al., 2010] Upright posture with an open chest signals dominance and confidence.
- [Stulp et al., 2015] Postural height independently boosts attractiveness ratings.

### Shoulder & Upper Body
- [Sell et al., 2009] Upper body strength — shoulder width and torso mass — is the primary visual cue women use for dominance assessment.
- [Hughes & Gallup, 2003] Shoulder-to-hip ratio is a stronger predictor of female mate preference than height.

### Facial Structure
- [Dobson et al., 2017] Facial adiposity (fat on the face) reduces perceived attractiveness. Leaner faces are perceived as healthier and more masculine.
- [Weston et al., 2007] Jawline definition and cheekbone prominence are key markers of masculinity.
`.trim();

// ── Helpers ───────────────────────────────────────────────────────────────

function r2(v: number) { return Math.round(v * 100) / 100; }

function ageContextLine(age: number): string {
  if (age <= 25) return `Physical prime (age ${age}) — full natural transformation potential.`;
  if (age <= 35) return `Age ${age} — strong transformation potential, realistic over 12–18 months.`;
  if (age <= 45) return `Age ${age} — moderate potential, hormone levels declining.`;
  if (age <= 55) return `Age ${age} — conservative ceiling. Lean and toned improvement.`;
  return `Age ${age} — subtle, age-appropriate improvements only.`;
}

const VISUAL_BOOST = 1.25;
function visualGainMult(age: number): number {
  return Math.min(0.97, muscleGainMultiplier(age) * VISUAL_BOOST);
}

function buildAnalysisPrompt(p: PromptParams): string {
  const { age, metrics, heightCm, weightKg, waistCm } = p;
  const ageRanges = getAgeRanges(age);
  const gainMult  = visualGainMult(age);
  const bfFloor   = age <= 35 ? 9 : age <= 45 ? 11 : age <= 55 ? 13 : 15;
  const bfTarget  = Math.max(bfRealisticTarget(metrics.bf, age) - 1, bfFloor);
  const [bfMin, bfMax] = ageRanges.bf;
  const [swrMin]       = ageRanges.swr;
  const [cwrMin]       = ageRanges.cwr;
  const [pasMin]       = ageRanges.pas;
  const [tiMin]        = ageRanges.ti;

  const swrTarget = r2(metrics.swr + Math.max(0, swrMin - metrics.swr) * gainMult);
  const cwrTarget = r2(metrics.cwr + Math.max(0, cwrMin - metrics.cwr) * gainMult);
  const pasTarget = Math.min(92, metrics.pas + Math.round(20 * Math.min(gainMult + 0.2, 1)));
  const tiTarget  = r2(metrics.ti  + Math.max(0, tiMin  - metrics.ti)  * gainMult);

  const waistW    = waistCm ? Math.round(waistCm / Math.PI) : null;
  const shoulderW = waistW ? Math.round(metrics.swr * waistW) : null;
  const chestW    = waistW ? Math.round(metrics.cwr * waistW) : null;

  const metricsBlock = `
### Calibration Metrics
| Metric | Current | Optimal (age ${age}) | Target |
|--------|---------|----------------------|--------|
| SWR | ${metrics.swr} | ≥${swrMin} | ${swrTarget}${metrics.swr >= swrMin ? " ✓" : ""} |
| CWR | ${metrics.cwr} | ≥${cwrMin} | ${cwrTarget}${metrics.cwr >= cwrMin ? " ✓" : ""} |
| BF% | ${metrics.bf}% | ${bfMin}–${bfMax}% | ~${bfTarget}%${metrics.bf <= bfMax ? " ✓" : ""} |
| PAS | ${metrics.pas}/100 | ≥${pasMin} | ${pasTarget}${metrics.pas >= pasMin ? " ✓" : ""} |
| TI  | ${metrics.ti} | ≥${tiMin} | ${tiTarget}${metrics.ti >= tiMin ? " ✓" : ""} |
${shoulderW ? `\nEst. shoulder width: ~${shoulderW} cm (target ~${Math.round(swrTarget * (waistW ?? 0))} cm)` : ""}
${chestW ? `Est. chest width: ~${chestW} cm (target ~${Math.round(cwrTarget * (waistW ?? 0))} cm)` : ""}
${waistCm ? `Waist: ${waistCm} cm → target ~${Math.round(waistCm * (1 - Math.max(0, metrics.bf - bfTarget) * 0.012))} cm` : ""}
`.trim();

  const socialCtx = socialContextBlock({
    professional_environment: p.professionalEnvironment,
    professional_environment_other: p.professionalEnvironmentOther,
    typical_clothing: p.typicalClothing,
    social_perception: p.socialPerception,
  });

  return `You are an expert physical transformation analyst with access to peer-reviewed research on male physical attractiveness.

${BODY_ANALYSIS_RESEARCH}

---

## Client Data
- Age: ${age} | Height: ${heightCm ?? "—"} cm | Weight: ${weightKg ?? "—"} kg | Waist: ${waistCm ?? "—"} cm
- Training experience: ${p.trainingExperience ?? "—"}
- ${ageContextLine(age)}

${metricsBlock}

${socialCtx}

---

## Your Task
Analyse the photo and produce:

### What I See in the Photo
Describe objectively: shoulder width, chest development, arm size, waist leanness, posture, facial leanness.

### Key Weaknesses (Ranked by Impact)
Top 3–5 weaknesses by attractiveness impact. For each: what you see, what research says, specific change needed.

### Target Physique Description
Precise visual description of this exact person after optimal transformation. This feeds directly into image generation.

### Social/Environmental Fit
Comment on whether the target physique fits this person's social environment.

Be precise and clinical. This analysis feeds directly into image generation.`;
}

function buildGenerationPrompt(p: PromptParams, analysis: string): string {
  const { age } = p;
  const gainMult = visualGainMult(age);
  const socialCtx = socialContextBlock({
    professional_environment: p.professionalEnvironment,
    professional_environment_other: p.professionalEnvironmentOther,
    typical_clothing: p.typicalClothing,
    social_perception: p.socialPerception,
  });

  return `Create a realistic "after" transformation photo of this exact person. Show the upper end of what natural training achieves.

${ageContextLine(age)}
${gainMult < 0.4 ? "IMPORTANT: This person's age limits transformation potential — keep changes conservative and realistic." : ""}

${socialCtx}

---

## Transformation Brief (from expert analysis of this photo)

${analysis}

---

## Absolute Rules
— Preserve identity exactly: same face structure, skin tone, ethnicity, hair color, hair style, eye color.
— Same camera angle and background as the original photo.
— Lighting: professional fitness studio lighting — soft but directional, revealing muscle separation and definition.
— Maximise the V-taper silhouette.
— Face leanness: show jawline and cheekbone definition at the leanest realistic level.
— The result must look like a real photograph, not a digital render.
— All changes must be within physiological limits for age ${age} through natural training.
— Ground every change in the specific weaknesses from the analysis above.`;
}

// ── Gemini helpers ────────────────────────────────────────────────────────

function toDataUrl(base64: string, mimeType = "image/png") {
  return `data:${mimeType};base64,${base64}`;
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
    if (body.includes("limit: 0") || body.includes("billing")) {
      return new Response(body, { status: 429, headers: { "Content-Type": "application/json" } });
    }
    lastStatus = res.status;
  }
  return new Response(JSON.stringify({ error: "Rate limit — all retries exhausted." }), {
    status: lastStatus || 429,
    headers: { "Content-Type": "application/json" },
  });
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
            return toDataUrl(d.data, mime);
          }
        }
      }
    }
  }
  return null;
}

// ── Handler ───────────────────────────────────────────────────────────────

const handler: Handler = async (event) => {
  const requestId = crypto.randomUUID ? crypto.randomUUID() : `bg-${Date.now()}`;
  console.log(`[generate-bg] Starting job ${requestId}`);

  let body: { userId?: string; secret?: string } = {};
  try {
    body = JSON.parse(event.body ?? "{}");
  } catch {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  const { userId, secret } = body;

  if (secret !== process.env.BG_FN_SECRET) {
    console.error("[generate-bg] Invalid secret");
    return { statusCode: 401, body: "Unauthorized" };
  }

  if (!userId) {
    return { statusCode: 400, body: "userId required" };
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const markError = async (msg: string) => {
    await supabase.from("protocols").update({
      before_after_preview_path: `__error:${msg.slice(0, 200)}`,
    }).eq("user_id", userId);
  };

  try {
    // 1. Fetch data
    const [protocolRes, qrRes] = await Promise.all([
      supabase.from("protocols").select("metrics").eq("user_id", userId).maybeSingle(),
      supabase.from("questionnaire_responses")
        .select("photo_front_path, age, height_cm, weight_kg, waist_circumference_cm, training_experience, professional_environment, professional_environment_other, typical_clothing, social_perception")
        .eq("user_id", userId).maybeSingle(),
    ]);

    const metrics   = (protocolRes.data?.metrics as CalibrationMetrics | null) ?? null;
    const qr        = (qrRes.data ?? {}) as Record<string, unknown>;
    const photoPath = (qr.photo_front_path as string | null) ?? null;

    if (!photoPath || !metrics) {
      await markError("Missing photo or metrics.");
      return { statusCode: 200, body: "done (no data)" };
    }

    // 2. Download photo
    const { data: photoData, error: dlError } = await supabase.storage.from("user-photos").download(photoPath);
    if (dlError || !photoData) {
      await markError("Could not download photo.");
      return { statusCode: 200, body: "done (photo dl failed)" };
    }

    const photoBuffer = Buffer.from(await photoData.arrayBuffer());
    const photoBase64 = photoBuffer.toString("base64");
    const photoMime   = photoData.type || "image/jpeg";

    const apiKey = process.env.NANOBANANA_API_KEY;
    const model  = process.env.NANOBANANA_MODEL || "gemini-2.0-flash-preview-image-generation";
    if (!apiKey) {
      await markError("API key not configured.");
      return { statusCode: 200, body: "done (no api key)" };
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const promptParams: PromptParams = {
      age:                          (qr.age             as number | null) ?? 30,
      metrics,
      heightCm:                     (qr.height_cm       as number | null) ?? null,
      weightKg:                     (qr.weight_kg       as number | null) ?? null,
      waistCm:                      (qr.waist_circumference_cm as number | null) ?? null,
      trainingExperience:           (qr.training_experience as string | null) ?? null,
      professionalEnvironment:      (qr.professional_environment       as string | null) ?? null,
      professionalEnvironmentOther: (qr.professional_environment_other as string | null) ?? null,
      typicalClothing:              (qr.typical_clothing               as string | null) ?? null,
      socialPerception:             Array.isArray(qr.social_perception) ? qr.social_perception as string[] : null,
    };

    // 3. Step 1: Analysis
    console.log(`[generate-bg] Step 1 — analysis for ${userId}`);
    const analysisRes = await fetchWithRetry(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [
          { inline_data: { mime_type: photoMime, data: photoBase64 } },
          { text: buildAnalysisPrompt(promptParams) },
        ]}],
        generationConfig: { responseModalities: ["TEXT"], temperature: 0.3, maxOutputTokens: 1500 },
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
    console.log(`[generate-bg] Step 1 complete — ${analysis.length} chars`);

    // 4. Step 2: Image generation
    console.log(`[generate-bg] Step 2 — generation for ${userId}`);
    const generationRes = await fetchWithRetry(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [
          { inline_data: { mime_type: photoMime, data: photoBase64 } },
          { text: buildGenerationPrompt(promptParams, analysis) },
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

    // 5. Upload
    const match = afterDataUrl.match(/^data:(.+?);base64,(.+)$/);
    if (!match) {
      await markError("Malformed image data URL.");
      return { statusCode: 200, body: "done (bad dataurl)" };
    }
    const [, afterMime, afterBase64] = match;
    const afterBuffer  = Buffer.from(afterBase64, "base64");
    const ext          = afterMime === "image/png" ? "png" : "jpg";
    const storagePath  = `before-after/${userId}.${ext}`;

    const { error: uploadError } = await supabase.storage.from("user-photos").upload(
      storagePath, afterBuffer, { contentType: afterMime, upsert: true },
    );
    if (uploadError) {
      await markError(`Upload failed: ${uploadError.message}`);
      return { statusCode: 200, body: "done (upload failed)" };
    }

    // 6. Persist
    await supabase.from("protocols").update({
      before_after_preview_path: storagePath,
      before_after_analysis: analysis,
    }).eq("user_id", userId);

    console.log(`[generate-bg] Done for ${userId} — ${storagePath}`);
    return { statusCode: 200, body: "done" };

  } catch (err) {
    console.error("[generate-bg] unhandled error", err);
    await markError(err instanceof Error ? err.message : String(err)).catch(() => {});
    return { statusCode: 200, body: "done (error)" };
  }
};

export { handler };
