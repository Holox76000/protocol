import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase";

export const runtime = "nodejs";

const DEFAULT_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_MODEL    = "gemini-2.5-flash-image";

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
  if (age <= 45) return `Age ~${age} — moderate potential, hormone levels declining. Athletic but not maximally bulky.`;
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
- Transformation goals: ${goals.join(", ")}
- Social environment: ${socialEnv || "unspecified"}
- ${ageContextLine(age)}

---

## Your Task
Look at the photo provided. Produce a concise transformation analysis:

### What I See in the Photo
Describe the current body composition objectively: shoulder width relative to waist, chest development, arm size, waist leanness, posture, facial leanness. Be specific.

### Key Transformation Goals (Top 3, ranked by attractiveness impact)
For each:
- What you see now (specific visual observation)
- What the research says about this trait
- The target change after 12 weeks (concrete visual description)

### Target Physique Description
Precise visual description of what this exact person should look like after a 12-week Protocol. This description feeds directly into image generation — be specific about V-taper, shoulder development, waist leanness, face definition, posture.

Be clinical and precise.`;
}

function buildGenerationPrompt(ageBracket: string, analysis: string): string {
  const age = AGE_BRACKET_MID[ageBracket] ?? 30;
  const conservative = age >= 45;

  return `Create a realistic "after" transformation photo of this exact person. Show optimistic but realistic 12-week progress — credible, not the absolute ceiling.

${ageContextLine(age)}
${conservative ? "IMPORTANT: This person's age limits transformation potential — keep changes conservative and realistic. No dramatic muscle gains." : ""}

---

## Transformation Brief (from expert analysis of this photo)

${analysis}

---

## Absolute Rules
— Preserve identity exactly: same face structure, skin tone, ethnicity, hair color, hair style, eye color. This must be recognizably the same person.
— Same camera angle and background as the original photo.
— Lighting: professional fitness studio lighting — soft but directional, with slight shadow depth that reveals muscle separation, shoulder roundness, and facial bone structure. Upgrade flat or dim original lighting.
— Show the natural V-taper improvement: broader shoulders, narrower waist — without exaggerating beyond what's visible at 12 weeks.
— Face leanness: show jawline and cheekbone definition at the leanest realistic level.
— The result must look like a real photograph, not a digital render or a different person.
— All changes must be within physiological limits through natural training at 12 weeks.`;
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

async function fetchWithRetry(url: string, init: RequestInit, maxAttempts = 4): Promise<Response> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) {
      const delay = 5_000 * Math.pow(3, attempt - 1);
      await sleep(delay);
    }
    const res = await fetch(url, init);
    if (res.status !== 429) return res;
    const body = await res.clone().text();
    if (body.includes("limit: 0") || body.includes("billing")) return res;
  }
  return new Response(JSON.stringify({ error: "Rate limit exhausted." }), { status: 429 });
}

async function runFunnelGenerationInline(
  sessionId: string,
  photoPath: string,
  ageBracket: string,
  morphology: string,
  socialEnv: string,
  goals: string[],
): Promise<void> {
  const { data: photoData, error: dlError } = await supabaseAdmin.storage.from("user-photos").download(photoPath);
  if (dlError || !photoData) throw new Error("Could not download photo");

  const photoBuffer = Buffer.from(await photoData.arrayBuffer());
  const photoBase64 = photoBuffer.toString("base64");
  const photoMime   = photoData.type || "image/jpeg";

  const apiKey = process.env.NANOBANANA_API_KEY;
  const model  = process.env.NANOBANANA_MODEL || DEFAULT_MODEL;
  if (!apiKey) throw new Error("NANOBANANA_API_KEY not configured");

  const geminiUrl = `${DEFAULT_API_BASE}/models/${model}:generateContent`;

  // Step 1: Analysis
  const analysisRes = await fetchWithRetry(geminiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [
        { inline_data: { mime_type: photoMime, data: photoBase64 } },
        { text: buildAnalysisPrompt(ageBracket, morphology, socialEnv, goals) },
      ]}],
      generationConfig: { responseModalities: ["TEXT"], temperature: 0.3, maxOutputTokens: 1200 },
    }),
  });
  if (!analysisRes.ok) throw new Error(`Analysis failed (${analysisRes.status})`);
  const analysis = extractText(await analysisRes.json());
  if (!analysis) throw new Error("Analysis returned no content");

  // Step 2: Image generation
  const generationRes = await fetchWithRetry(geminiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [
        { inline_data: { mime_type: photoMime, data: photoBase64 } },
        { text: buildGenerationPrompt(ageBracket, analysis) },
      ]}],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: { aspectRatio: "3:4", imageSize: "1K" },
        temperature: 0.4,
      },
    }),
  });
  if (!generationRes.ok) throw new Error(`Generation failed (${generationRes.status})`);
  const afterDataUrl = extractImage(await generationRes.json());
  if (!afterDataUrl) throw new Error("Gemini did not return an image");

  const match = afterDataUrl.match(/^data:(.+?);base64,(.+)$/);
  if (!match) throw new Error("Malformed image data URL");
  const [, afterMime, afterBase64] = match;
  const ext = afterMime === "image/png" ? "png" : "jpg";
  const afterPath = `funnel/${sessionId}/after.${ext}`;

  const { error: uploadError } = await supabaseAdmin.storage.from("user-photos").upload(
    afterPath, Buffer.from(afterBase64, "base64"), { contentType: afterMime, upsert: true },
  );
  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

  await supabaseAdmin.from("visualization_previews").upsert({
    preview_id: sessionId,
    before_path: photoPath,
    after_path: afterPath,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      session_id: string;
      photo_path: string;
      age_bracket: string;
      morphology: string;
      ethnicity?: string;
      social_environment?: string;
      goals?: string | string[];
    };

    const { session_id, photo_path, age_bracket, morphology } = body;
    if (!session_id || !photo_path || !age_bracket || !morphology) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!/^[a-f0-9-]{36}$/.test(session_id)) {
      return NextResponse.json({ error: "Invalid session_id" }, { status: 400 });
    }

    const socialEnv = body.social_environment ?? "";
    const rawGoals = body.goals ?? [];
    const goals = typeof rawGoals === "string"
      ? rawGoals.split("|").filter(Boolean)
      : (rawGoals as string[]);

    const siteUrl = process.env.URL ?? process.env.NETLIFY_SITE_URL;

    if (siteUrl) {
      // Production: mark as generating, trigger background function
      await supabaseAdmin.from("visualization_previews").upsert({
        preview_id: session_id,
        before_path: photo_path,
        after_path: "__generating",
      });

      await fetch(`${siteUrl}/.netlify/functions/funnel-preview-bg-background`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id, photo_path, age_bracket, morphology, social_environment: socialEnv, goals,
          secret: process.env.BG_FN_SECRET,
        }),
      }).catch(() => {});

      return NextResponse.json({ status: "generating" });
    }

    // Dev: run inline (no timeout constraint)
    await supabaseAdmin.from("visualization_previews").upsert({
      preview_id: session_id,
      before_path: photo_path,
      after_path: "__generating",
    });

    runFunnelGenerationInline(session_id, photo_path, age_bracket, morphology, socialEnv, goals)
      .then(() => {})
      .catch((err) => {
        console.error("[funnel-generate-preview] inline error", err);
        supabaseAdmin.from("visualization_previews").update({
          after_path: `__error:${String(err).slice(0, 100)}`,
        }).eq("preview_id", session_id).then(() => {});
      });

    return NextResponse.json({ status: "generating" });

  } catch (err) {
    console.error("[funnel-generate-preview] POST error", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
