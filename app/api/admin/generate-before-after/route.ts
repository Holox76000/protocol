import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { requireAdmin } from "../../../../lib/adminAuth";
import { supabaseAdmin } from "../../../../lib/supabase";
import type { CalibrationMetrics } from "../../../admin/orders/[userId]/PhotoCalibrator";
import { getAgeRanges, bfRealisticTarget, muscleGainMultiplier } from "../../../../lib/attractivenessScore";
import { socialContextBlock } from "../../../../lib/socialContext";

export const runtime = "nodejs";
export const maxDuration = 120;

const DEFAULT_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_MODEL    = "gemini-2.5-flash-image";

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

function visualGainMult(age: number): number {
  return muscleGainMultiplier(age);
}

function buildAnalysisPrompt(p: PromptParams): string {
  const { age, metrics, heightCm, weightKg, waistCm } = p;
  const ageRanges = getAgeRanges(age);
  const gainMult  = visualGainMult(age);

  // Drop BF% 1pt lower than the conservative floor — visible leanness is the #1 visual driver
  const bfFloor  = age <= 35 ? 9 : age <= 45 ? 11 : age <= 55 ? 13 : 15;
  const bfTarget = Math.max(bfRealisticTarget(metrics.bf, age) - 1, bfFloor);
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
  const gainMult = visualGainMult(age);

  const socialCtx = socialContextBlock({
    professional_environment: p.professionalEnvironment,
    professional_environment_other: p.professionalEnvironmentOther,
    typical_clothing: p.typicalClothing,
    social_perception: p.socialPerception,
  });

  return `Create a realistic "after" transformation photo of this exact person. Show optimistic but realistic 12-week progress — credible, not the absolute ceiling.

${ageContextLine(age)}
${gainMult < 0.4 ? "IMPORTANT: This person's age limits transformation potential — keep changes conservative and realistic. No dramatic muscle gains." : ""}

${socialCtx}

---

## Transformation Brief (from expert analysis of this photo)

${analysis}

---

## Absolute Rules
— Preserve identity exactly: same face structure, skin tone, ethnicity, hair color, hair style, eye color. This must be recognizably the same person.
— Same camera angle and background as the original photo.
— Lighting: use professional fitness studio lighting — soft but directional, with slight shadow depth that reveals muscle separation, shoulder roundness, chest definition, waist leanness, and facial bone structure. Upgrade flat or dim original lighting. Never flat, never blown out.
— Show the natural V-taper improvement that results from the specific changes in the analysis above — broader shoulders, narrower waist — without exaggerating beyond what's visible at 12 weeks.
— Face leanness: show the jawline and cheekbone definition at the leanest realistic level for this person's body fat target. The face should look noticeably leaner and sharper.
— The result must look like a real photograph, not a digital render or a different person.
— All changes must be within physiological limits for age ${age} through natural training at 12 weeks.
— Ground every change in the specific weaknesses from the analysis above. Do not produce a generic fitness model.`;
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

// ── Shared generation logic (used in dev sync path) ──────────────────────

async function runGenerationInline(
  userId: string,
  photoPath: string,
  metrics: CalibrationMetrics,
  qr: Record<string, unknown>,
): Promise<Response> {
  const { data: photoData, error: dlError } = await supabaseAdmin.storage.from("user-photos").download(photoPath);
  if (dlError || !photoData) {
    return NextResponse.json({ error: "Could not download user photo.", detail: dlError?.message }, { status: 500 });
  }

  const photoBuffer = Buffer.from(await photoData.arrayBuffer());
  const photoBase64 = photoBuffer.toString("base64");
  const photoMime   = photoData.type || "image/jpeg";

  const apiKey = process.env.NANOBANANA_API_KEY;
  const model  = process.env.NANOBANANA_MODEL || DEFAULT_MODEL;
  if (!apiKey) return NextResponse.json({ error: "NANOBANANA_API_KEY not configured." }, { status: 503 });

  const geminiUrl = `${DEFAULT_API_BASE}/models/${model}:generateContent`;
  const promptParams: PromptParams = {
    age:                          (qr.age             as number | null) ?? 30,
    metrics,
    heightCm:                     (qr.height_cm       as number | null) ?? null,
    weightKg:                     (qr.weight_kg       as number | null) ?? null,
    waistCm:                      (qr.waist_circumference_cm as number | null) ?? null,
    trainingExperience:           (qr.training_experience as string | null) ?? null,
    professionalEnvironment:      (qr.professional_environment as string | null) ?? null,
    professionalEnvironmentOther: (qr.professional_environment_other as string | null) ?? null,
    typicalClothing:              (qr.typical_clothing as string | null) ?? null,
    socialPerception:             Array.isArray(qr.social_perception) ? qr.social_perception as string[] : null,
  };

  // Step 1: analysis
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
  if (!analysisRes.ok) return NextResponse.json({ error: "Photo analysis failed.", detail: analysisRaw.slice(0, 400) }, { status: analysisRes.status });
  let analysisPayload: unknown;
  try { analysisPayload = JSON.parse(analysisRaw); } catch {
    return NextResponse.json({ error: "Gemini step1 returned non-JSON.", detail: analysisRaw.slice(0, 200) }, { status: 502 });
  }
  const analysis = extractTextFromGemini(analysisPayload);
  if (!analysis) return NextResponse.json({ error: "Photo analysis returned no content." }, { status: 502 });

  // Step 2: image generation
  const generationRes = await fetchWithRetry(geminiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [
        { inline_data: { mime_type: photoMime, data: photoBase64 } },
        { text: buildGenerationPrompt(promptParams, analysis) },
      ]}],
      generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: "3:4", imageSize: "1K" }, temperature: 0.4 },
    }),
  }, 4, "step2");
  const generationRaw = await generationRes.text();
  if (!generationRes.ok) return NextResponse.json({ error: "Image generation failed.", detail: generationRaw.slice(0, 400) }, { status: generationRes.status });
  let generationPayload: unknown;
  try { generationPayload = JSON.parse(generationRaw); } catch {
    return NextResponse.json({ error: "Gemini step2 returned non-JSON.", detail: generationRaw.slice(0, 200) }, { status: 502 });
  }
  const afterDataUrl = extractImageFromGemini(generationPayload);
  if (!afterDataUrl) {
    const payload = generationPayload as Record<string, unknown>;
    const candidate = (Array.isArray(payload?.candidates) ? payload.candidates[0] : null) as Record<string, unknown> | null;
    const finishReason = candidate?.finishReason ?? "unknown";
    const partsCount = (candidate?.content as Record<string, unknown> | undefined)?.parts;
    const partTypes = Array.isArray(partsCount) ? partsCount.map((p: Record<string, unknown>) => Object.keys(p).join(",")) : [];
    console.error("[generate-before-after] step2 no image — finishReason:", finishReason, "parts:", partTypes);
    return NextResponse.json({ error: "Gemini did not return an image.", detail: { finishReason, partTypes } }, { status: 502 });
  }

  // Upload + persist
  const match = afterDataUrl.match(/^data:(.+?);base64,(.+)$/);
  if (!match) return NextResponse.json({ error: "Malformed image data URL." }, { status: 500 });
  const [, afterMime, afterBase64] = match;
  const storagePath = `before-after/${userId}.${afterMime === "image/png" ? "png" : "jpg"}`;
  const { error: uploadError } = await supabaseAdmin.storage.from("user-photos").upload(
    storagePath, Buffer.from(afterBase64, "base64"), { contentType: afterMime, upsert: true },
  );
  if (uploadError) return NextResponse.json({ error: "Upload failed.", detail: uploadError.message }, { status: 500 });

  const TEN_YEARS = 315_360_000;
  const [beforeSigned, afterSigned] = await Promise.all([
    supabaseAdmin.storage.from("user-photos").createSignedUrl(photoPath, TEN_YEARS),
    supabaseAdmin.storage.from("user-photos").createSignedUrl(storagePath, TEN_YEARS),
  ]);

  const beforeUrl = beforeSigned.data?.signedUrl ?? null;
  const afterUrl  = afterSigned.data?.signedUrl  ?? null;

  await supabaseAdmin.from("protocols").update({
    before_after_preview_path: storagePath,
    before_after_analysis: analysis,
  }).eq("user_id", userId);

  return NextResponse.json({ status: "done", beforeUrl, afterUrl, analysis });
}

// ── Main route ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    const { userId } = (await request.json()) as { userId: string };
    if (!userId) return NextResponse.json({ error: "userId is required." }, { status: 400 });

    // Quick pre-flight: verify photo + metrics exist before triggering the bg job
    const [protocolRes, qrRes] = await Promise.all([
      supabaseAdmin.from("protocols").select("metrics, before_after_preview_path").eq("user_id", userId).maybeSingle(),
      supabaseAdmin.from("questionnaire_responses")
        .select("photo_front_path, age, height_cm, weight_kg, waist_circumference_cm, training_experience, professional_environment, professional_environment_other, typical_clothing, social_perception")
        .eq("user_id", userId).maybeSingle(),
    ]);

    const photoPath = (qrRes.data?.photo_front_path as string | null) ?? null;
    const metrics   = (protocolRes.data?.metrics as CalibrationMetrics | null) ?? null;

    if (!photoPath) return NextResponse.json({ error: "No front photo found for this user." }, { status: 404 });
    if (!metrics)   return NextResponse.json({ error: "No calibration metrics found. Calibrate first." }, { status: 404 });

    // Prevent double-trigger if already generating
    const currentPath = protocolRes.data?.before_after_preview_path as string | null;
    if (currentPath === "__generating") {
      return NextResponse.json({ status: "generating" });
    }

    const siteUrl = process.env.URL ?? process.env.NETLIFY_SITE_URL;

    if (siteUrl) {
      // Production (Netlify): trigger background function, return immediately
      await supabaseAdmin.from("protocols").update({
        before_after_preview_path: "__generating",
      }).eq("user_id", userId);

      const bgRes = await fetch(`${siteUrl}/.netlify/functions/generate-bg-background`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, secret: process.env.BG_FN_SECRET }),
      });

      if (bgRes.status !== 202) {
        await supabaseAdmin.from("protocols").update({
          before_after_preview_path: currentPath ?? null,
        }).eq("user_id", userId);
        const errText = await bgRes.text().catch(() => "");
        return NextResponse.json({ error: `Failed to start background job (${bgRes.status}): ${errText.slice(0, 100)}` }, { status: 500 });
      }

      return NextResponse.json({ status: "generating" });
    }

    // Development fallback: run synchronously inline (no timeout constraint in dev)
    return runGenerationInline(userId, photoPath, metrics, qrRes.data as Record<string, unknown>);

  } catch (err) {
    console.error("[generate-before-after] POST error", err);
    return NextResponse.json(
      { error: "Server error.", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

// Poll generation status / re-fetch signed URLs
export async function GET(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId is required." }, { status: 400 });

    const protocolRes = await supabaseAdmin
      .from("protocols")
      .select("before_after_preview_path, before_after_analysis, before_url, after_url")
      .eq("user_id", userId)
      .maybeSingle();

    const previewPath = (protocolRes.data?.before_after_preview_path as string | null) ?? null;
    const analysis    = (protocolRes.data?.before_after_analysis      as string | null) ?? null;
    let beforeUrl     = (protocolRes.data?.before_url                 as string | null) ?? null;
    let afterUrl      = (protocolRes.data?.after_url                  as string | null) ?? null;

    if (!previewPath) return NextResponse.json({ status: "not_started" });
    if (previewPath === "__generating") return NextResponse.json({ status: "generating" });
    if (previewPath.startsWith("__error:")) {
      return NextResponse.json({ status: "error", error: previewPath.slice(8) });
    }

    // Fallback: if URLs were never stored (pre-fix or bg function failure), create them now
    if (!afterUrl && previewPath && !previewPath.startsWith("__")) {
      const TEN_YEARS = 315_360_000;
      const qrRes = await supabaseAdmin
        .from("questionnaire_responses")
        .select("photo_front_path")
        .eq("user_id", userId)
        .maybeSingle();
      const photoPath = (qrRes.data?.photo_front_path as string | null) ?? null;

      const [beforeSigned, afterSigned] = await Promise.all([
        photoPath ? supabaseAdmin.storage.from("user-photos").createSignedUrl(photoPath, TEN_YEARS) : Promise.resolve({ data: null }),
        supabaseAdmin.storage.from("user-photos").createSignedUrl(previewPath, TEN_YEARS),
      ]);
      beforeUrl = beforeSigned.data?.signedUrl ?? null;
      afterUrl  = afterSigned.data?.signedUrl  ?? null;

      // Store for next time
      await supabaseAdmin.from("protocols").update({ before_url: beforeUrl, after_url: afterUrl }).eq("user_id", userId);
    }

    return NextResponse.json({
      status: "done",
      beforeUrl,
      afterUrl,
      analysis,
    });
  } catch (err) {
    console.error("[generate-before-after] GET error", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
