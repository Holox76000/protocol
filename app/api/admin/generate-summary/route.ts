import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireAdmin } from "../../../../lib/adminAuth";
import { supabaseAdmin } from "../../../../lib/supabase";
import { computeAttractivenessScore, computeRealisticPotential, getAgeRanges, bfRealisticTarget, muscleGainMultiplier } from "../../../../lib/attractivenessScore";
import type { CalibrationMetrics } from "../../../admin/orders/[userId]/PhotoCalibrator";

export const runtime = "nodejs";
export const maxDuration = 60;

const client = new Anthropic();

function buildPrompt(params: {
  firstName:          string;
  age:                number;
  metrics:            CalibrationMetrics;
  score:              number;
  potential:          number;
  scoreLabel:         string;
  goal:               string | null;
  heightCm:           number | null;
  weightKg:           number | null;
  trainingExperience: string | null;
  sessionsPerWeek:    number | null;
}): string {
  const { firstName, age, metrics, score, potential, scoreLabel, goal, heightCm, weightKg, trainingExperience, sessionsPerWeek } = params;
  const ageRanges  = getAgeRanges(age);
  const gainMult   = muscleGainMultiplier(age);
  const r2         = (v: number) => Math.round(v * 100) / 100;

  const labels: Record<keyof CalibrationMetrics, string> = {
    swr: "Shoulder-Waist Ratio",
    cwr: "Chest-Waist Ratio",
    bf:  "Body Fat %",
    pas: "Posture Score",
    ti:  "Taper Index",
    pc:  "Proportion Score",
  };

  // Per-metric: current value, age-adjusted optimal range, realistic achievable target
  const metricLines = (Object.keys(metrics) as (keyof CalibrationMetrics)[]).map((key) => {
    const value = metrics[key];
    const [min, max] = ageRanges[key];
    const inRange = value >= min && value <= max;

    // Compute realistic target
    let realisticTarget: string;
    if (key === "bf") {
      const t = bfRealisticTarget(value, age);
      realisticTarget = inRange ? `${value} (already optimal)` : `${t}%`;
    } else if (key === "pas") {
      const t = Math.min(92, Math.round(value + 20 * Math.min(gainMult + 0.2, 1)));
      realisticTarget = inRange ? `${value} (already optimal)` : String(t);
    } else {
      if (inRange) {
        realisticTarget = `${value} (already optimal)`;
      } else if (value < min) {
        realisticTarget = String(r2(value + (min - value) * gainMult));
      } else {
        realisticTarget = String(r2(value - (value - max) * gainMult));
      }
    }

    const status = inRange
      ? `✓ within optimal range [${min}–${max}]`
      : value < min
        ? `↓ below optimal [${min}–${max}]`
        : `↑ above optimal [${min}–${max}]`;

    return `- ${labels[key]}: current ${value} — ${status} — realistic target: ${realisticTarget}`;
  }).join("\n");

  return `You are writing a personal physical attractiveness analysis report for a client of an elite body transformation protocol service.

Client profile:
- Name: ${firstName}
- Age: ${age}
- Height: ${heightCm ? `${heightCm} cm` : "unknown"}
- Weight: ${weightKg ? `${weightKg} kg` : "unknown"}
- Goal: ${goal ?? "general improvement"}
- Training experience: ${trainingExperience ?? "unknown"}
- Sessions per week: ${sessionsPerWeek ?? "unknown"}

Physical Attractiveness Score: ${score}/100 (${scoreLabel})
Realistic potential for age ${age}: ${potential}/100

Note: 100/100 = perfectly optimized for age ${age} — not a universal standard. The score is calibrated to age-adjusted optimal ranges based on peer-reviewed research.

Metric breakdown (age-adjusted ranges for ${age}y):
${metricLines}

Write a Summary Report in 3–4 short paragraphs:

1. **Where they stand** — contextualize the score of ${score}/100 for a ${age}-year-old. Be honest but constructive. Mention what it reflects about their current physique.

2. **Key gaps** — identify the 2–3 metrics furthest from optimal and explain in plain language what they look like and why they matter for physical attractiveness. Be specific.

3. **The opportunity** — explain the gap between ${score} and ${potential}/100. What changes would move the needle most? Be concrete and age-realistic.

4. **Closing** — one motivating sentence calibrated to their age and goal.

Tone: direct, intelligent, no fluff. Like a high-end consultant speaking to a motivated adult. No bullet points — flowing paragraphs only. Do not repeat the metric numbers verbatim — translate them into physical reality. Do not use the word "attractiveness" more than once. Address ${firstName} directly.`;
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const { userId } = (await request.json()) as { userId: string };
    if (!userId) return NextResponse.json({ error: "userId is required." }, { status: 400 });

    // Fetch all needed data
    const [protocolRes, qrRes, userRes] = await Promise.all([
      supabaseAdmin.from("protocols").select("metrics").eq("user_id", userId).maybeSingle(),
      supabaseAdmin.from("questionnaire_responses")
        .select("age, height_cm, weight_kg, training_experience, sessions_per_week, goal")
        .eq("user_id", userId).maybeSingle(),
      supabaseAdmin.from("users").select("first_name").eq("id", userId).maybeSingle(),
    ]);

    const metrics    = (protocolRes.data?.metrics as CalibrationMetrics | null) ?? null;
    const age        = (qrRes.data?.age            as number | null) ?? 30;
    const heightCm   = (qrRes.data?.height_cm      as number | null) ?? null;
    const weightKg   = (qrRes.data?.weight_kg      as number | null) ?? null;
    const trainingExp = (qrRes.data?.training_experience as string | null) ?? null;
    const sessions   = (qrRes.data?.sessions_per_week as number | null) ?? null;
    const goal       = (qrRes.data?.goal           as string | null) ?? null;
    const firstName  = (userRes.data?.first_name   as string | null) ?? "Client";

    if (!metrics) return NextResponse.json({ error: "No calibration metrics found. Calibrate first." }, { status: 404 });

    const { score, label } = computeAttractivenessScore(metrics, age);
    const { max: potential } = computeRealisticPotential(metrics, age);

    const prompt = buildPrompt({ firstName, age, metrics, score, potential, scoreLabel: label, goal, heightCm, weightKg, trainingExperience: trainingExp, sessionsPerWeek: sessions });

    // Call Claude
    const message = await client.messages.create({
      model:      "claude-opus-4-6",
      max_tokens: 1024,
      messages:   [{ role: "user", content: prompt }],
    });

    const summary = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("\n");

    // Save to protocols table
    await supabaseAdmin
      .from("protocols")
      .update({ summary })
      .eq("user_id", userId);

    return NextResponse.json({ summary });
  } catch (err) {
    console.error("[generate-summary]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error." },
      { status: 500 }
    );
  }
}
