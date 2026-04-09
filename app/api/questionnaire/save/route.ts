import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateSession, SESSION_COOKIE_NAME } from "../../../../lib/auth";
import { supabaseAdmin } from "../../../../lib/supabase";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await validateSession(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as Record<string, unknown>;
  const currentSection = typeof body.current_section === "number" ? body.current_section : 1;

  // Pick only known fields to prevent mass assignment
  const allowed = [
    "first_name", "phone", "city", "goal", "motivation",
    "age", "professional_environment", "professional_environment_other", "facial_structure_self", "social_perception", "typical_clothing",
    "height_cm", "weight_kg", "weight_trend_6mo", "waist_circumference_cm",
    "photo_front_path", "photo_side_path", "photo_back_path", "photo_face_path", "photos_taken_correctly",
    "training_experience", "sessions_per_week", "session_duration_minutes", "training_location",
    "preferred_activities", "daily_activity_level",
    "dietary_profile", "other_diet_specified", "food_allergies", "eating_habits",
    "meals_per_day", "meal_prep_availability", "supplement_use", "supplement_use_other", "food_allergies_other",
    "injuries", "injuries_other", "medical_conditions", "medical_conditions_other",
    "medications", "medications_other", "sleep_hours", "stress_level",
    "training_consistency", "concern_areas", "coach_notes",
  ] as const;

  const payload: Record<string, unknown> = { current_section: currentSection };
  for (const key of allowed) {
    if (body[key] !== undefined) payload[key] = body[key];
  }

  const { error } = await supabaseAdmin
    .from("questionnaire_responses")
    .upsert({ user_id: user.id, ...payload }, { onConflict: "user_id" });

  if (error) {
    console.error("Questionnaire save error:", error);
    return NextResponse.json({ error: "Failed to save. Please try again." }, { status: 500 });
  }

  // Update protocol_status to in_progress if not already further along
  await supabaseAdmin
    .from("users")
    .update({ protocol_status: "questionnaire_in_progress" })
    .eq("id", user.id)
    .eq("protocol_status", "not_started");

  return NextResponse.json({ ok: true });
}
