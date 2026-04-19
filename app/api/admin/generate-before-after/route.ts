import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { requireAdmin } from "../../../../lib/adminAuth";
import { supabaseAdmin } from "../../../../lib/supabase";
import type { CalibrationMetrics } from "../../../admin/orders/[userId]/PhotoCalibrator";
import { getAgeRanges, bfRealisticTarget, muscleGainMultiplier } from "../../../../lib/attractivenessScore";
import { socialContextBlock } from "../../../../lib/socialContext";

export const runtime = "nodejs";
export const maxDuration = 180; // two Gemini calls — allow more time

const DEFAULT_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_MODEL    = "gemini-3.1-flash-image-preview";

// ── Condensed research reference for visual body analysis ─────────────────
// Extracted from the full SCIENTIFIC_REFERENCE_BASE — focused on findings
// that are directly observable in a photograph.

const BODY_ANALYSIS_RESEARCH = `
## Key Research Findings: Male Physical Attractiveness (Visual)

### Optimal Body Proportions
- [Swami & Tovée, 2005] Shoulder-to-waist ratio (SWR) ~1.6 is the strongest single predictor of male attractiveness across cultures. Women rate men with high SWR significantly more attractive regardless of height or weight.
- [Maisey et al., 1999] The waist-to-chest ratio (WCR) — narrow waist relative to broad chest — is the primary driver of male body attractiveness ratings.
- [Lassek & Gaulin, 2009] V-taper (broad shoulders, narrow waist) signals testosterone-driven development and correlates with reproductive success. This shape is preferred cross-culturally.
- [Fan et al., 2004] A low waist-to-chest ratio combined with moderate body mass signals peak physical condition. The visual V-taper has higher predictive power than BMI alone.
- [Dixson et al., 2010] Muscular but not extreme physiques are most attractive — "athletic" (not "bodybuilder") maximizes perceived attractiveness and dominance simultaneously.

### Body Fat & Composition
- [Tovée et al., 1999] 8–15% body fat is optimal for male attractiveness. Subcutaneous fat on the abdomen and face reduces perceived attractiveness nonlinearly — even small reductions in visible belly fat sharply increase ratings.
- [Cornelissen et al., 2009] Face leanness is tightly correlated with body fat percentage. A leaner face (more visible jawline, cheekbones, less cheek fat) is rated as significantly more attractive and healthier.
- [Sorokowski et al., 2012] Waist leanness combined with broad shoulders creates the strongest possible male attractiveness signal — more powerful than either alone.

### Posture & Dominance
- [Carney et al., 2010] Upright posture with an open chest signals dominance, confidence, and testosterone. Slouched posture reduces attractiveness and perceived social status significantly.
- [Stulp et al., 2015] Postural height (appearing taller through upright stance) independently boosts attractiveness ratings — men who stand straighter are perceived as taller and more dominant.
- [Mignault & Chaudhuri, 2004] Forward head posture and rounded shoulders are consistent markers of lower social status and reduced physical attractiveness.

### Shoulder & Upper Body Development
- [Sell et al., 2009] Upper body strength — signaled visually through shoulder width and torso mass — is the primary physical characteristic women use to assess male fighting ability and dominance potential.
- [Watkins et al., 2017] Men with broader shoulders relative to their waist are rated as more attractive, dominant, and healthier. The effect is robust across ages and cultures.
- [Hughes & Gallup, 2003] Shoulder-to-hip ratio is a stronger predictor of female mate preference than height, weight, or facial symmetry alone.

### Facial Structure & Leanness
- [Dobson et al., 2017] Facial adiposity (fat on the face) is rated as a reliable cue to health risk. Leaner faces are perceived as healthier, more masculine, and more attractive.
- [Coetzee et al., 2009] Weight loss in the face has a disproportionately large effect on perceived attractiveness — the face is the first area women notice when assessing physical condition.
- [Weston et al., 2007] Jawline definition and cheekbone prominence — both enhanced by lower body fat — are key markers of masculinity and immune function.

### Symmetry & Development
- [Gangestad & Thornhill, 1997] Bilateral symmetry (symmetric shoulders, arms, torso) is a reliable indicator of developmental health and genetic quality. Visible asymmetry reduces attractiveness ratings.
- [Rhodes et al., 2001] Facial symmetry correlates strongly with facial attractiveness. Body symmetry is independently attractive even when faces are obscured.
`.trim();

// ── Helpers ───────────────────────────────────────────────────────────────

function r2(v: number) { return Math.round(v * 100) / 100; }
function pct(from: number, to: number) { return Math.round(Math.abs((to - from) / from) * 100); }

function ageContextLine(age: number): string {
  if (age <= 25) return `Physical prime (age ${age}) — full natural transformation potential.`;
  if (age <= 35) return `Age ${age} — strong transformation potential, realistic over 12–18 months.`;
  if (age <= 45) return `Age ${age} — moderate potential, hormone levels declining. Athletic but not maximally bulky.`;
  if (age <= 55) return `Age ${age} — conservative ceiling. Lean and toned improvement; no dramatic muscle gains.`;
  if (age <= 65) return `Age ${age} — subtle, age-appropriate improvements only. Leaner, better posture, maintained muscle.`;
  return `Age ${age} — very subtle improvements. No large muscle gains — physiologically unrealistic.`;
}

interface PromptParams {
  age:                          number;
  metrics:                      CalibrationMetrics;
  heightCm:                     number | null;
  weightKg:                     number | null;
  waistCm:                      number | null;
  trainingExperience:           string | null;
  professionalEnvironment:      string | null;
  professionalEnvironmentOther: string | null;
  typicalClothing:              string | null;
  socialPerception:             string[] | null;
}

// ── STEP 1: Analysis prompt ───────────────────────────────────────────────
// Asks Gemini to look at the photo and identify weaknesses using the research.

function buildAnalysisPrompt(p: PromptParams): string {
  const { age, metrics, heightCm, weightKg, waistCm } = p;
  const ageRanges = getAgeRanges(age);
  const gainMult  = muscleGainMultiplier(age);

  const bfTarget  = bfRealisticTarget(metrics.bf, age);
  const [bfMin, bfMax]  = ageRanges.bf;
  const [swrMin]        = ageRanges.swr;
  const [cwrMin]        = ageRanges.cwr;
  const [pasMin]        = ageRanges.pas;
  const [tiMin]         = ageRanges.ti;

  const swrTarget = r2(metrics.swr + Math.max(0, swrMin - metrics.swr) * gainMult);
  const cwrTarget = r2(metrics.cwr + Math.max(0, cwrMin - metrics.cwr) * gainMult);
  const pasTarget = Math.min(92, metrics.pas + Math.round(20 * Math.min(gainMult + 0.2, 1)));
  const tiTarget  = r2(metrics.ti  + Math.max(0, tiMin  - metrics.ti)  * gainMult);

  // Estimate physical widths from waist circumference
  const waistW = waistCm ? Math.round(waistCm / Math.PI) : null;
  const shoulderW = waistW ? Math.round(metrics.swr * waistW) : null;
  const chestW    = waistW ? Math.round(metrics.cwr * waistW) : null;

  const metricsBlock = `
### Calibration Metrics (computed from photo measurements)
| Metric | Current | Optimal range (age ${age}) | Realistic target |
|--------|---------|---------------------------|-----------------|
| Shoulder-Waist Ratio (SWR) | ${metrics.swr} | ≥${swrMin} | ${swrTarget}${metrics.swr >= swrMin ? " ✓" : ""} |
| Chest-Waist Ratio (CWR) | ${metrics.cwr} | ≥${cwrMin} | ${cwrTarget}${metrics.cwr >= cwrMin ? " ✓" : ""} |
| Body Fat % (BF) | ${metrics.bf}% | ${bfMin}–${bfMax}% | ~${bfTarget}%${metrics.bf <= bfMax ? " ✓" : ""} |
| Posture Score (PAS) | ${metrics.pas}/100 | ≥${pasMin} | ${pasTarget}${metrics.pas >= pasMin ? " ✓" : ""} |
| Taper Index (TI) | ${metrics.ti} | ≥${tiMin} | ${tiTarget}${metrics.ti >= tiMin ? " ✓" : ""} |
${shoulderW ? `\nEstimated shoulder width: ~${shoulderW} cm (target ~${Math.round(swrTarget * (waistW ?? 0))} cm)` : ""}
${chestW ? `Estimated chest width:    ~${chestW} cm (target ~${Math.round(cwrTarget * (waistW ?? 0))} cm)` : ""}
${waistCm ? `Waist circumference: ${waistCm} cm → target ~${Math.round(waistCm * (1 - Math.max(0, metrics.bf - bfTarget) * 0.012))} cm` : ""}
`.trim();

  const socialCtx = socialContextBlock({
    professional_environment: p.professionalEnvironment,
    professional_environment_other: p.professionalEnvironmentOther,
    typical_clothing: p.typicalClothing,
    social_perception: p.socialPerception,
  });

  return `You are an expert physical transformation analyst. You have access to peer-reviewed research on male physical attractiveness.

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
Look carefully at the photo provided. Using the research findings above and the calibration metrics, produce a precise visual analysis in the following format:

### What I See in the Photo
Describe objectively what you observe: current shoulder width, chest development, arm size, waist leanness, posture, facial leanness. Be specific — no generic statements.

### Key Weaknesses (Ranked by Impact)
List the top 3–5 physical weaknesses you observe, ranked by their impact on attractiveness according to the research. For each:
- What you see visually
- What the research says about this trait
- The specific change needed (e.g., "shoulders need to appear X% broader", "waist fat concentration visible above iliac crest")

### Target Physique Description
Write a precise visual description of what this exact person should look like after an optimal transformation — describing shoulders, arms, chest, waist/midsection, posture, and face leanness in concrete visual terms. This will be used as the direct brief for image generation.

### Social/Environmental Fit
Comment on whether the target physique is appropriate for this person's professional and social environment. Flag any adjustments needed.

Be precise, clinical, and direct. This analysis will feed directly into image generation — vague descriptions produce vague results.`;
}

// ── STEP 2: Generation prompt ─────────────────────────────────────────────
// Takes the analysis from step 1 and converts it into a tight image generation brief.

function buildGenerationPrompt(p: PromptParams, analysis: string): string {
  const { age } = p;
  const gainMult = muscleGainMultiplier(age);

  const socialCtx = socialContextBlock({
    professional_environment: p.professionalEnvironment,
    professional_environment_other: p.professionalEnvironmentOther,
    typical_clothing: p.typicalClothing,
    social_perception: p.socialPerception,
  });

  return `Create a realistic "after" transformation photo of this exact person.

${ageContextLine(age)}
${gainMult < 0.4 ? "IMPORTANT: This person's age limits transformation potential — keep all changes subtle and realistic. No dramatic muscle gains." : ""}

${socialCtx}

---

## Transformation Brief (from expert analysis of this photo)

${analysis}

---

## Absolute Rules
— Preserve identity exactly: same face structure, skin tone, ethnicity, hair color, hair style, eye color. This must be recognizably the same person.
— Same camera angle and background as the original photo.
— Lighting: use clean, even front-facing light that maximises the visibility of body composition details — muscle separation, shoulder roundness, chest definition, waist leanness, and facial bone structure. If the original lighting is flat, dim, or creates shadows that hide these details, upgrade it. The lighting should look like a professional fitness photo studio: soft but directional, with slight shadow depth to reveal muscle contours and the V-taper silhouette. Never flat, never blown out.
— The result must look like a real photograph — not a digital render, not a different person.
— All changes must be proportional to what is physiologically achievable at age ${age} through natural training.
— Do NOT make the person look like a generic fitness model. Every change must be grounded in the specific weaknesses identified in the analysis above.
— The transformation is the realistic maximum achievable, not a fantasy physique.`;
}

// ── Gemini API helpers ────────────────────────────────────────────────────

function toDataUrl(base64: string, mimeType = "image/png") {
  return `data:${mimeType};base64,${base64}`;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  maxAttempts = 4,
  label = "gemini",
): Promise<Response> {
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

function extractTextFromGemini(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const r = payload as Record<string, unknown>;
  if (Array.isArray(r.candidates)) {
    for (const c of r.candidates as Record<string, unknown>[]) {
      const content = c.content as Record<string, unknown> | undefined;
      if (!content) continue;
      const parts = content.parts as Record<string, unknown>[] | undefined;
      if (!parts) continue;
      const texts = parts
        .filter((p) => typeof p.text === "string")
        .map((p) => p.text as string);
      if (texts.length > 0) return texts.join("\n");
    }
  }
  return null;
}

function extractImageFromGemini(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const r = payload as Record<string, unknown>;

  if (Array.isArray(r.candidates)) {
    for (const candidate of r.candidates) {
      const result = extractImageFromGemini(candidate);
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

// ── Main route ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();

  try {
    await requireAdmin();

    const { userId } = (await request.json()) as { userId: string };
    if (!userId) {
      return NextResponse.json({ error: "userId is required." }, { status: 400 });
    }

    // 1. Fetch user data
    const [protocolRes, qrRes] = await Promise.all([
      supabaseAdmin
        .from("protocols")
        .select("metrics, before_after_preview_path")
        .eq("user_id", userId)
        .maybeSingle(),
      supabaseAdmin
        .from("questionnaire_responses")
        .select("photo_front_path, age, height_cm, weight_kg, waist_circumference_cm, training_experience, professional_environment, professional_environment_other, typical_clothing, social_perception")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    const metrics    = (protocolRes.data?.metrics as CalibrationMetrics | null) ?? null;
    const qr         = (qrRes.data ?? {}) as Record<string, unknown>;
    const photoPath  = (qr.photo_front_path as string | null) ?? null;

    if (!photoPath) {
      return NextResponse.json({ error: "No front photo found for this user." }, { status: 404 });
    }
    if (!metrics) {
      return NextResponse.json({ error: "No calibration metrics found. Calibrate first." }, { status: 404 });
    }

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

    // 2. Download original photo
    const { data: photoData, error: dlError } = await supabaseAdmin.storage
      .from("user-photos")
      .download(photoPath);

    if (dlError || !photoData) {
      return NextResponse.json({ error: "Could not download user photo.", detail: dlError?.message }, { status: 500 });
    }

    const photoBuffer = Buffer.from(await photoData.arrayBuffer());
    const photoBase64 = photoBuffer.toString("base64");
    const photoMime   = photoData.type || "image/jpeg";

    const apiKey = process.env.NANOBANANA_API_KEY;
    const model  = process.env.NANOBANANA_MODEL || DEFAULT_MODEL;

    if (!apiKey) {
      return NextResponse.json({ error: "NANOBANANA_API_KEY not configured." }, { status: 503 });
    }

    const geminiUrl = `${DEFAULT_API_BASE}/models/${model}:generateContent`;

    // ── STEP 1: Photo analysis (text only) ──────────────────────────────────
    console.log(`[generate-before-after] Step 1 — analysing photo for ${userId}`);

    const analysisRes = await fetchWithRetry(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [
            { inline_data: { mime_type: photoMime, data: photoBase64 } },
            { text: buildAnalysisPrompt(promptParams) },
          ],
        }],
        generationConfig: {
          responseModalities: ["TEXT"],
          temperature: 0.3,
          maxOutputTokens: 1500,
        },
      }),
    }, 4, "step1-analysis");

    const analysisRaw = await analysisRes.text();

    if (!analysisRes.ok) {
      console.error("[generate-before-after] Step 1 failed", { requestId, status: analysisRes.status, body: analysisRaw.slice(0, 500) });
      return NextResponse.json({ error: "Photo analysis failed.", detail: analysisRaw.slice(0, 400) }, { status: analysisRes.status });
    }

    const analysisPayload = JSON.parse(analysisRaw);
    const analysis = extractTextFromGemini(analysisPayload);

    if (!analysis) {
      console.error("[generate-before-after] Step 1 returned no text", { requestId });
      return NextResponse.json({ error: "Photo analysis returned no content.", requestId }, { status: 502 });
    }

    console.log(`[generate-before-after] Step 1 complete — analysis length: ${analysis.length} chars`);

    // ── STEP 2: Image generation ─────────────────────────────────────────────
    console.log(`[generate-before-after] Step 2 — generating after image for ${userId}`);

    const generationRes = await fetchWithRetry(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [
            { inline_data: { mime_type: photoMime, data: photoBase64 } },
            { text: buildGenerationPrompt(promptParams, analysis) },
          ],
        }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
          imageConfig: { aspectRatio: "3:4", imageSize: "1K" },
          temperature: 0.4,
        },
      }),
    }, 4, "step2-generation");

    const generationRaw = await generationRes.text();

    if (!generationRes.ok) {
      console.error("[generate-before-after] Step 2 failed", { requestId, status: generationRes.status, body: generationRaw.slice(0, 500) });
      return NextResponse.json({ error: "Image generation failed.", detail: generationRaw.slice(0, 400) }, { status: generationRes.status });
    }

    const generationPayload = JSON.parse(generationRaw);
    const afterDataUrl = extractImageFromGemini(generationPayload);

    if (!afterDataUrl) {
      return NextResponse.json({ error: "Gemini did not return an image.", requestId }, { status: 502 });
    }

    // 3. Upload generated "after" image
    const match = afterDataUrl.match(/^data:(.+?);base64,(.+)$/);
    if (!match) {
      return NextResponse.json({ error: "Generated image data URL is malformed." }, { status: 500 });
    }
    const [, afterMime, afterBase64] = match;
    const afterBuffer  = Buffer.from(afterBase64, "base64");
    const ext          = afterMime === "image/png" ? "png" : "jpg";
    const storagePath  = `before-after/${userId}.${ext}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("user-photos")
      .upload(storagePath, afterBuffer, { contentType: afterMime, upsert: true });

    if (uploadError) {
      console.error("[generate-before-after] storage upload failed", uploadError);
      return NextResponse.json({ error: "Failed to save generated image.", detail: uploadError.message }, { status: 500 });
    }

    // 4. Persist: save storage path + analysis text
    await supabaseAdmin
      .from("protocols")
      .update({
        before_after_preview_path: storagePath,
        before_after_analysis: analysis,
      })
      .eq("user_id", userId);

    // 5. Return signed URLs
    const [beforeSigned, afterSigned] = await Promise.all([
      supabaseAdmin.storage.from("user-photos").createSignedUrl(photoPath,   3600),
      supabaseAdmin.storage.from("user-photos").createSignedUrl(storagePath, 3600),
    ]);

    return NextResponse.json({
      beforeUrl: beforeSigned.data?.signedUrl ?? null,
      afterUrl:  afterSigned.data?.signedUrl  ?? null,
      analysis,
      requestId,
    });
  } catch (err) {
    console.error("[generate-before-after] unhandled error", { requestId, err });
    return NextResponse.json(
      { error: "Server error.", detail: err instanceof Error ? err.message : String(err), requestId },
      { status: 500 }
    );
  }
}

// Re-generate signed URLs for an already-generated preview
export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId is required." }, { status: 400 });

    const [protocolRes, qrRes] = await Promise.all([
      supabaseAdmin.from("protocols").select("before_after_preview_path, before_after_analysis").eq("user_id", userId).maybeSingle(),
      supabaseAdmin.from("questionnaire_responses").select("photo_front_path").eq("user_id", userId).maybeSingle(),
    ]);

    const previewPath = protocolRes.data?.before_after_preview_path as string | null;
    const photoPath   = qrRes.data?.photo_front_path                as string | null;
    const analysis    = (protocolRes.data?.before_after_analysis    as string | null) ?? null;

    if (!previewPath || !photoPath) {
      return NextResponse.json({ beforeUrl: null, afterUrl: null, analysis: null });
    }

    const [before, after] = await Promise.all([
      supabaseAdmin.storage.from("user-photos").createSignedUrl(photoPath,   3600),
      supabaseAdmin.storage.from("user-photos").createSignedUrl(previewPath, 3600),
    ]);

    return NextResponse.json({
      beforeUrl: before.data?.signedUrl ?? null,
      afterUrl:  after.data?.signedUrl  ?? null,
      analysis,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
