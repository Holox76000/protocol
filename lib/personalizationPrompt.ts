/**
 * System prompt + user prompt builder for the personalization LLM call.
 *
 * The goal: produce copy that feels written FOR this user without ever
 * revealing that we read their free-text answers. Activate the same emotional
 * mechanism with adjacent vocabulary, never quote, never name the situational
 * surface (camera, photo, speedo, wedding, scene partner...).
 */

import { TONE_OF_VOICE } from "./toneOfVoice";

// ── Persona detection (rule-based, fed to LLM as a hint) ──────────────

export type PersonaTag =
  | "romantic_seeker"
  | "identity_rework"
  | "longevity_health"
  | "comparison_shame"
  | "urgent_event"
  | "high_achiever"
  | "general";

const PERSONA_KEYWORDS: Record<PersonaTag, string[]> = {
  romantic_seeker: [
    "boyfriend", "girlfriend", "partner", "date", "dating", "desirable",
    "desire", "noticed", "attractive", "love", "intimate", "intimacy",
    "sex", "speedo", "underwear", "shirtless", "shirtless photo",
  ],
  identity_rework: [
    "purpose", "calm", "confidence", "who i am", "the man i want",
    "become", "becoming", "version of myself", "version of me",
    "discipline", "alignment", "sense of",
  ],
  longevity_health: [
    "health", "old age", "longevity", "mobility", "flexibility",
    "aging", "50", "55", "60", "joint", "sustainable", "longer",
    "later in life", "decades",
  ],
  comparison_shame: [
    "photo", "photos", "photoshoot", "mirror", "compared", "compare",
    "scene partner", "next to", "friend", "showed me", "showcase",
    "in pictures", "in photos", "look bad", "look fat",
  ],
  urgent_event: [
    "wedding", "holiday", "beach", "vacation", "trip", "event",
    "summer", "competition", "deadline", "specific date",
    "in 3 months", "in 6 months", "by",
  ],
  high_achiever: [
    "entrepreneur", "founder", "startup", "running a business",
    "cycling", "marathon", "athlete", "greatness", "everything else",
    "multiple", "balance", "family and work",
  ],
  general: [],
};

export function detectPersona(answers: {
  dream_outcome?: string;
  pain_friction?: string;
  trigger_moment?: string;
}): PersonaTag {
  const text = [
    answers.dream_outcome ?? "",
    answers.pain_friction ?? "",
    answers.trigger_moment ?? "",
  ].join(" ").toLowerCase();

  if (!text.trim()) return "general";

  const scores: Record<PersonaTag, number> = {
    romantic_seeker: 0,
    identity_rework: 0,
    longevity_health: 0,
    comparison_shame: 0,
    urgent_event: 0,
    high_achiever: 0,
    general: 0,
  };

  for (const tag of Object.keys(PERSONA_KEYWORDS) as PersonaTag[]) {
    for (const kw of PERSONA_KEYWORDS[tag]) {
      if (text.includes(kw)) scores[tag] += 1;
    }
  }

  let best: PersonaTag = "general";
  let bestScore = 0;
  for (const tag of Object.keys(scores) as PersonaTag[]) {
    if (scores[tag] > bestScore) {
      best = tag;
      bestScore = scores[tag];
    }
  }
  return bestScore >= 1 ? best : "general";
}

// ── Tool schema for forced structured output ──────────────────────────

export const PERSONALIZATION_TOOL = {
  name: "personalization_payload",
  description:
    "Output the personalization fields as a strict JSON object. All fields are required.",
  input_schema: {
    type: "object" as const,
    properties: {
      persona_tag: {
        type: "string",
        enum: [
          "romantic_seeker",
          "identity_rework",
          "longevity_health",
          "comparison_shame",
          "urgent_event",
          "high_achiever",
          "general",
        ],
        description:
          "Which persona best matches the user's emotional state, based on their free-text answers.",
      },
      hero_subtitle: {
        type: "string",
        description:
          "One sentence, 80-130 chars, starts with 'Built for men who'. Third person, NEVER quotes the user, NEVER names the situational surface they mentioned.",
      },
      patterns_intro: {
        type: "string",
        description:
          "One sentence, 100-180 chars, third person, addresses how the four upcoming patterns connect to the user's emotional mechanism. Format hint: 'These four patterns are [X] for men [Y].' or 'These four patterns [verb] [outcome] for men [Y].' Same subtle rules: no quoting, no situational surface naming.",
      },
      testimonial_id: {
        type: "string",
        enum: [
          "romantic_sam",
          "comparison_alex",
          "longevity_james",
          "identity_marcus",
          "achiever_carl",
          "event_david",
          "general_default",
        ],
        description:
          "Pick the testimonial that activates the same emotional mechanism as this user. If unsure, use general_default.",
      },
      lp_hero_h1_pre: {
        type: "string",
        description:
          "First part of the LP hero H1, BEFORE the emphasized phrase. MUST start with 'Built for men ' (audience-focused value prop, not 'Built for the body that...'). Example: 'Built for men '.",
      },
      lp_hero_h1_em: {
        type: "string",
        description:
          "Emphasized phrase of the LP hero H1, rendered with <em> tags. 4-9 words. Continues the 'Built for men [em]who want...[/em]' framing. Self-explanatory, no abstract metaphors, no situational extraction. Example: 'who want their effort to finally show.'. Always end with a period.",
      },
      lp_hero_desc: {
        type: "string",
        description:
          "LP hero description, 2 sentences, 130-200 chars total. Format: 'Most plans [X]. The Protocol [Y].' Activates same mechanism as hero_subtitle but reframed.",
      },
    },
    required: [
      "persona_tag",
      "hero_subtitle",
      "patterns_intro",
      "testimonial_id",
      "lp_hero_h1_pre",
      "lp_hero_h1_em",
      "lp_hero_desc",
    ],
  },
};

// ── System prompt ──────────────────────────────────────────────────────

export const SYSTEM_PROMPT = `
You write personalized marketing copy for the Protocol Club, a 12-week male body transformation program.

You receive a single user's free-text answers (dream, pain, trigger) plus structured profile data. You produce 4 short pieces of copy plus 1 testimonial pick that will appear in their personalized report and on their landing page.

# THE THREE RULES (non-negotiable)

## RULE 1 — Never quote, never echo

You will receive the user's verbatim answers. Your output must NEVER repeat their words or phrases. Never reference what they "said" or "told us". Never use a phrase that the user could read and think "that's exactly what I wrote".

If they wrote "I want to wear a red speedo", you do NOT write "your speedo moment", "red speedo confidence", or even "underwear-ready". You activate the same emotional mechanism with adjacent vocabulary.

## RULE 2 — Never name the situational surface

This is the most important rule and the easiest to break. The user mentioned a specific surface (camera, photo, photoshoot, speedo, beach, wedding, scene partner, dating app, boyfriend, mirror, etc.). YOU DO NOT NAME ANY OF THESE in your copy.

Why: naming the surface they mentioned reveals that you extracted it from their answer. It feels automated and creepy. The whole point is to make the user feel the product is for them BY DEFAULT, not generated FOR them.

Instead, name the underlying mechanism in universal terms:
- "photo / camera / showcase" → "what you actually look like" / "how you show up" / "what others see"
- "speedo / shirtless / underwear" → "how you feel in your own skin" / "your body without anything to hide it"
- "boyfriend / dating / desire" → "how you want to be perceived" / "the version of you you want to put forward"
- "wedding / event / deadline" → "the moments that matter" / "showing up when it counts"
- "scene partner / friend / colleague comparison" → "the gap between effort and visible result"

TEST: read your output and ask "could 3 to 4 different personas read this and feel it applies to them?" If only ONE persona could relate, your output is too specific. Make it broader.

## RULE 3 — Voice differs per field

- hero_subtitle → THIRD PERSON, format "Built for men who [universal emotional state]."
- patterns_intro → THIRD PERSON, format "These four patterns are [X] for men [Y]." or similar. Connects the upcoming patterns to the user's emotional mechanism in one sentence.
- lp_hero_h1_pre + lp_hero_h1_em → THIRD PERSON, format "Built for men [who want X / who refuse Y / who Z]." The H1 states WHO this product is for, in audience terms. Same persona as hero_subtitle but slightly rephrased.
- lp_hero_desc → THIRD PERSON, format "Most plans [X]. The Protocol [Y]."

# CLARITY RULE (especially for lp_hero_h1_em and hero_subtitle)

Every short personalized line must be SELF-EXPLANATORY to a first-time reader.

A reader who lands on this page with zero context should immediately understand what is meant. Avoid abstract metaphors that can be read two ways or that sound like idioms borrowed from unrelated contexts.

**Bad examples** (ambiguous or confusing on first read):
- "who want the body that finally shows the work" → "show the work" reads ambiguously
- "who want their body to do the talking" → vague metaphor
- "who refuse to let years of work go invisible on camera" → "on camera" is situational extraction

**Good examples** (concrete, immediately readable, audience-focused):
- "who want their effort to finally show on them"
- "who want a body that ages well"
- "who want to feel as desired as they want to be"
- "who run hot in every area and want their body to match"
- "who refuse to let years of training go invisible"
- "who want their body to match the man they're becoming"

The lp_hero_h1_em phrase MUST be 4-9 words AND immediately legible to someone who knows nothing about the user's situation. Format reminder: "Built for men [PRE] [EM]." — the full sentence must say WHO this product is for.

# FORBIDDEN VOCABULARY

Never use any of these words or stylistic patterns:

**AI slop words:** delve, crucial, robust, comprehensive, foster, leverage, pivotal, intricate, vibrant, fundamental, significant, multifaceted, nuanced, holistic, journey, transformation, empower, unlock, elevate.

**Hustle / coaching clichés:** grind, level up, game-changer, crush it, optimize, peak performance, unleash, unlock your potential.

**Vague positivity:** amazing, incredible, fantastic, powerful, supercharge, transform.

**Filler openers:** "It's worth noting", "Keep in mind", "Remember that", "As you know".

**Em dashes (— or –) used for rhythm or as connectors.** Use periods, commas, or colons instead. This is the single most recognizable AI pattern.

**Phrases like "in order to", "when it comes to", "not only X but also Y", "whether it's X or Y", "from X to Y".**

# FEW-SHOT EXAMPLES

## ✅ GOOD example — comparison_shame persona

User wrote:
- Dream: "I want the most desirable body but I want to accentuate my best features"
- Pain: "My body stops me from taking off my shirt in photoshoots"
- Trigger: "I got cast in a showcase, the photos came back and I looked fat compared to my scene partner"

GOOD output:
- persona_tag: "comparison_shame"
- hero_subtitle: "Built for men who've put in real work and still don't see it on themselves."
- patterns_intro: "These four patterns are the difference between effort and visible result for men whose work isn't translating yet."
- testimonial_id: "comparison_alex"
- lp_hero_h1_pre: "Built for men "
- lp_hero_h1_em: "who want their effort to finally show on them."
- lp_hero_desc: "Most plans build strength that doesn't always translate to what you see. The Protocol builds the shape that closes that gap."

Why this is good: No "showcase", no "photoshoot", no "scene partner", no "camera". Activates the universal "effort/visible result mismatch" that 3-4 personas share. The user recognizes himself without seeing his words.

## ✅ GOOD example — longevity_health persona

User wrote:
- Dream: "Good health, attractive physique, flexibility and mobility in old age"
- Pain: "Taking my shirt off"
- Trigger: "Been a battle since my 20s"

GOOD output:
- persona_tag: "longevity_health"
- hero_subtitle: "Built for men who want a body that holds up at 55, not just at 35."
- patterns_intro: "These four patterns separate the bodies that compound across decades from the ones that peak then crash."
- testimonial_id: "longevity_james"
- lp_hero_h1_pre: "Built for men "
- lp_hero_h1_em: "who want a body that ages well."
- lp_hero_desc: "Most plans peak at 40. The Protocol is engineered around the markers that compound, getting better with age, not worse."

Why this is good: The shirt-off pain is acknowledged abstractly via "body you fight to maintain" without naming the situation.

## ❌ BAD example — what NOT to do

Same Pedro input (comparison_shame).

BAD output:
- hero_subtitle: "Built for men who want the showcase photos to finally match their work." (BAD: "showcase photos" is extracted)
- lp_hero_h1_em: "actually want photographed." (BAD: "photographed" is extracted from the photo context, AND wrong format — should be "who want X" not "want photographed")
- lp_hero_desc: "When the camera reads you wrong..." (BAD: "camera" is extracted)

This output FAILS because the user reads it and immediately recognizes that we copied his answers. It feels automated. It kills trust.

# OUTPUT

Call the personalization_payload tool with the 7 required fields. Do not include any other text in your response.
`.trim();

// ── User prompt builder ────────────────────────────────────────────────

export type LlmInput = {
  first_name?: string;
  age_bracket?: string;
  morphology?: string;
  ethnicity?: string;
  sexual_orientation?: string;
  social_environment?: string;
  weekly_time?: string;
  past_solutions?: string;
  expected_results?: string;
  dream_outcome?: string;
  pain_friction?: string;
  trigger_moment?: string;
};

export function buildUserPrompt(input: LlmInput): string {
  const persona = detectPersona({
    dream_outcome: input.dream_outcome,
    pain_friction: input.pain_friction,
    trigger_moment: input.trigger_moment,
  });

  const lines: string[] = [];

  lines.push(`# USER PROFILE`);
  lines.push("");
  if (input.first_name) lines.push(`- First name: ${input.first_name}`);
  if (input.age_bracket) lines.push(`- Age bracket: ${input.age_bracket}`);
  if (input.morphology) lines.push(`- Morphology: ${input.morphology}`);
  if (input.ethnicity) lines.push(`- Ethnicity: ${input.ethnicity}`);
  if (input.sexual_orientation) lines.push(`- Sexual orientation: ${input.sexual_orientation}`);
  if (input.social_environment) lines.push(`- Social environment: ${input.social_environment}`);
  if (input.weekly_time) lines.push(`- Weekly training time: ${input.weekly_time}`);
  if (input.past_solutions) lines.push(`- Past solutions tried: ${input.past_solutions}`);
  if (input.expected_results) lines.push(`- Expected results: ${input.expected_results}`);
  lines.push("");

  lines.push(`# USER FREE-TEXT ANSWERS (DO NOT QUOTE)`);
  lines.push("");
  if (input.dream_outcome) {
    lines.push(`## Dream (what they want to achieve):`);
    lines.push(`"${input.dream_outcome.trim()}"`);
    lines.push("");
  }
  if (input.pain_friction) {
    lines.push(`## Pain (what's in the way):`);
    lines.push(`"${input.pain_friction.trim()}"`);
    lines.push("");
  }
  if (input.trigger_moment) {
    lines.push(`## Trigger (what made them act):`);
    lines.push(`"${input.trigger_moment.trim()}"`);
    lines.push("");
  }

  lines.push(`# RULE-BASED PERSONA HINT`);
  lines.push("");
  lines.push(`Detected persona: ${persona}`);
  lines.push("");
  lines.push(
    `You may override this if the answers clearly point to a different persona, but it should match unless you have strong evidence.`,
  );
  lines.push("");

  lines.push(`# REMINDER`);
  lines.push("");
  lines.push(
    "Apply the 3 rules. Never quote. Never name the situational surface. Voice per field. Output via the personalization_payload tool only.",
  );

  return lines.join("\n");
}

// ── Tone of voice export (referenced by README, not used in prompt) ───

export const TONE_REFERENCE = TONE_OF_VOICE;
