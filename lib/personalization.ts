/**
 * Personalization engine.
 *
 * Reads the user's funnel answers and produces a PersonalizationPayload via a
 * single Claude Sonnet call (forced tool_use for strict JSON output).
 *
 * Phase 0: no Supabase persistence yet. Just generate and return.
 * Phase 1+: will cache to funnel_sessions.answers._personalization.
 */

import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "./supabase";
import {
  PERSONALIZATION_TOOL,
  SYSTEM_PROMPT,
  buildUserPrompt,
  detectPersona,
  type LlmInput,
  type PersonaTag,
} from "./personalizationPrompt";
import type { TestimonialId } from "./testimonials";

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) _client = new Anthropic();
  return _client;
}

export type PersonalizationPayload = {
  version: 3;
  generated_at: string;
  persona_tag: PersonaTag;

  // Report
  hero_subtitle: string;
  patterns_intro: string;
  testimonial_id: TestimonialId;

  // LP
  lp_hero_h1_pre: string;
  lp_hero_h1_em: string;
  lp_hero_desc: string;
};

// ── Validation ─────────────────────────────────────────────────────────

const BANNED_PHRASES = [
  "delve", "crucial", "robust", "comprehensive", "foster", "pivotal",
  "intricate", "vibrant", "fundamental", "multifaceted", "nuanced",
  "holistic", "journey", "transformation", "empower", "unlock",
  "grind", "level up", "game-changer", "supercharge",
  "in order to", "when it comes to", "not only", "whether it's",
  "it's worth noting", "keep in mind", "as you know",
];

// Surfaces situationnelles que le LLM ne doit jamais nommer
const FORBIDDEN_SURFACES = [
  "speedo", "showcase", "scene partner", "boyfriend", "girlfriend",
  "wedding", "photoshoot",
];

function containsAny(text: string, list: string[]): string | null {
  const lower = text.toLowerCase();
  for (const word of list) {
    if (lower.includes(word.toLowerCase())) return word;
  }
  return null;
}

function hasEmDash(text: string): boolean {
  return text.includes("—") || text.includes("–");
}

type ValidationIssue = { field: string; reason: string };

function validatePayload(p: PersonalizationPayload): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const fields: Array<[keyof PersonalizationPayload, string]> = [
    ["hero_subtitle", p.hero_subtitle],
    ["patterns_intro", p.patterns_intro],
    ["lp_hero_h1_pre", p.lp_hero_h1_pre],
    ["lp_hero_h1_em", p.lp_hero_h1_em],
    ["lp_hero_desc", p.lp_hero_desc],
  ];

  for (const [name, value] of fields) {
    if (!value || typeof value !== "string") {
      issues.push({ field: String(name), reason: "empty or non-string" });
      continue;
    }
    const banned = containsAny(value, BANNED_PHRASES);
    if (banned) issues.push({ field: String(name), reason: `banned word: ${banned}` });

    const surface = containsAny(value, FORBIDDEN_SURFACES);
    if (surface) issues.push({ field: String(name), reason: `situational surface: ${surface}` });

    if (hasEmDash(value)) issues.push({ field: String(name), reason: "em-dash detected" });
  }

  // Length sanity
  if (p.hero_subtitle && p.hero_subtitle.length > 180) {
    issues.push({ field: "hero_subtitle", reason: `too long: ${p.hero_subtitle.length} chars` });
  }
  if (p.lp_hero_desc && p.lp_hero_desc.length > 250) {
    issues.push({ field: "lp_hero_desc", reason: `too long: ${p.lp_hero_desc.length} chars` });
  }

  // Structure expectations
  if (p.hero_subtitle && !/^built for men who/i.test(p.hero_subtitle.trim())) {
    issues.push({ field: "hero_subtitle", reason: "must start with 'Built for men who'" });
  }
  if (p.lp_hero_h1_pre && !/^built for men\s*$/i.test(p.lp_hero_h1_pre.trim())) {
    issues.push({ field: "lp_hero_h1_pre", reason: "must end with 'Built for men '" });
  }

  return issues;
}

// ── LLM call ───────────────────────────────────────────────────────────

const MODEL = "claude-sonnet-4-6";

export type GenerateResult =
  | { kind: "ok"; payload: PersonalizationPayload; issues: ValidationIssue[] }
  | { kind: "skipped"; reason: string }
  | { kind: "error"; reason: string };

export async function generatePersonalization(
  input: LlmInput,
): Promise<GenerateResult> {
  // Skip if no free-text at all — fallback to generic surfaces.
  const hasAnyFreeText = !!(
    input.dream_outcome?.trim() ||
    input.pain_friction?.trim() ||
    input.trigger_moment?.trim()
  );
  if (!hasAnyFreeText) {
    return { kind: "skipped", reason: "no free-text answers (dream/pain/trigger all empty)" };
  }

  const userPrompt = buildUserPrompt(input);

  let response;
  try {
    response = await getClient().messages.create({
      model: MODEL,
      max_tokens: 1200,
      system: SYSTEM_PROMPT,
      tools: [PERSONALIZATION_TOOL],
      tool_choice: { type: "tool", name: PERSONALIZATION_TOOL.name },
      messages: [{ role: "user", content: userPrompt }],
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { kind: "error", reason: `Anthropic API error: ${msg}` };
  }

  // Extract the tool_use block
  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    return { kind: "error", reason: "LLM did not call the personalization_payload tool" };
  }

  const raw = toolUse.input as Record<string, unknown>;

  const payload: PersonalizationPayload = {
    version: 3,
    generated_at: new Date().toISOString(),
    persona_tag: (raw.persona_tag as PersonaTag) ?? detectPersona(input),
    hero_subtitle: String(raw.hero_subtitle ?? "").trim(),
    patterns_intro: String(raw.patterns_intro ?? "").trim(),
    testimonial_id: (raw.testimonial_id as TestimonialId) ?? "general_default",
    lp_hero_h1_pre: String(raw.lp_hero_h1_pre ?? "").trim(),
    lp_hero_h1_em: String(raw.lp_hero_h1_em ?? "").trim(),
    lp_hero_desc: String(raw.lp_hero_desc ?? "").trim(),
  };

  const issues = validatePayload(payload);
  return { kind: "ok", payload, issues };
}

// ── Persona-derived static copy ────────────────────────────────────────

/**
 * Persona-coded eyebrow label that replaces the generic "Based on your quiz
 * answers" above the patterns section. Stays in the .lb uppercase styling
 * and reads as a subtle micro-personalization without revealing extraction.
 */
export function patternsEyebrowFor(persona: PersonaTag | null | undefined): string {
  switch (persona) {
    case "comparison_shame":
      return "When the work doesn't read on you yet";
    case "romantic_seeker":
      return "When the body lags behind the intention";
    case "longevity_health":
      return "When today's wins need to compound";
    case "identity_rework":
      return "When the inside is moving faster than the body";
    case "high_achiever":
      return "When time is the real constraint";
    case "urgent_event":
      return "When there's a specific moment to be ready for";
    default:
      return "Based on your quiz answers";
  }
}

// ── Cache wrapper (Supabase) ───────────────────────────────────────────

const CACHE_KEY = "_personalization";

function extractInputFromAnswers(answers: Record<string, unknown>): LlmInput {
  return {
    first_name: answers.first_name as string | undefined,
    age_bracket: answers.age_bracket as string | undefined,
    morphology: answers.morphology as string | undefined,
    ethnicity: answers.ethnicity as string | undefined,
    sexual_orientation: answers.sexual_orientation as string | undefined,
    social_environment: answers.social_environment as string | undefined,
    weekly_time: answers.weekly_time as string | undefined,
    past_solutions: Array.isArray(answers.past_solutions)
      ? (answers.past_solutions as string[]).join(", ")
      : (answers.past_solutions as string | undefined),
    expected_results: Array.isArray(answers.expected_results)
      ? (answers.expected_results as string[]).join(", ")
      : (answers.expected_results as string | undefined),
    dream_outcome: answers.dream_outcome as string | undefined,
    pain_friction: Array.isArray(answers.pain_friction)
      ? (answers.pain_friction as string[]).join(", ")
      : (answers.pain_friction as string | undefined),
    trigger_moment: answers.trigger_moment as string | undefined,
  };
}

/**
 * Read from cache or generate via LLM, then persist.
 * Returns null if no free-text answers (caller should fall back to generic).
 */
export async function getOrGeneratePersonalization(
  sessionId: string,
  answers: Record<string, unknown>,
): Promise<PersonalizationPayload | null> {
  const cached = answers[CACHE_KEY] as PersonalizationPayload | undefined;
  if (cached && cached.version === 3 && cached.hero_subtitle && cached.patterns_intro) {
    return cached;
  }

  const input = extractInputFromAnswers(answers);
  const result = await generatePersonalization(input);

  if (result.kind !== "ok") {
    return null;
  }

  // Persist to Supabase (fire-and-forget OK, but we await to ensure cache hits next time)
  try {
    const nextAnswers = { ...answers, [CACHE_KEY]: result.payload };
    await supabaseAdmin
      .from("funnel_sessions")
      .update({ answers: nextAnswers })
      .eq("session_id", sessionId);
  } catch {
    // Persistence failure shouldn't break the render. Return payload anyway.
  }

  return result.payload;
}
