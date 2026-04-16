import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { requireAdmin } from "../../../../lib/adminAuth";
import { supabaseAdmin } from "../../../../lib/supabase";
import type { CalibrationMetrics } from "../../../admin/orders/[userId]/PhotoCalibrator";
import { getAgeRanges, bfRealisticTarget, muscleGainMultiplier } from "../../../../lib/attractivenessScore";

export const runtime = "nodejs";
export const maxDuration = 120; // seconds — allow retries on 429

const DEFAULT_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_MODEL    = "gemini-3.1-flash-image-preview";

// ── Age-calibrated prompt builder ─────────────────────────────────────────

function buildAfterPrompt(params: {
  age:                number;
  metrics:            CalibrationMetrics;
  heightCm:           number | null;
  weightKg:           number | null;
  trainingExperience: string | null;
}): string {
  const { age, metrics } = params;
  const ageRanges  = getAgeRanges(age);
  const gainMult   = muscleGainMultiplier(age);
  const r2         = (v: number) => Math.round(v * 100) / 100;

  // 1. Age context
  const ageContext = (() => {
    if (age <= 25) return `This person is in their physical prime (age ${age}). Full natural transformation potential with strong anabolic hormone profile.`;
    if (age <= 35) return `This person is ${age} years old. Strong transformation potential — realistic for 12–18 months of consistent training.`;
    if (age <= 45) return `This person is ${age} years old. Good but moderate transformation potential. Hormone levels declining. Show a lean, athletic physique — well-defined but less muscle bulk than a 25-year-old.`;
    if (age <= 55) return `This person is ${age} years old. Moderate transformation potential. Show realistic lean and toned improvement — modest muscle definition, reduced body fat. Do NOT show dramatic muscle mass gains.`;
    if (age <= 65) return `This person is ${age} years old. Conservative transformation ceiling. Show subtle but meaningful improvements: leaner, better posture, maintained lean muscle. Should look healthy and fit for their age — not like a young bodybuilder.`;
    return `This person is ${age} years old. Very subtle, age-appropriate transformation. Show improved posture, leaner face and body, maintained muscle tone. Absolutely do NOT show large muscle gains — physiologically unrealistic at this age.`;
  })();

  // 2. Compute exact realistic targets per metric
  const improvements: string[] = [];

  // Body fat — exact target from age-calibrated floor
  const bfTarget = bfRealisticTarget(metrics.bf, age);
  const [bfMin, bfMax] = ageRanges.bf;
  if (metrics.bf > bfMax) {
    improvements.push(
      `Body fat: reduce from ${metrics.bf}% to ~${bfTarget}% (age-adjusted optimal for ${age}y: ${bfMin}–${bfMax}%). ` +
      `This means visibly leaner waist, less fat on the abdomen and face.`
    );
  }

  // Shoulder-waist ratio — exact target
  const [swrMin] = ageRanges.swr;
  if (metrics.swr < swrMin) {
    const swrTarget = r2(metrics.swr + (swrMin - metrics.swr) * gainMult);
    improvements.push(
      `Shoulder-waist ratio: from ${metrics.swr} → ${swrTarget} (target ≥${swrMin} for age ${age}). ` +
      `Broader, more developed deltoids creating a V-taper. ` +
      (gainMult < 0.5 ? "Change should be subtle — do not exaggerate shoulder width." : "Show clear shoulder development.")
    );
  }

  // Chest-waist ratio — exact target
  const [cwrMin] = ageRanges.cwr;
  if (metrics.cwr < cwrMin) {
    const cwrTarget = r2(metrics.cwr + (cwrMin - metrics.cwr) * gainMult);
    improvements.push(
      `Chest-waist ratio: from ${metrics.cwr} → ${cwrTarget} (target ≥${cwrMin}). ` +
      `${gainMult < 0.5 ? "Slightly" : "More"} defined and fuller chest.`
    );
  }

  // Posture — exact target score
  const pasTarget = Math.min(92, metrics.pas + Math.round(20 * Math.min(gainMult + 0.2, 1)));
  const [pasMin] = ageRanges.pas;
  if (metrics.pas < pasMin) {
    improvements.push(
      `Posture score: from ${metrics.pas} → ${pasTarget}/100 (target ≥${pasMin}). ` +
      (metrics.pas < 70
        ? "Dramatically improved upright posture — straighter spine, chest up, head aligned over spine, shoulders back."
        : "Improved upright posture — taller stance, shoulders back, reduced forward lean.")
    );
  }

  // Taper index — exact target
  const [tiMin] = ageRanges.ti;
  if (metrics.ti < tiMin) {
    const tiTarget = r2(metrics.ti + (tiMin - metrics.ti) * gainMult);
    improvements.push(
      `Taper index: from ${metrics.ti} → ${tiTarget} (target ≥${tiMin}). ` +
      `Narrower visual waist, cleaner V-taper silhouette.`
    );
  }

  const improvementsText = improvements.length > 0
    ? `Exact metric-driven improvements to show:\n${improvements.map((s, i) => `${i + 1}. ${s}`).join("\n")}`
    : "Show a polished, healthy, and athletic version of this exact person consistent with their age.";

  return [
    `Create a realistic "after" transformation photo of this exact person.`,
    ageContext,
    `CRITICAL rules:`,
    `— Preserve identity exactly: same face, facial features, skin tone, ethnicity, hair color, hair style, eye color.`,
    `— Same camera angle and background as the original photo.`,
    `— Lighting: keep the original lighting if it is adequate to reveal body composition details (muscle definition, fat distribution, posture). If the original lighting is flat, dim, or creates shadows that obscure these details, improve it to a clean, even, front-facing light that makes the physique changes clearly visible — without making it look artificial.`,
    `— The result must look like a real photograph of the same person — not a drawing, not a different person.`,
    `— All changes must be proportional to what is physiologically achievable at age ${age} through natural training.`,
    improvementsText,
    `The transformation reflects the realistic maximum achievable for this person's age — not a generic fitness model.`,
  ].join("\n");
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
): Promise<Response> {
  let lastStatus = 0;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) {
      // Exponential backoff: 5s, 15s, 45s
      const delay = 5_000 * Math.pow(3, attempt - 1);
      console.log(`[generate-before-after] 429 retry ${attempt}/${maxAttempts - 1} — waiting ${delay / 1000}s`);
      await sleep(delay);
    }
    const res = await fetch(url, init);
    if (res.status !== 429) return res;

    // Distinguish quota exhausted (limit: 0) from transient rate limit — no point retrying
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
        .select("photo_front_path, age, height_cm, weight_kg, training_experience")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    const metrics       = (protocolRes.data?.metrics as CalibrationMetrics | null) ?? null;
    const photoPath     = (qrRes.data?.photo_front_path as string | null) ?? null;
    const age           = (qrRes.data?.age            as number | null) ?? 30;
    const heightCm      = (qrRes.data?.height_cm      as number | null) ?? null;
    const weightKg      = (qrRes.data?.weight_kg      as number | null) ?? null;
    const trainingExp   = (qrRes.data?.training_experience as string | null) ?? null;

    if (!photoPath) {
      return NextResponse.json({ error: "No front photo found for this user." }, { status: 404 });
    }
    if (!metrics) {
      return NextResponse.json({ error: "No calibration metrics found. Calibrate first." }, { status: 404 });
    }

    // 2. Download original photo from Supabase Storage
    const { data: photoData, error: dlError } = await supabaseAdmin.storage
      .from("user-photos")
      .download(photoPath);

    if (dlError || !photoData) {
      return NextResponse.json({ error: "Could not download user photo.", detail: dlError?.message }, { status: 500 });
    }

    const photoBuffer = Buffer.from(await photoData.arrayBuffer());
    const photoBase64 = photoBuffer.toString("base64");
    const photoMime   = photoData.type || "image/jpeg";

    // 3. Build age-calibrated prompt
    const prompt = buildAfterPrompt({ age, metrics, heightCm, weightKg, trainingExperience: trainingExp });

    // 4. Call Gemini
    const apiKey = process.env.NANOBANANA_API_KEY;
    const model  = process.env.NANOBANANA_MODEL || DEFAULT_MODEL;

    if (!apiKey) {
      return NextResponse.json({ error: "NANOBANANA_API_KEY not configured." }, { status: 503 });
    }

    const geminiUrl = `${DEFAULT_API_BASE}/models/${model}:generateContent`;

    const geminiRes = await fetchWithRetry(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [
            { inline_data: { mime_type: photoMime, data: photoBase64 } },
            { text: prompt },
          ],
        }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
          imageConfig: { aspectRatio: "3:4", imageSize: "1K" },
        },
      }),
    });

    const geminiText = await geminiRes.text();

    if (!geminiRes.ok) {
      console.error("[generate-before-after] Gemini error", { requestId, status: geminiRes.status, body: geminiText.slice(0, 500) });
      return NextResponse.json({ error: "Gemini generation failed.", detail: geminiText.slice(0, 400) }, { status: geminiRes.status });
    }

    const geminiPayload = JSON.parse(geminiText);
    const afterDataUrl  = extractImageFromGemini(geminiPayload);

    if (!afterDataUrl) {
      return NextResponse.json({ error: "Gemini did not return an image.", requestId }, { status: 502 });
    }

    // 5. Upload generated "after" image to Supabase Storage
    const match = afterDataUrl.match(/^data:(.+?);base64,(.+)$/);
    if (!match) {
      return NextResponse.json({ error: "Generated image data URL is malformed." }, { status: 500 });
    }
    const [, afterMime, afterBase64] = match;
    const afterBuffer = Buffer.from(afterBase64, "base64");
    const ext          = afterMime === "image/png" ? "png" : "jpg";
    const storagePath  = `before-after/${userId}.${ext}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("user-photos")
      .upload(storagePath, afterBuffer, {
        contentType: afterMime,
        upsert: true,
      });

    if (uploadError) {
      console.error("[generate-before-after] storage upload failed", uploadError);
      return NextResponse.json({ error: "Failed to save generated image.", detail: uploadError.message }, { status: 500 });
    }

    // 6. Save path to protocols table
    await supabaseAdmin
      .from("protocols")
      .update({ before_after_preview_path: storagePath })
      .eq("user_id", userId);

    // 7. Return signed URLs for both before and after
    const [beforeSigned, afterSigned] = await Promise.all([
      supabaseAdmin.storage.from("user-photos").createSignedUrl(photoPath,    3600),
      supabaseAdmin.storage.from("user-photos").createSignedUrl(storagePath,  3600),
    ]);

    return NextResponse.json({
      beforeUrl: beforeSigned.data?.signedUrl ?? null,
      afterUrl:  afterSigned.data?.signedUrl  ?? null,
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
      supabaseAdmin.from("protocols").select("before_after_preview_path").eq("user_id", userId).maybeSingle(),
      supabaseAdmin.from("questionnaire_responses").select("photo_front_path").eq("user_id", userId).maybeSingle(),
    ]);

    const previewPath = protocolRes.data?.before_after_preview_path as string | null;
    const photoPath   = qrRes.data?.photo_front_path                as string | null;

    if (!previewPath || !photoPath) {
      return NextResponse.json({ beforeUrl: null, afterUrl: null });
    }

    const [before, after] = await Promise.all([
      supabaseAdmin.storage.from("user-photos").createSignedUrl(photoPath,   3600),
      supabaseAdmin.storage.from("user-photos").createSignedUrl(previewPath, 3600),
    ]);

    return NextResponse.json({
      beforeUrl: before.data?.signedUrl ?? null,
      afterUrl:  after.data?.signedUrl  ?? null,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
