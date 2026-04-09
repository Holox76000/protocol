import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateSession, SESSION_COOKIE_NAME } from "../../../../lib/auth";
import { supabaseAdmin } from "../../../../lib/supabase";
import { syncKlaviyoQuestionnaire } from "../../../../lib/klaviyo";

type Answers = Record<string, unknown>;

function detectRedFlags(answers: Answers): string[] {
  const flags: string[] = [];

  const age = typeof answers.age === "number" ? answers.age : null;
  const heightCm = typeof answers.height_cm === "number" ? answers.height_cm : null;
  const weightKg = typeof answers.weight_kg === "number" ? answers.weight_kg : null;
  const medicalConditions = Array.isArray(answers.medical_conditions) ? answers.medical_conditions as string[] : [];
  const injuries = Array.isArray(answers.injuries) ? answers.injuries as string[] : [];

  if (age !== null && age < 18) flags.push(`Age below 18 (age: ${age})`);
  if (age !== null && age > 70) flags.push(`Age above 70 (age: ${age})`);

  if (heightCm && weightKg) {
    const bmi = weightKg / Math.pow(heightCm / 100, 2);
    if (bmi < 17) flags.push(`BMI critically low (${bmi.toFixed(1)})`);
    if (bmi > 35) flags.push(`BMI critically high (${bmi.toFixed(1)})`);
  }

  if (medicalConditions.includes("disordered_eating")) flags.push("History of disordered eating");
  if (medicalConditions.includes("mental_health_eating")) flags.push("Mental health condition affecting eating");

  const seriousInjuries = injuries.filter((i) => i !== "none");
  if (seriousInjuries.length >= 2 && age !== null && age > 55) {
    flags.push(`Multiple injuries (${seriousInjuries.join(", ")}) + age > 55`);
  }

  return flags;
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await validateSession(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const answers = await request.json() as Answers;

  // Block if age < 18
  const age = typeof answers.age === "number" ? answers.age : null;
  if (age !== null && age < 18) {
    return NextResponse.json(
      { error: "We are unable to create a Protocol for users under 18 years old." },
      { status: 400 }
    );
  }

  // Detect red flags
  const redFlags = detectRedFlags(answers);

  // Save final state + mark submitted
  const { error: saveError } = await supabaseAdmin
    .from("questionnaire_responses")
    .upsert(
      {
        user_id: user.id,
        ...answers,
        status: "submitted",
        submitted_at: new Date().toISOString(),
        current_section: 8,
      },
      { onConflict: "user_id" }
    );

  if (saveError) {
    console.error("Questionnaire submit error:", saveError);
    return NextResponse.json({ error: "Failed to submit. Please try again." }, { status: 500 });
  }

  // Update user protocol_status
  await supabaseAdmin
    .from("users")
    .update({ protocol_status: "questionnaire_submitted" })
    .eq("id", user.id);

  // Log red flags
  if (redFlags.length > 0) {
    console.warn(`[RED FLAGS] user=${user.id} email=${user.email}`, redFlags);
  }

  // Sync questionnaire data to Klaviyo (fire-and-forget)
  void syncKlaviyoQuestionnaire({ email: user.email, answers }).catch((err) =>
    console.error("[submit] Klaviyo sync failed", { error: String(err) })
  );

  return NextResponse.json({ ok: true });
}
