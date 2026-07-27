// Two-step generation, phase 1: hand Gemini both the template scene and
// the customer's selfies, ask it to write a face-swap prompt tailored to
// those exact images. The refined prompt is then fed into the actual
// image-generation call in lib/nanoBanana.ts.
//
// Why this helps: the image model (Nano Banana Pro) obeys a highly
// specific text instruction ("preserve the freckle on his left cheek,
// the wavy hair, warm tungsten lighting from camera-left") much more
// reliably than a generic template prompt + reliance on what it sees.
//
// Cost: ~$0.001 per call (Gemini 2.5 Flash text, cheap). ~2s latency,
// invisible inside the 6-8h delivery hold.
//
// Kill switch: NANOBANANA_AI_PROMPT_REFINE=false → skip refinement,
// caller falls back to its own prompt.

import type { ReferenceImage } from "./nanoBanana";

const GEMINI_TEXT_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

// gemini-2.5-flash is the stable, cheap multimodal text model — plenty
// for prompt refinement. Overridable via env for future upgrades.
function resolvePromptModel(): string {
  return process.env.NANOBANANA_PROMPT_MODEL ?? "gemini-2.5-flash";
}

function apiKey(): string | null {
  return (
    process.env.NANOBANANA_API_KEY
    ?? process.env.NANO_BANANA_API_KEY
    ?? process.env.GEMINI_API_KEY
    ?? null
  );
}

export type RefineInput = {
  templateReference: ReferenceImage;
  characterReferences: ReferenceImage[];
  // The original body prompt authored by the admin — gives the analyzer
  // context on the intended scene without constraining it.
  scenePromptHint: string;
};

export type RefineResult = {
  refinedPrompt: string;
  model: string;
  // Gemini's finish reason — "STOP" is a clean completion. "MAX_TOKENS"
  // means the model was cut off (bump the token limit). Anything else
  // (SAFETY, RECITATION…) worth surfacing so the admin sees it.
  finishReason: string | null;
};

// Meta-prompt fed to Gemini. Dense on purpose — image models reward
// vivid specifics and hate boilerplate. Facial structure is called out
// first and hardest because it's the most common failure mode when the
// downstream model drifts (right features, wrong bone structure = a
// vaguely-similar stranger instead of the customer).
function buildMetaPrompt(scenePromptHint: string): string {
  return [
    "You are an expert at writing precise image-editing prompts for advanced generative models (Nano Banana Pro / Gemini 3 Pro Image).",
    "",
    "You will see multiple input images:",
    "  • The FIRST image is the TEMPLATE — the exact scene we want to reproduce.",
    "  • The FOLLOWING images are SELFIES of the person whose face must appear in the final image.",
    "",
    "PRIMARY OBJECTIVE — read this first, keep it in mind throughout: this is a FACE REPLACEMENT task. The face identity must come 100% from the SELFIES, at pixel-close fidelity. The template only provides the scene composition. Any drift in bone structure, jaw shape, face fullness, nose shape, lip shape, eye shape, or eyebrow shape from the SELFIES makes the whole generation useless — the customer must instantly recognize himself, not a flattering stranger. Fidelity beats beautification, always.",
    "",
    "==== DESCRIPTION RULES — READ CAREFULLY ====",
    "The image model you're writing for is biased toward flattering, generic \"handsome\" outputs. Your text descriptions can either fight this bias or feed it. To fight it:",
    "",
    "  (1) BE ASSERTIVE, NOT POLITE. If his face is WIDE, say WIDE. If his jaw is SQUARE, say SQUARE. If his cheeks are FULL, say FULL. Do not soften. Do not hedge.",
    "",
    "  (2) BANNED VAGUE WORDS — do NOT use these unless they are literally the most precise term available: \"medium\", \"moderate\", \"average\", \"soft\", \"softly\", \"gently\", \"slightly rounded\", \"rounded\" (when the actual shape is square/broad), \"balanced\". These words neutralize your negative constraints and let the model default to its idealized baseline.",
    "",
    "  (3) PREFER COMPARATIVE + STRONG DESCRIPTORS: \"broader than average\", \"prominently square\", \"strongly full\", \"visibly wide\", \"pronounced masseter\", \"heavy jawline\", \"broad bulbous nose tip\", \"noticeably full lower lip\", \"thick bushy brows\".",
    "",
    "  (4) USE PAIRED POSITIVE + NEGATIVE for every anti-drift constraint. Not just \"DO NOT slim the face\" — instead \"His face is FULL and WIDE with soft cheeks and a heavy jawline (DO NOT slim, sculpt, or narrow it).\" Positive + negative together beat negative alone because positive descriptions feed the generation directly.",
    "",
    "  (5) TRUST-THE-IMAGES CLAUSE — always include near the top of your output prompt: \"CRITICAL: the SELFIE photos are the ground truth for facial identity. If any text description below conflicts with what you see in the selfies, obey the selfies. Do not interpolate toward a more attractive baseline.\"",
    "",
    "==== ANALYSIS STEP ====",
    "Before writing the prompt, silently analyze the SELFIES across the following axes. Use ASSERTIVE, SPECIFIC terms per rule (1)-(3) above.",
    "",
    "AXIS 1 — FACIAL BONE STRUCTURE (geometric, lighting-independent). Push against your polite default:",
    "  • Skull and face proportions: is his face LONG or WIDE? By how much? (e.g. \"noticeably wider than tall\" not \"medium\")",
    "  • Jaw: shape MUST be one of {square, broad-square, angular, round, oval, pointed}. Width: {narrow, medium, wide, very wide}. Masseter visibility: {none, subtle, visible, pronounced}. If in doubt between two: pick the more distinctive one.",
    "  • Cheekbones: {flat, present, prominent, very prominent}. Fullness of cheeks BELOW cheekbones: {sunken, lean, medium, full, very full}.",
    "  • Nose: bridge {straight, slightly curved, curved, bumped}. Width: {narrow, medium, broad}. Tip: {pointed, refined, rounded, bulbous}. Nostril width: {narrow, medium, wide}.",
    "  • Eyes: shape {almond, round, hooded, monolid, downturned outer corner}. Spacing {close-set, medium, wide-set}. Depth {deep-set, average, prominent}.",
    "  • Mouth: lip fullness upper {thin, medium, full, very full}, lower {thin, medium, full, very full}. Width {narrow, medium, wide}. Resting shape {upturn, straight, slight downturn, pout}.",
    "  • Chin: {narrow-pointed, medium, broad, broad-rounded}. Length {short, medium, long}.",
    "  • Overall head shape from the front {oval, round, square, broad-square, heart, diamond}. If it's square, say SQUARE — do not soften to \"softly rounded\".",
    "",
    "AXIS 2 — PILOSITY / HAIR SIGNATURE (a man's beard/hair/brow pattern is often as recognizable as his bones):",
    "  • Scalp hair: color (with highlights/greys if any), length, texture (straight/wavy/curly/coily), thickness, hairline shape (straight/receding/widow's peak), part or lack of, styling (swept back, side part, textured crop, buzz, etc.)",
    "  • Beard/facial hair: coverage zone (full/goatee/stubble/soul patch/mustache-only), density (patchy vs dense), length, edge lines (sharp fade vs natural), color if different from scalp",
    "  • Eyebrows: thickness (thin/medium/bushy), shape (straight/arched/angled), length, spacing between the two brows, any distinctive features (unibrow tendency, scar, slit)",
    "",
    "AXIS 3 — EXPRESSION SIGNATURE (how HE personally expresses emotions — must NOT be borrowed from the template subject):",
    "  • Smile mechanics: does he have dimples? one or both? deep or shallow? Where do his cheeks lift? Does he show top teeth only, both rows, or none? Are the teeth aligned or with any gap/imperfection?",
    "  • Eye behavior: does he crinkle (crow's feet) when smiling? Does one eye close more than the other? Does his brow move?",
    "  • Neutral face: resting mouth shape (slight upturn, slight downturn, straight line), any asymmetry",
    "  • Forehead lines: any resting horizontal lines when eyebrows lift",
    "  • Any distinctive tic or micro-expression visible across the selfies",
    "",
    "AXIS 4 — ANTI-IDEALIZATION (critical: this image model has strong biases toward Hollywood beautification — you MUST counter them in the prompt):",
    "  • Face fullness: is his face SLIM, MEDIUM, or FULL? Does he have soft cheeks, a soft under-chin, any natural roundness? The model defaults to slimming — resist it by explicitly stating the actual fullness level.",
    "  • Jaw sharpness: is his jaw naturally SHARP, MEDIUM, or SOFT/ROUNDED? The model defaults to sharpening — call out the real level.",
    "  • Skin realism: pores visible, any redness, any imperfection or asymmetry, natural discoloration? The model defaults to airbrushing — insist on the imperfections.",
    "  • Weight/build cues in the face: does his face suggest a lean, athletic, average, or fuller build? Do not let the model auto-lean him.",
    "  • Eye color — BE VERY PRECISE. The model routinely confuses hazel/green/grey with blue. Look carefully and use the exact term: pure blue / grey-blue / blue-green / hazel-green / green / hazel-brown / brown / dark brown. If limbal ring or heterochromia visible, name it.",
    "  • Age realism: does he look 18, 22, 28, 35? The model tends to smooth 5 years off — anchor the actual apparent age.",
    "",
    "AXIS 5 — WHOLE-BODY SKIN TONE (critical failure mode: model swaps the face but leaves the neck/arms/hands with the template subject's tone → visible break at the jawline):",
    "  • Analyze the SELFIES' skin tone precisely: fair / light / light-medium / medium / medium-tan / tan / olive / brown / dark-brown / deep. Note the undertone: cool / neutral / warm / golden / red / olive.",
    "  • Note any tan lines, natural redness (cheeks, nose bridge, ears), freckling density, or sun damage patterns.",
    "  • CRITICAL: this tone must be applied to ALL visible skin in the output — face, neck, ears, throat, chest (if visible), shoulders, arms, forearms, hands, wrists, fingers. The template subject's skin tone must be entirely overridden across the whole body, not just the face.",
    "  • The transition at the jawline / hairline / neck must be seamless — no visible tone break, no color mismatch, no hard edge.",
    "",
    "TASK — write a single, complete image-editing prompt that instructs another model to:",
    "  1. OPEN with a strong imperative directive: \"PRIMARY OBJECTIVE: replace the face in the reference image with the exact face from the selfie photos. The SELFIE photos are the ground truth for facial identity — if any text description conflicts with what you see in the selfies, obey the selfies. Do not blend, do not interpolate, do not idealize.\"",
    "  2. Write a POSITIVE ASSERTIVE description of the facial bone structure using the assertive terms from your analysis (not \"medium\" / \"softly rounded\" — use \"SQUARE\", \"BROAD\", \"FULL\", \"PROMINENT\"). Example format: \"His face is BROAD and FULL. Strong SQUARE jaw with wide base and visible masseter. Broad rounded nose tip with wide nostrils. FULL lower lip with slight natural pout. Full cheeks with soft under-chin. Not slim, not sculpted, not angular.\"",
    "  3. Then a positive assertive description of PILOSITY (scalp hair, beard, eyebrows) with specific terms: color (name exactly), texture, thickness, styling. Emphasize contrast: if his eyebrows are darker than his hair, say so explicitly (\"medium-thick dark ash-brown eyebrows on top of light blond scalp hair — clear contrast\").",
    "  4. Then the EXPRESSION SIGNATURE description from the SELFIES — the OVERALL EMOTION matches the TEMPLATE's pose, but MICRO-FEATURES from the SELFIES: dimple presence (or ABSENCE — say \"NO dimples\" if he has none), smile shape, teeth-showing pattern, eye crinkle, cheek lift.",
    "  5. Then a DO NOT / ANTI-IDEALIZATION bullet list, PAIRED with the positive from step 2. Each line must be POSITIVE + NEGATIVE together, not negative alone. Examples:",
    "     - \"His face is FULL and WIDE with soft cheeks and slight under-chin softness — DO NOT slim, sculpt, or narrow it. Preserve the actual weight and fullness visible in the selfies.\"",
    "     - \"His jaw is SQUARE and BROAD with visible masseter and a heavy angle at the corner — DO NOT sharpen, taper, or V-shape it. Preserve the actual squareness.\"",
    "     - \"His eyes are [exact color from selfies] — DO NOT shift them toward blue or a more attractive color. Preserve the exact color and shape.\"",
    "     - \"His lips are FULL, especially the lower lip — DO NOT thin them. Preserve the actual fullness.\"",
    "     - \"His nose has a BROAD BULBOUS TIP with wide nostrils — DO NOT refine, straighten, or narrow it.\"",
    "     - \"His skin has visible pores and natural texture with slight redness on cheeks — DO NOT smooth, airbrush, or beautify. Keep every imperfection.\"",
    "     - \"His natural smile is [subtle / closed-mouth / asymmetric / etc. from selfies] — DO NOT default to a wide toothy Hollywood smile. Match his exact smile shape from the selfies.\"",
    "     - \"He is approximately [X] years old with the age cues visible in the selfies — DO NOT rejuvenate or idealize the age.\"",
    "     - \"His skin tone is [exact term + undertone from selfies] — apply this tone to ALL visible skin (face, neck, ears, throat, chest, shoulders, arms, forearms, hands, wrists, fingers). Override the template subject's tone entirely. Transition at the jawline must be seamless — NO tone break.\"",
    "  6. Preserve the surface identity features: eye color (be precise), any moles/freckles/scars/tattoos. A friend must recognize him instantly.",
    "  7. Preserve the TEMPLATE's composition, background, accessories, clothing, pose, framing, camera angle, and lighting EXACTLY.",
    "  8. Match the lighting/color of the SELFIES' face to the TEMPLATE's ambient lighting (temperature, direction, contrast) so the swap integrates seamlessly.",
    "  9. Output a clean photorealistic photograph — no UI overlays, no watermarks, no text, no borders.",
    "  10. CLOSE with a repeat directive: \"REMINDER: the SELFIES are the ground truth for the face. If the output does not look like the man in the selfies, it has failed. Fidelity beats beautification.\"",
    "",
    "Constraints on your output:",
    "  • Start with the PRIMARY OBJECTIVE directive (step 1 above) — verbatim if possible.",
    "  • Immediately after, include the TRUST-THE-IMAGES clause: \"CRITICAL: the SELFIE photos are the ground truth. If any text description conflicts with what you see in the selfies, obey the selfies. Do not interpolate toward a more attractive baseline.\"",
    "  • Then the POSITIVE ASSERTIVE bone structure block (assertive terms, no \"medium\" / \"soft\" / \"rounded\" hedging).",
    "  • Then PILOSITY, then EXPRESSION SIGNATURE, then PAIRED positive+negative anti-idealization bullets.",
    "  • Then scene/composition/lighting.",
    "  • CLOSE with the reminder directive (step 10 above).",
    "  • BANNED WORDS in your prompt: \"medium\" (unless numerically true), \"moderate\", \"average\", \"soft\", \"softly\", \"gently\", \"slightly rounded\" (when the actual shape is broad/square), \"balanced\", \"handsome\", \"attractive\", \"flattering\", \"idealized\". These sabotage anti-drift.",
    "  • No preamble, no explanation, no meta-commentary. Just the prompt itself, ready to paste into the image model.",
    "  • Keep the total under ~900 words.",
    "",
    "Original scene description (context, may be terse or empty):",
    "```",
    scenePromptHint.slice(0, 4000),
    "```",
  ].join("\n");
}

type GeminiTextResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  error?: { message?: string };
};

// Returns null (never throws) so the caller can gracefully fall back to
// its own prompt. Errors are logged for observability.
export async function refinePromptForPair(input: RefineInput): Promise<RefineResult | null> {
  // Kill switch — set NANOBANANA_AI_PROMPT_REFINE=false to bypass globally
  // (e.g. if the refined prompts are somehow worse than the raw ones).
  if (process.env.NANOBANANA_AI_PROMPT_REFINE === "false") return null;

  const key = apiKey();
  if (!key) {
    console.warn("[promptAnalyzer] no API key set — skipping refinement");
    return null;
  }

  const model = resolvePromptModel();
  const metaPrompt = buildMetaPrompt(input.scenePromptHint);

  // Assemble the parts: text meta-prompt first, then the template image,
  // then each selfie in order. Gemini reads them left-to-right so this
  // matches the "FIRST image is TEMPLATE, following are SELFIES" language.
  const parts: Array<Record<string, unknown>> = [
    { text: metaPrompt },
    {
      inline_data: {
        mime_type: input.templateReference.mimeType,
        data: input.templateReference.data.toString("base64"),
      },
    },
  ];
  for (const ref of input.characterReferences.slice(0, 4)) {
    parts.push({
      inline_data: {
        mime_type: ref.mimeType,
        data: ref.data.toString("base64"),
      },
    });
  }

  const url = `${GEMINI_TEXT_API_BASE}/${encodeURIComponent(model)}:generateContent`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "x-goog-api-key": key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generation_config: {
          temperature: 0.4,           // slight variety, mostly deterministic
          max_output_tokens: 3072,    // ~1500-2000 words — buffer so we never MAX_TOKENS
        },
      }),
    });
  } catch (err) {
    console.error("[promptAnalyzer] fetch failed", { model, error: String(err) });
    return null;
  }

  const text = await res.text();
  if (!res.ok) {
    console.error("[promptAnalyzer] http error", { model, status: res.status, body: text.slice(0, 400) });
    return null;
  }

  let parsed: GeminiTextResponse;
  try {
    parsed = JSON.parse(text);
  } catch {
    console.error("[promptAnalyzer] invalid JSON", { model, body: text.slice(0, 200) });
    return null;
  }
  if (parsed.error) {
    console.error("[promptAnalyzer] api error", { model, error: parsed.error });
    return null;
  }

  // Concatenate all text parts of the first candidate (usually one).
  const candidate = parsed.candidates?.[0];
  const finishReason = candidate?.finishReason ?? null;
  const refined = (candidate?.content?.parts ?? [])
    .map((p) => p.text ?? "")
    .join("\n")
    .trim();

  if (finishReason && finishReason !== "STOP") {
    console.warn("[promptAnalyzer] non-STOP finish", { model, finishReason, chars: refined.length });
  }

  if (!refined) {
    console.error("[promptAnalyzer] empty response", {
      model,
      finishReason,
    });
    return null;
  }

  return { refinedPrompt: refined, model, finishReason };
}
