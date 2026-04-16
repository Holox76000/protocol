import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireAdmin } from "../../../../lib/adminAuth";
import { supabaseAdmin } from "../../../../lib/supabase";
import { computeAttractivenessScore, bfRealisticTarget, muscleGainMultiplier, getAgeRanges } from "../../../../lib/attractivenessScore";
import type { CalibrationMetrics } from "../../../admin/orders/[userId]/PhotoCalibrator";

export const runtime = "nodejs";
export const maxDuration = 120;

export type SectionKey =
  | "nutrition-plan"
  | "workout-plan"
  | "sleeping-advices"
  | "daily-protocol"
  | "action-plan";

const DB_COLUMN: Record<SectionKey, string> = {
  "nutrition-plan":    "nutrition_plan_content",
  "workout-plan":      "workout_plan_content",
  "sleeping-advices":  "sleeping_advices_content",
  "daily-protocol":    "daily_protocol_content",
  "action-plan":       "action_plan_content",
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

  return `### Client
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
- Sleep: ${a(d.sleep_hours)}h/night · Stress: ${d.stress_level != null ? `${d.stress_level}/10` : "—"}
- Injuries: ${a(d.injuries)} · Medical: ${a(d.medical_conditions)} · Medications: ${a(d.medications)}
- Concern areas: ${a(d.concern_areas)}

### Professional & Social
- Professional environment: ${a(d.professional_environment)} · City: ${a(d.city)}
${metricsBlock}`;
}

// ── Prompt builders ──────────────────────────────────────────────────────────

function nutritionPrompt(ctx: string, name: string): string {
  return `You are a precision nutrition coach writing a personalized nutrition plan.

${ctx}

Write a complete nutrition plan with these sections (markdown headers):

## Caloric Target
Exact kcal for maintenance and target (deficit/surplus with rationale).

## Macronutrient Split
Exact grams and % for protein, carbs, fat. Justify each based on training volume, BF% target, lean mass needs.

## Meal Structure
Optimized meal timing aligned to training schedule, with meal sizes.

## Food Choices
Prioritize/limit lists by category (proteins, carbs, fats, vegetables). Account for allergies, dietary profile, meal prep constraints.

## Sample Day
Full day of eating at target calories, macros per meal. Practical and realistic.

## Supplement Protocol
Evaluate current supplements, add evidence-based recommendations. Rate evidence tier (Tier 1/2/3).

## Key Rules
5–7 non-negotiable nutrition rules specific to this client. Concrete and actionable.

Tone: direct, expert, no fluff. Address ${name} by name only in the intro. Use precise numbers throughout.`;
}

function workoutPrompt(ctx: string, name: string): string {
  return `You are an elite strength and conditioning coach writing a personalized workout plan.

${ctx}

Write a complete, structured workout plan with these sections (markdown headers):

## Program Overview
Training philosophy for this client: frequency, split, methodology. Justify choices based on their experience, sessions/week, location, and physique goals (especially SWR and body composition targets).

## Weekly Schedule
Day-by-day breakdown. Each training day: muscle groups, session type, approximate duration.

## Exercise Selection
For each training day, list exercises with sets × reps (or time). Prioritize movements that address weak metrics (SWR, CWR, TI). Account for injuries and equipment availability.

## Progression Model
How to progress over 4–12 weeks. Specific progression rules (load, volume, frequency).

## Cardio & Conditioning
Type, frequency, duration, intensity. Calibrated to BF% target and recovery capacity.

## Recovery Protocol
Active recovery, deload frequency, mobility work. Calibrated to age (${ctx.match(/Age: (\d+)/)?.[1] ?? "unknown"}), stress level, and sleep quality.

## Key Rules
5–7 non-negotiable training rules for this client. Specific to their profile.

Tone: direct, expert. Address ${name} by name only in the intro. Be specific with exercise names, sets, reps, rest periods.`;
}

function sleepPrompt(ctx: string, name: string): string {
  return `You are a performance optimization coach writing a sleep and recovery protocol.

${ctx}

Write a complete sleep optimization protocol with these sections (markdown headers):

## Sleep Assessment
Evaluate current sleep (hours, quality signals from stress/lifestyle data). Explain the specific impact on their physique goals (testosterone, cortisol, muscle recovery, fat loss).

## Target Sleep Architecture
Target duration and timing. Justify based on age, training volume, and stress level.

## Evening Wind-Down Routine
Step-by-step protocol for the 90 minutes before sleep. Specific, time-stamped actions.

## Sleep Environment Optimization
Temperature, light, sound, devices. Specific settings and products if relevant.

## Morning Protocol
Wake time, light exposure, first actions. Aligned to their training schedule.

## Stress & Cortisol Management
Specific techniques for their stress level (${ctx.match(/Stress: (\d+)/)?.[1] ?? "—"}/10). Evidence-based interventions.

## Supplements for Sleep
Review current supplements, add evidence-based sleep aids with dosing and timing.

## Key Rules
5 non-negotiable sleep rules for this specific client.

Tone: direct, clinical precision. Address ${name} by name only in the intro.`;
}

function dailyProtocolPrompt(ctx: string, name: string): string {
  return `You are an elite lifestyle optimization coach writing a complete daily protocol.

${ctx}

Write a structured daily protocol that integrates training, nutrition, sleep, and behavioral habits. Sections (markdown headers):

## Philosophy
One paragraph: the underlying logic of this protocol for this specific person. What are the 2–3 highest-leverage daily habits given their profile?

## Morning Block (Wake → Noon)
Time-stamped routine. Include: wake time, light exposure, hydration, breakfast, morning movement/training if applicable, work preparation.

## Afternoon Block (Noon → 6pm)
Meals, training window if applicable, productivity habits, social/professional context considerations.

## Evening Block (6pm → Sleep)
Dinner, wind-down, device usage, sleep preparation. Aligned with their stress level and sleep quality.

## Non-Negotiable Daily Habits
7 specific daily actions this client must do every day. Derived from their metrics, health data, and goals. Each with a one-line rationale.

## Weekly Rhythms
Weekly recurring commitments: training days, rest days, meal prep day, check-in metrics.

## Environment Design
How to structure their physical and digital environment to make the protocol effortless. Specific to their professional environment and city context.

Tone: direct, practical. Address ${name} by name only in the intro. Make it feel like a real operating system for their life, not a generic routine.`;
}

function actionPlanPrompt(
  ctx: string,
  name: string,
  sections: { nutrition: string | null; workout: string | null; sleep: string | null; daily: string | null },
): string {
  const sectionBlock = [
    sections.nutrition  && `### Nutrition Plan\n${sections.nutrition.slice(0, 1500)}`,
    sections.workout    && `### Workout Plan\n${sections.workout.slice(0, 1500)}`,
    sections.sleep      && `### Sleep Protocol\n${sections.sleep.slice(0, 1500)}`,
    sections.daily      && `### Daily Protocol\n${sections.daily.slice(0, 1500)}`,
  ].filter(Boolean).join("\n\n");

  return `You are an elite transformation coach writing a prioritized action plan that synthesizes all protocol sections.

${ctx}

${sectionBlock ? `## Generated Protocol Sections (summaries)\n${sectionBlock}\n\n` : ""}

Write a focused Action Plan with these sections (markdown headers):

## Where You Stand
2–3 sentences: honest assessment of current state vs. potential. Reference the score and key metrics.

## The 3 Highest-Leverage Changes
The 3 interventions — from nutrition, training, sleep, or daily habits — that will move the score most for this specific person. For each: what, why (metric impact), and how to start this week.

## 30-Day Sprint
A concrete 30-day focus. One primary objective, 3 weekly milestones, and a measurable success metric.

## 90-Day Roadmap
Month-by-month progression targets for key metrics (BF%, training volume, posture score). Realistic for their age and starting point.

## What to Ignore (For Now)
2–3 things that are low-leverage for this person at this stage. Helps focus attention.

## First 7 Days
Day-by-day implementation guide for the first week. Specific enough to start immediately.

Tone: direct, motivating without being generic. This is the document ${name} reads first. Make every sentence earn its place.`;
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
        .select("metrics, nutrition_plan_content, workout_plan_content, sleeping_advices_content, daily_protocol_content")
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
      daily:     (protocolRes.data?.daily_protocol_content   as string | null) ?? null,
    };

    const promptMap: Record<SectionKey, string> = {
      "nutrition-plan":   nutritionPrompt(ctx, firstName),
      "workout-plan":     workoutPrompt(ctx, firstName),
      "sleeping-advices": sleepPrompt(ctx, firstName),
      "daily-protocol":   dailyProtocolPrompt(ctx, firstName),
      "action-plan":      actionPlanPrompt(ctx, firstName, existingSections),
    };

    const message = await client.messages.create({
      model:      "claude-opus-4-6",
      max_tokens: 4096,
      messages:   [{ role: "user", content: promptMap[section] }],
    });

    const content = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("\n");

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
