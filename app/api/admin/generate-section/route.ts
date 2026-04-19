import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireAdmin } from "../../../../lib/adminAuth";
import { supabaseAdmin } from "../../../../lib/supabase";
import { computeAttractivenessScore, bfRealisticTarget, muscleGainMultiplier, getAgeRanges } from "../../../../lib/attractivenessScore";
import type { CalibrationMetrics } from "../../../admin/orders/[userId]/PhotoCalibrator";
import { SCIENTIFIC_REFERENCE_BASE } from "../../../../lib/studies";
import { socialContextBlock } from "../../../../lib/socialContext";
import { TONE_OF_VOICE } from "../../../../lib/toneOfVoice";

export const runtime = "nodejs";
export const maxDuration = 120;

export type SectionKey =
  | "nutrition-plan"
  | "workout-plan"
  | "sleeping-advices"
  | "action-plan"
  | "posture-analysis"
  | "supplement-protocol";

const DB_COLUMN: Record<SectionKey, string> = {
  "nutrition-plan":      "nutrition_plan_content",
  "workout-plan":        "workout_plan_content",
  "sleeping-advices":    "sleeping_advices_content",
  "action-plan":         "action_plan_content",
  "posture-analysis":    "posture_analysis_content",
  "supplement-protocol": "supplement_protocol_content",
};

const client = new Anthropic();

function a(v: unknown): string {
  if (Array.isArray(v)) return v.filter(Boolean).join(", ") || "—";
  if (typeof v === "string" && v) return v;
  return "—";
}

// ── Shared client context ────────────────────────────────────────────────────

function clientContext(d: Record<string, unknown>, metrics: CalibrationMetrics | null, age: number): string {
  const weightKg = d.weight_kg as number | null;
  const heightCm = d.height_cm as number | null;
  const sessions = d.sessions_per_week as number | null;

  let tdee = "unknown";
  if (heightCm && weightKg) {
    const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
    const mult = (sessions ?? 0) >= 5 ? 1.725 : (sessions ?? 0) >= 3 ? 1.55 : (sessions ?? 0) >= 1 ? 1.375 : 1.2;
    tdee = `~${Math.round(bmr * mult)} kcal/day`;
  }

  const ageRanges  = metrics ? getAgeRanges(age) : null;
  const gainMult   = muscleGainMultiplier(age);
  const r2         = (v: number) => Math.round(v * 100) / 100;

  const metricsBlock = metrics && ageRanges ? `
### Physical Metrics (age-adjusted for ${age}y)
${(Object.keys(metrics) as (keyof CalibrationMetrics)[]).map((key) => {
    const val = metrics[key];
    const [min, max] = ageRanges[key];
    const inRange = val >= min && val <= max;
    let target: string;
    if (key === "bf") target = `${bfRealisticTarget(val, age)}%`;
    else if (key === "pas") target = String(Math.min(92, Math.round(val + 20 * Math.min(gainMult + 0.2, 1))));
    else if (!inRange && val < min) target = String(r2(val + (min - val) * gainMult));
    else target = inRange ? "already optimal" : String(r2(val - (val - max) * gainMult));
    const labels: Record<keyof CalibrationMetrics, string> = { swr:"SWR", cwr:"CWR", bf:"BF%", pas:"PAS", ti:"TI", pc:"PC" };
    return `- ${labels[key]}: ${val} → target ${target} [optimal ${min}–${max}]${inRange ? " ✓" : ""}`;
  }).join("\n")}
- Current score: ${computeAttractivenessScore(metrics, age).score}/100` : "";

  return `${SCIENTIFIC_REFERENCE_BASE}

---

### Client
- Name: ${d.first_name ?? "Client"} · Age: ${age}
- Height: ${heightCm ?? "—"} cm · Weight: ${weightKg ?? "—"} kg · Waist: ${d.waist_circumference_cm ?? "—"} cm
- Goal: ${a(d.goal)} · Weight trend (6mo): ${a(d.weight_trend_6mo)}
- Estimated TDEE: ${tdee}

### Training
- Experience: ${a(d.training_experience)} · Sessions/week: ${a(d.sessions_per_week)} · Duration: ${d.session_duration_minutes ? `${d.session_duration_minutes} min` : "—"}
- Location: ${a(d.training_location)} · Daily activity: ${a(d.daily_activity_level)}
- Activities: ${a(d.preferred_activities)}

### Nutrition
- Dietary profile: ${a(d.dietary_profile)} · Meals/day: ${a(d.meals_per_day)} · Meal prep: ${a(d.meal_prep_availability)}
- Allergies: ${a(d.food_allergies)} · Habits: ${a(d.eating_habits)} · Supplements: ${a(d.supplement_use)}

### Health & Recovery
- Sleep: ${a(d.sleep_hours)}h/night · Wake: ${a(d.wake_time)} · Bedtime: ${a(d.bed_time)} · Schedule regularity: ${a(d.sleep_schedule_regularity)}
- Stress: ${d.stress_level != null ? `${d.stress_level}/5` : "—"}
- Injuries: ${a(d.injuries)} · Medical: ${a(d.medical_conditions)} · Medications: ${a(d.medications)}
- Concern areas: ${a(d.concern_areas)}

### Professional & Social
- Professional environment: ${a(d.professional_environment)} · City: ${a(d.city)}
- Typical clothing: ${a(d.typical_clothing)}
- Social perception: ${a(d.social_perception)}
${metricsBlock}

${socialContextBlock({
  professional_environment: d.professional_environment as string | null,
  professional_environment_other: d.professional_environment_other as string | null,
  typical_clothing: d.typical_clothing as string | null,
  social_perception: Array.isArray(d.social_perception) ? d.social_perception as string[] : null,
})}`;
}

// ── Multi-part generation ─────────────────────────────────────────────────────

async function generateMultiPart(
  systemRole: string,
  ctx: string,
  parts: Array<{ title: string; instructions: string; maxTokens: number }>,
): Promise<string> {
  const generatedParts: string[] = [];

  // The base context is identical across all calls for this section — cache it.
  // Call 1 writes the cache; calls 2-N hit it at $1.50/MTok instead of $15/MTok.
  const cachedText = `${systemRole}\n\n${TONE_OF_VOICE}\n\n${ctx}`;

  for (const part of parts) {
    const previousContext = generatedParts.length > 0
      ? `\n## Already written sections (for coherence)\n${generatedParts.map(p => p.slice(0, 400)).join("\n\n")}\n`
      : "";

    const dynamicText = `${previousContext}
Write ONLY the following section (start directly with the markdown header, no preamble).
Target length: ${part.maxTokens} tokens. Be concise. Stop as soon as the section is complete — do not pad.

${part.title}
${part.instructions}`;

    // Hard ceiling: 1.5× the target to absorb natural variance without ever cutting mid-sentence.
    // Claude stops when done — it will not inflate to the ceiling.
    const message = await client.messages.create({
      model:      "claude-opus-4-6",
      max_tokens: Math.max(Math.round(part.maxTokens * 1.5), 1024),
      messages: [
        {
          role: "user",
          content: [
            {
              type:          "text",
              text:          cachedText,
              cache_control: { type: "ephemeral" },
            },
            {
              type: "text",
              text: dynamicText,
            },
          ],
        },
      ],
    });

    const text = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("\n");

    generatedParts.push(text);
  }

  return generatedParts.join("\n\n");
}

// ── Section parts definitions ─────────────────────────────────────────────────

function nutritionParts(name: string): Array<{ title: string; instructions: string; maxTokens: number }> {
  return [
    {
      title:        "## Caloric Target",
      instructions: `Exact kcal for maintenance and target (deficit/surplus with rationale). Address ${name} by name in this opening section.`,
      maxTokens:    400,
    },
    {
      title:        "## Macronutrient Split",
      instructions: "Exact grams and % for protein, carbs, fat. Justify each based on training volume, BF% target, lean mass needs.",
      maxTokens:    600,
    },
    {
      title:        "## Food Choices",
      instructions: `List foods by category using EXACTLY this format (4 categories, in this order: Proteins, Carbohydrates, Fats, Vegetables):

### Proteins
**Prioritize:** item1, item2, item3, item4, item5
**Limit:** item1, item2, item3

### Carbohydrates
**Prioritize:** item1, item2, item3, item4, item5
**Limit:** item1, item2, item3

### Fats
**Prioritize:** item1, item2, item3, item4
**Limit:** item1, item2

### Vegetables
**Prioritize:** item1, item2, item3, item4, item5
**Limit:** item1, item2 (or "none — all non-starchy vegetables are unlimited" if applicable)

Account for allergies, dietary profile, and meal prep constraints. Each item must be a short food name (1–3 words), no descriptions. Output only the 4 category blocks, nothing else.`,
      maxTokens:    700,
    },
    {
      title:        "## 90-Day Meal Plan",
      instructions: `Generate a complete 90-day meal plan as a markdown table with EXACTLY this format:

| Day | Breakfast | Lunch | Dinner | Snack |
|-----|-----------|-------|--------|-------|
| 1 | dish name | dish name | dish name | snack |
| 2 | ... | ... | ... | ... |

Rules:
- Include all 90 rows (Day 1 through Day 90), no skipping
- Each meal entry: concise dish name only (2–5 words), no descriptions or macros
- Align with the caloric target, macros, and food choices from previous sections
- Account for the client's dietary profile, food allergies, meal prep availability, and eating habits
- Rotate meals across weeks for variety; avoid repeating the same meal more than twice per week
- Structure progressively: build habits in Month 1, introduce variety in Month 2, refine in Month 3`,
      maxTokens:    5000,
    },
    {
      title:        "## Key Rules",
      instructions: "5–7 non-negotiable nutrition rules specific to this client. Concrete and actionable.",
      maxTokens:    400,
    },
  ];
}

function supplementParts(name: string): Array<{ title: string; instructions: string; maxTokens: number }> {
  return [
    {
      title:        "## Current Supplement Assessment",
      instructions: `Evaluate every supplement this client is currently taking. For each: verdict (keep / adjust / drop), rationale, and any dosing concerns. If they take nothing, say so and explain what that means for their protocol. Address ${name} by name in this opening section.`,
      maxTokens:    800,
    },
    {
      title:        "## Recommended Stack",
      instructions: `Full evidence-based supplement stack for this client's goals and profile. For each supplement:
- Name and form (e.g. Creatine monohydrate)
- Why it applies to this specific client (link to their metrics, goal, training volume, or health profile)
- Evidence tier: **Tier 1** (strong RCT evidence), **Tier 2** (moderate/emerging evidence), or **Tier 3** (theoretical/limited)

Order by impact. Include only what genuinely moves the needle for this profile. Be specific about forms and avoid generic lists. Write complete entries — do not truncate.`,
      maxTokens:    2000,
    },
    {
      title:        "## Timing & Dosing Protocol",
      instructions: "For every supplement listed in the Recommended Stack: exact dose, timing (time of day, relative to meals), and any stacking synergies or antagonisms. Cover rest days only here — training days are covered in the next section. Cover every single supplement — do not skip any.",
      maxTokens:    1200,
    },
    {
      title:        "## Daily Schedule: Training Days",
      instructions: "Reproduce the full supplement schedule adapted for training days. For each supplement: same dose and timing as rest days unless training changes anything (pre/intra/post-workout adjustments). Format as a time-stamped daily schedule from wake to sleep. Cover every single supplement — do not skip any.",
      maxTokens:    1200,
    },
  ];
}

function workoutParts(ctx: string, name: string): Array<{ title: string; instructions: string; maxTokens: number }> {
  const age = ctx.match(/Age: (\d+)/)?.[1] ?? "unknown";
  return [
    {
      title:        "## Program Overview",
      instructions: `2–3 sentences maximum: training split chosen, why it fits this client's sessions/week, location, and priority metrics (SWR, CWR, TI). Nothing else. Address ${name} by name.`,
      maxTokens:    300,
    },
    {
      title:        "## Weekly Training Plan",
      instructions: `Generate the full weekly training plan as a markdown table. One row per exercise. Use EXACTLY this format:

| Day | Session | Exercise | Sets × Reps | Load | Rest |
|-----|---------|----------|-------------|------|------|
| Monday | Push A | Bench Press | 4×8 | 70% 1RM | 90s |
| Monday | Push A | Overhead Press | 3×10 | 65% 1RM | 60s |
| Tuesday | REST | — | — | — | — |

Rules:
- Cover all 7 days of the week, including rest days (REST row with dashes)
- One row per exercise, not per session
- Load column: use % 1RM for compound lifts, "RPE 7", "light", "bodyweight", or "BW" as appropriate. Leave blank (—) if not applicable (cardio, stretching)
- Sets × Reps: use standard notation (4×8, 3×12, etc.) or time-based (3×45s)
- Rest: in seconds or minutes (90s, 2min)
- Prioritize exercises that directly address weak metrics (SWR, CWR, TI)
- Account for injuries, equipment availability, and training location
- Include cardio sessions as rows with duration and intensity in the Reps column`,
      maxTokens:    2500,
    },
    {
      title:        "## 3-Month Progression",
      instructions: `Generate a progression table showing how the weekly plan evolves over 3 months. Use EXACTLY this format:

| Phase | Weeks | Load | Volume | Key Adjustment |
|-------|-------|------|--------|----------------|
| Foundation | 1–4 | 65–70% 1RM | 3 sets/exercise | Learn movement patterns, build base |
| Development | 5–8 | 72–77% 1RM | 4 sets/exercise | Progressive overload, add volume |
| Peak | 9–11 | 80–85% 1RM | 4–5 sets/exercise | Intensity peak, reduce accessory volume |
| Deload | 12 | 50–60% 1RM | 2 sets/exercise | Full recovery before retest |

Adapt the phases, loads, and adjustments to this client's starting point, age (${age}), and recovery capacity. Add a second table if cardio progression is relevant:

| Phase | Weeks | Type | Frequency | Duration | Intensity |
|-------|-------|------|-----------|----------|-----------|`,
      maxTokens:    1200,
    },
    {
      title:        "## Key Rules",
      instructions: `5 non-negotiable training rules for this client. Each rule: one sentence, specific and actionable. No generic advice.`,
      maxTokens:    400,
    },
  ];
}

function sleepParts(ctx: string, name: string): Array<{ title: string; instructions: string; maxTokens: number }> {
  const stress = ctx.match(/Stress: (\d+)/)?.[1] ?? "—";
  return [
    {
      title:        "## Sleep Assessment",
      instructions: `2–3 sentences only: current sleep situation, direct impact on their physique goals (testosterone, cortisol, muscle recovery). Address ${name} by name. No generic sleep facts.`,
      maxTokens:    250,
    },
    {
      title:        "## Daily Sleep Schedule",
      instructions: `Generate a full daily sleep schedule as a markdown table. One row per action, covering the evening wind-down, sleep window, and morning wake routine. Use EXACTLY this format:

| Time | Action | Duration | Purpose |
|------|--------|----------|---------|
| 8:30 PM | Last meal | — | Digestion complete before sleep |
| 9:30 PM | Screens off | — | Blue light suppresses melatonin |
| 10:00 PM | Hot shower | 15 min | Core temperature drop triggers sleep onset |
| 10:15 PM | Reading or journaling | 30 min | Cognitive wind-down |
| 10:45 PM | Lights out | — | Target bedtime |
| 6:30 AM | Wake | — | Consistent anchor point |
| 6:30 AM | Outdoor light exposure | 10 min | Cortisol peak, circadian reset |

Rules:
- Use actual clock times based on the client's reported bed time and wake time
- Include only actions that are relevant to their profile
- Purpose column: one short phrase, specific to the physiological reason. No filler.
- Cover the full window from start of wind-down to end of morning routine`,
      maxTokens:    900,
    },
    {
      title:        "## Sleep Environment",
      instructions: `Two short tables.

Table 1: environment settings
| Element | Target | Rationale |
|---------|--------|-----------|
| Temperature | 65–67°F | Optimal for sleep onset |
| Light | Blackout | — |
| Noise | — | — |
| Devices | — | — |

Table 2: stress management (only if stress level ${stress}/5 is 3 or above — skip otherwise)
| Technique | When | Duration |
|-----------|------|----------|
| Box breathing | Before bed | 5 min |

Keep both tables tight. No prose.`,
      maxTokens:    600,
    },
    {
      title:        "## Key Rules",
      instructions: "5 non-negotiable sleep rules for this client. One sentence each, specific and actionable.",
      maxTokens:    300,
    },
  ];
}


const POSTURE_SYSTEM_ROLE = `You are a posture and movement specialist writing a personalized posture analysis and correction protocol.

CRITICAL — PAS score interpretation (never invert this scale):
- PAS (Posture Alignment Score) measures 0–100
- 100 = perfect vertical alignment (ear, shoulder, hip, ankle in one line on the lateral photo)
- 80–95 = optimal range
- 98 = near-perfect posture. 45 = significant forward lean or misalignment.
- High PAS = good posture. Low PAS = poor posture.`;

function postureParts(name: string): Array<{ title: string; instructions: string; maxTokens: number }> {
  return [
    {
      title: "## Posture Assessment",
      instructions: `2–3 sentences: what the PAS score reveals about spinal alignment, head position, and shoulder posture. What is visually happening to the silhouette? If PAS is above 95, acknowledge strong alignment and focus on maintenance. If below 70, detail the specific dysfunction. Address ${name} by name in the first sentence.`,
      maxTokens: 250,
    },
    {
      title: "## Impact on Attractiveness Metrics",
      instructions: `Generate a table showing how their current posture affects key attractiveness metrics. Use EXACTLY this format:

| Metric | Current | Posture Impact | Priority |
|--------|---------|----------------|----------|
| Shoulder-Waist Ratio | x.xx | One-line effect on visual perception | High |
| Perceived Height | — | One-line effect | Medium |
| Overall Score | xx/100 | One-line contribution | High |

Use actual values from the client profile. "Posture Impact" must be specific: what happens visually or mechanically. If a metric is unaffected by posture, omit it.`,
      maxTokens: 400,
    },
    {
      title: "## Root Causes",
      instructions: "Identify the 2–3 most likely structural causes for their posture score, given their training experience, daily activity level, professional environment, and injuries. Numbered list. One sentence per cause, anatomically specific.",
      maxTokens: 350,
    },
    {
      title: "## Correction Protocol",
      instructions: `If PAS is in the optimal range (80–95+): maintenance focus. Write 3–4 targeted actions as a short numbered list. Keep this brief.

If PAS is below 80: generate the full correction table:

| Exercise | Sets × Reps | Frequency | Target Muscle / Structure |
|----------|------------|-----------|--------------------------|
| Dead hang | 3 × 30s | Daily | Thoracic decompression |
| Wall angels | 3 × 10 | Daily | Scapular retraction, mid-trap |

Sections:
1. Daily mobility routine (at least 3 exercises)
2. Strength corrections targeting identified imbalances
3. Environmental adjustments (desk setup, screen height, phone habits)

Every entry must be anatomically specific. No generic "stretch and strengthen."`,
      maxTokens: 1200,
    },
    {
      title: "## Progress Markers",
      instructions: `Generate a progress tracking table:

| Timeline | Observable Marker | Target | How to Measure |
|----------|-------------------|--------|----------------|
| Week 4 | ... | ... | ... |
| Week 8 | ... | ... | ... |
| Week 12 | ... | ... | ... |

Each marker must be specific to this client's starting PAS score and correction protocol. Mix objective markers (measurable or photographable) with subjective ones (how it feels). No generic "you will feel better."`,
      maxTokens: 400,
    },
    {
      title: "## Key Rules",
      instructions: "5 non-negotiable posture rules for this specific client. One sentence each. Tied to their root causes, professional environment, and daily habits. No generic advice.",
      maxTokens: 300,
    },
  ];
}

// ── Action Plan: multi-part generation ──────────────────────────────────────

const ACTION_PLAN_PARTS: Array<{
  title:        string;
  instructions: string;
  maxTokens:    number;
}> = [
  {
    title: "## Where You Stand",
    instructions: "Write 2–3 sentences: honest assessment of current state vs. potential. Reference the score and key metrics. Be direct and specific to this client's numbers.",
    maxTokens: 400,
  },
  {
    title: "## The 3 Highest-Leverage Changes",
    instructions: "The 3 interventions — from nutrition, training, sleep, or daily habits — that will move the score most for this specific person. For each: what, why (metric impact), and how to start this week.",
    maxTokens: 1200,
  },
  {
    title: "## 30-Day Sprint",
    instructions: "A concrete 30-day focus. One primary objective, 3 weekly milestones, and a measurable success metric.",
    maxTokens: 900,
  },
  {
    title: "## 90-Day Roadmap",
    instructions: "Month-by-month progression targets for key metrics (BF%, training volume, posture score). Realistic for their age and starting point.",
    maxTokens: 900,
  },
  {
    title: "## What to Ignore (For Now)",
    instructions: "2–3 things that are low-leverage for this person at this stage. Helps focus attention.",
    maxTokens: 400,
  },
  {
    title: "## First 7 Days",
    instructions: "Day-by-day implementation guide for the first week. Specific enough to start immediately.",
    maxTokens: 1200,
  },
];

async function generateActionPlanMultiPart(
  ctx: string,
  name: string,
  sections: { nutrition: string | null; workout: string | null; sleep: string | null },
): Promise<string> {
  const sectionBlock = [
    sections.nutrition  && `### Nutrition Plan\n${sections.nutrition.slice(0, 800)}`,
    sections.workout    && `### Workout Plan\n${sections.workout.slice(0, 800)}`,
    sections.sleep      && `### Sleep Protocol\n${sections.sleep.slice(0, 800)}`,
  ].filter(Boolean).join("\n\n");

  const enrichedCtx = `${ctx}\n\n${sectionBlock ? `## Protocol Sections (summaries)\n${sectionBlock}` : ""}`;

  return generateMultiPart(
    `You are an elite transformation coach writing a prioritized action plan for ${name}.`,
    enrichedCtx,
    ACTION_PLAN_PARTS,
  );
}

// ── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const { userId, section } = (await request.json()) as { userId: string; section: SectionKey };
    if (!userId || !section) return NextResponse.json({ error: "userId and section are required." }, { status: 400 });
    if (!DB_COLUMN[section]) return NextResponse.json({ error: `Unknown section: ${section}` }, { status: 400 });

    const [protocolRes, qrRes, userRes] = await Promise.all([
      supabaseAdmin.from("protocols")
        .select("metrics, nutrition_plan_content, workout_plan_content, sleeping_advices_content")
        .eq("user_id", userId).maybeSingle(),
      supabaseAdmin.from("questionnaire_responses").select("*").eq("user_id", userId).maybeSingle(),
      supabaseAdmin.from("users").select("first_name").eq("id", userId).maybeSingle(),
    ]);

    const qr        = { ...(qrRes.data ?? {}), first_name: userRes.data?.first_name ?? "Client" } as Record<string, unknown>;
    const metrics   = (protocolRes.data?.metrics as CalibrationMetrics | null) ?? null;
    const firstName = (qr.first_name as string) ?? "Client";
    const age       = (qr.age as number | null) ?? 30;
    const ctx       = clientContext(qr, metrics, age);

    const existingSections = {
      nutrition: (protocolRes.data?.nutrition_plan_content   as string | null) ?? null,
      workout:   (protocolRes.data?.workout_plan_content     as string | null) ?? null,
      sleep:     (protocolRes.data?.sleeping_advices_content as string | null) ?? null,
    };

    let content: string;

    if (section === "action-plan") {
      content = await generateActionPlanMultiPart(ctx, firstName, existingSections);
    } else if (section === "nutrition-plan") {
      content = await generateMultiPart(
        "You are a precision nutrition coach writing a personalized nutrition plan.",
        ctx,
        nutritionParts(firstName),
      );
    } else if (section === "workout-plan") {
      content = await generateMultiPart(
        "You are an elite strength and conditioning coach writing a personalized workout plan.",
        ctx,
        workoutParts(ctx, firstName),
      );
    } else if (section === "sleeping-advices") {
      content = await generateMultiPart(
        "You are a performance optimization coach writing a sleep and recovery protocol.",
        ctx,
        sleepParts(ctx, firstName),
      );
    } else if (section === "supplement-protocol") {
      content = await generateMultiPart(
        "You are a sports nutrition and supplementation expert writing a personalized supplement protocol.",
        ctx,
        supplementParts(firstName),
      );
    } else {
      // posture-analysis
      content = await generateMultiPart(
        POSTURE_SYSTEM_ROLE,
        ctx,
        postureParts(firstName),
      );
    }

    await supabaseAdmin
      .from("protocols")
      .update({ [DB_COLUMN[section]]: content })
      .eq("user_id", userId);

    return NextResponse.json({ content });
  } catch (err) {
    console.error("[generate-section]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Server error." }, { status: 500 });
  }
}
