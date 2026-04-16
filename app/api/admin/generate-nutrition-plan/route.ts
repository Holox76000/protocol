import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireAdmin } from "../../../../lib/adminAuth";
import { supabaseAdmin } from "../../../../lib/supabase";
import { computeAttractivenessScore, bfRealisticTarget } from "../../../../lib/attractivenessScore";
import type { CalibrationMetrics } from "../../../admin/orders/[userId]/PhotoCalibrator";

export const runtime = "nodejs";
export const maxDuration = 60;

const client = new Anthropic();

function arr(v: unknown): string {
  if (Array.isArray(v)) return v.filter(Boolean).join(", ");
  if (typeof v === "string" && v) return v;
  return "—";
}

function buildPrompt(data: {
  firstName:          string;
  age:                number;
  heightCm:           number | null;
  weightKg:           number | null;
  goal:               string | null;
  weightTrend:        string | null;
  waistCm:            number | null;
  trainingExperience: string | null;
  sessionsPerWeek:    number | null;
  sessionDuration:    number | null;
  trainingLocation:   string | null;
  dailyActivity:      string | null;
  dietaryProfile:     string | null;
  foodAllergies:      string[];
  eatingHabits:       string[];
  mealsPerDay:        number | null;
  mealPrep:           string | null;
  supplements:        string[];
  sleepHours:         string | null;
  stressLevel:        number | null;
  injuries:           string[];
  medicalConditions:  string[];
  medications:        string[];
  metrics:            CalibrationMetrics | null;
  currentScore:       number | null;
  bfTarget:           number | null;
}): string {
  const {
    firstName, age, heightCm, weightKg, goal, weightTrend, waistCm,
    trainingExperience, sessionsPerWeek, sessionDuration, trainingLocation, dailyActivity,
    dietaryProfile, foodAllergies, eatingHabits, mealsPerDay, mealPrep, supplements,
    sleepHours, stressLevel, injuries, medicalConditions, medications,
    metrics, currentScore, bfTarget,
  } = data;

  // Estimate TDEE roughly for context
  let tdeeEstimate = "unknown";
  if (heightCm && weightKg && age) {
    // Mifflin-St Jeor (male)
    const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
    const activityMult =
      (sessionsPerWeek ?? 0) >= 5 ? 1.725 :
      (sessionsPerWeek ?? 0) >= 3 ? 1.55  :
      (sessionsPerWeek ?? 0) >= 1 ? 1.375 : 1.2;
    tdeeEstimate = `~${Math.round(bmr * activityMult)} kcal/day (estimated)`;
  }

  return `You are a precision nutrition coach writing a personalized nutrition plan for a male client of an elite body transformation protocol service.

## Client Profile
- Name: ${firstName}
- Age: ${age}
- Height: ${heightCm ? `${heightCm} cm` : "—"}
- Weight: ${weightKg ? `${weightKg} kg` : "—"}
- Waist circumference: ${waistCm ? `${waistCm} cm` : "—"}
- Goal: ${goal ?? "—"}
- Weight trend (last 6 months): ${weightTrend ?? "—"}
- Estimated TDEE: ${tdeeEstimate}

## Physical Assessment
${metrics ? `- Current attractiveness score: ${currentScore}/100
- Current body fat: ${metrics.bf}% → realistic target: ${bfTarget ?? "—"}%
- Shoulder-waist ratio (SWR): ${metrics.swr}
- Chest-waist ratio (CWR): ${metrics.cwr}` : "- No calibration metrics available"}

## Training
- Experience: ${trainingExperience ?? "—"}
- Sessions/week: ${sessionsPerWeek ?? "—"}
- Session duration: ${sessionDuration ? `${sessionDuration} min` : "—"}
- Location: ${trainingLocation ?? "—"}
- Daily activity level: ${dailyActivity ?? "—"}

## Nutrition & Lifestyle
- Dietary profile: ${dietaryProfile ?? "—"}
- Food allergies / intolerances: ${arr(foodAllergies)}
- Eating habits: ${arr(eatingHabits)}
- Meals per day: ${mealsPerDay ?? "—"}
- Meal prep availability: ${mealPrep ?? "—"}
- Current supplements: ${arr(supplements)}
- Sleep: ${sleepHours ?? "—"} hours/night
- Stress level: ${stressLevel != null ? `${stressLevel}/10` : "—"}

## Health
- Injuries: ${arr(injuries)}
- Medical conditions: ${arr(medicalConditions)}
- Medications: ${arr(medications)}

---

Write a complete, personalized nutrition plan. Structure it with the following sections using markdown headers:

## Caloric Target
Based on the client's TDEE, goal, and body composition target. Specify: maintenance calories, target calories, and the deficit or surplus with rationale. Be concrete (exact kcal numbers).

## Macronutrient Split
Exact grams and percentages for protein, carbohydrates, and fat. Justify each number based on the client's training volume, BF% target, and lean mass preservation needs. Include protein per kg of bodyweight.

## Meal Structure
${mealsPerDay ? `Client currently eats ${mealsPerDay} meals/day.` : ""} Propose an optimized meal timing structure aligned with their training schedule. Specify meal sizes and timing relative to training.

## Food Choices
Foods to prioritize and foods to limit or avoid, organized by category (proteins, carbs, fats, vegetables). Account for: ${arr(foodAllergies) !== "—" ? `allergies/intolerances (${arr(foodAllergies)})` : "no known allergies"}, dietary profile (${dietaryProfile ?? "no restrictions"}), and meal prep constraints (${mealPrep ?? "unknown"}).

## Sample Day
A concrete example of a full day of eating at the target calories, with approximate macros per meal. Make it practical and realistic for their lifestyle.

## Supplement Protocol
Evaluate current supplements (${arr(supplements)}) and add evidence-based recommendations relevant to their goal and profile. Cite the evidence tier (Tier 1 = strong evidence, Tier 2 = moderate, Tier 3 = emerging).

## Key Rules
5–7 non-negotiable nutrition rules for this specific client, derived from their profile. Make them concrete and actionable, not generic.

Tone: direct, expert, no fluff. Like a high-end sports nutritionist. Use precise numbers throughout. Address ${firstName} directly in the intro paragraph only.
${injuries.length > 0 || medicalConditions.length > 0 ? "\nNote: client has health conditions/injuries — flag any nutritional considerations relevant to these." : ""}`;
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const { userId } = (await request.json()) as { userId: string };
    if (!userId) return NextResponse.json({ error: "userId is required." }, { status: 400 });

    const [protocolRes, qrRes, userRes] = await Promise.all([
      supabaseAdmin.from("protocols").select("metrics").eq("user_id", userId).maybeSingle(),
      supabaseAdmin.from("questionnaire_responses").select(
        "age, height_cm, weight_kg, goal, weight_trend_6mo, waist_circumference_cm, " +
        "training_experience, sessions_per_week, session_duration_minutes, training_location, daily_activity_level, " +
        "dietary_profile, food_allergies, eating_habits, meals_per_day, meal_prep_availability, supplement_use, " +
        "sleep_hours, stress_level, injuries, medical_conditions, medications"
      ).eq("user_id", userId).maybeSingle(),
      supabaseAdmin.from("users").select("first_name").eq("id", userId).maybeSingle(),
    ]);

    const qr        = (qrRes.data ?? {}) as Record<string, unknown>;
    const metrics   = (protocolRes.data?.metrics as CalibrationMetrics | null) ?? null;
    const firstName = (userRes.data?.first_name as string | null) ?? "Client";
    const age       = (qr.age       as number | null) ?? 30;
    const weightKg  = (qr.weight_kg as number | null) ?? null;

    const { score: currentScore } = metrics
      ? computeAttractivenessScore(metrics, age)
      : { score: null };

    const bfTarget = metrics ? bfRealisticTarget(metrics.bf, age) : null;

    const prompt = buildPrompt({
      firstName,
      age,
      heightCm:          (qr.height_cm             as number | null) ?? null,
      weightKg,
      goal:              (qr.goal                  as string | null) ?? null,
      weightTrend:       (qr.weight_trend_6mo       as string | null) ?? null,
      waistCm:           (qr.waist_circumference_cm as number | null) ?? null,
      trainingExperience:(qr.training_experience    as string | null) ?? null,
      sessionsPerWeek:   (qr.sessions_per_week      as number | null) ?? null,
      sessionDuration:   (qr.session_duration_minutes as number | null) ?? null,
      trainingLocation:  (qr.training_location      as string | null) ?? null,
      dailyActivity:     (qr.daily_activity_level   as string | null) ?? null,
      dietaryProfile:    (qr.dietary_profile        as string | null) ?? null,
      foodAllergies:     Array.isArray(qr.food_allergies)   ? qr.food_allergies   as string[] : [],
      eatingHabits:      Array.isArray(qr.eating_habits)    ? qr.eating_habits    as string[] : [],
      mealsPerDay:       (qr.meals_per_day          as number | null) ?? null,
      mealPrep:          (qr.meal_prep_availability as string | null) ?? null,
      supplements:       Array.isArray(qr.supplement_use)   ? qr.supplement_use   as string[] : [],
      sleepHours:        (qr.sleep_hours            as string | null) ?? null,
      stressLevel:       (qr.stress_level           as number | null) ?? null,
      injuries:          Array.isArray(qr.injuries)          ? qr.injuries          as string[] : [],
      medicalConditions: Array.isArray(qr.medical_conditions)? qr.medical_conditions as string[] : [],
      medications:       Array.isArray(qr.medications)       ? qr.medications       as string[] : [],
      metrics,
      currentScore,
      bfTarget,
    });

    const message = await client.messages.create({
      model:      "claude-opus-4-6",
      max_tokens: 2048,
      messages:   [{ role: "user", content: prompt }],
    });

    const content = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("\n");

    await supabaseAdmin
      .from("protocols")
      .update({ nutrition_plan_content: content })
      .eq("user_id", userId);

    return NextResponse.json({ content });
  } catch (err) {
    console.error("[generate-nutrition-plan]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error." },
      { status: 500 }
    );
  }
}
