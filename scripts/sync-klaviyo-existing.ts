/**
 * One-time script: sync all existing Protocol Club customers to Klaviyo.
 *
 * Reads every user from Supabase, fetches their questionnaire answers,
 * upserts the Klaviyo profile, adds them to list UYABKB, and fires
 * a "Questionnaire Submitted" event if they've completed the questionnaire.
 *
 * Usage:
 *   bun run scripts/sync-klaviyo-existing.ts
 *   # or: npx ts-node --esm scripts/sync-klaviyo-existing.ts
 *
 * Requires .env.local (loaded automatically by bun, or set env vars manually).
 */

import { createClient } from "@supabase/supabase-js";

// ── Config ────────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const KLAVIYO_PRIVATE_KEY = process.env.KLAVIYO_PRIVATE_KEY!;
const KLAVIYO_API_BASE = "https://a.klaviyo.com/api";
const KLAVIYO_LIST_ID = "UYABKB";
const KLAVIYO_REVISION = "2024-02-15";

// ── Supabase client ───────────────────────────────────────────────────────────

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ── Helpers ───────────────────────────────────────────────────────────────────

function headers() {
  return {
    Authorization: `Klaviyo-API-Key ${KLAVIYO_PRIVATE_KEY}`,
    "Content-Type": "application/json",
    revision: KLAVIYO_REVISION,
  };
}

function arr(v: unknown) {
  return Array.isArray(v) ? (v as string[]).join(", ") : undefined;
}
function num(v: unknown) {
  return typeof v === "number" ? v : undefined;
}
function str(v: unknown) {
  return typeof v === "string" && v ? v : undefined;
}

function buildProfileProperties(user: Record<string, unknown>, qr: Record<string, unknown> | null) {
  const base: Record<string, unknown> = {
    Protocol_Status: str(user.protocol_status) ?? "unknown",
    Protocol_HasPaid: user.has_paid === true,
  };

  if (!qr) return base;

  return {
    ...base,
    Protocol_Goal: str(qr.goal),
    Protocol_Motivation: str(qr.motivation),
    Protocol_Age: num(qr.age),
    Protocol_City: str(qr.city),
    Protocol_Phone: str(qr.phone),
    Protocol_ProfessionalEnvironment: str(qr.professional_environment),
    Protocol_FacialStructureSelf: str(qr.facial_structure_self),
    Protocol_SocialPerception: arr(qr.social_perception),
    Protocol_TypicalClothing: str(qr.typical_clothing),
    Protocol_HeightCm: num(qr.height_cm),
    Protocol_WeightKg: num(qr.weight_kg),
    Protocol_WeightTrend: str(qr.weight_trend_6mo),
    Protocol_WaistCm: num(qr.waist_circumference_cm),
    Protocol_TrainingExperience: str(qr.training_experience),
    Protocol_SessionsPerWeek: num(qr.sessions_per_week),
    Protocol_SessionDurationMin: num(qr.session_duration_minutes),
    Protocol_TrainingLocation: str(qr.training_location),
    Protocol_PreferredActivities: arr(qr.preferred_activities),
    Protocol_DailyActivityLevel: str(qr.daily_activity_level),
    Protocol_TrainingConsistency: str(qr.training_consistency),
    Protocol_DietaryProfile: str(qr.dietary_profile),
    Protocol_FoodAllergies: arr(qr.food_allergies),
    Protocol_EatingHabits: arr(qr.eating_habits),
    Protocol_MealsPerDay: num(qr.meals_per_day),
    Protocol_MealPrepAvailability: str(qr.meal_prep_availability),
    Protocol_SupplementUse: arr(qr.supplement_use),
    Protocol_Injuries: arr(qr.injuries),
    Protocol_MedicalConditions: arr(qr.medical_conditions),
    Protocol_Medications: arr(qr.medications),
    Protocol_SleepHours: str(qr.sleep_hours),
    Protocol_StressLevel: num(qr.stress_level),
    Protocol_ConcernAreas: arr(qr.concern_areas),
    Protocol_SubmittedAt: str(qr.submitted_at),
  };
}

/** Upsert a Klaviyo profile, returns the profile ID */
async function upsertProfile(
  email: string,
  firstName: string | null,
  properties: Record<string, unknown>
): Promise<string | null> {
  const clean = Object.fromEntries(
    Object.entries(properties).filter(([, v]) => v !== undefined && v !== "")
  );

  const body = {
    data: {
      type: "profile",
      attributes: {
        email,
        ...(firstName ? { first_name: firstName } : {}),
        properties: clean,
      },
    },
  };

  const res = await fetch(`${KLAVIYO_API_BASE}/profiles/`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });

  if (res.status === 201 || res.status === 200) {
    const json = (await res.json()) as { data?: { id?: string } };
    return json.data?.id ?? null;
  }

  if (res.status === 409) {
    const json = (await res.json()) as { errors?: Array<{ meta?: { duplicate_profile_id?: string } }> };
    const profileId = json.errors?.[0]?.meta?.duplicate_profile_id ?? null;

    // PATCH properties onto existing profile
    if (profileId) {
      await fetch(`${KLAVIYO_API_BASE}/profiles/${profileId}/`, {
        method: "PATCH",
        headers: headers(),
        body: JSON.stringify({
          data: {
            type: "profile",
            id: profileId,
            attributes: {
              ...(firstName ? { first_name: firstName } : {}),
              properties: clean,
            },
          },
        }),
      });
    }
    return profileId;
  }

  const text = await res.text().catch(() => "");
  console.error(`  ✗ Profile upsert failed (${res.status}): ${text.slice(0, 120)}`);
  return null;
}

/** Add profile to the list */
async function addToList(profileId: string): Promise<void> {
  const res = await fetch(`${KLAVIYO_API_BASE}/lists/${KLAVIYO_LIST_ID}/relationships/profiles/`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ data: [{ type: "profile", id: profileId }] }),
  });
  if (!res.ok && res.status !== 204) {
    const text = await res.text().catch(() => "");
    console.error(`  ✗ List subscribe failed (${res.status}): ${text.slice(0, 120)}`);
  }
}

/** Fire "Questionnaire Submitted" event */
async function fireEvent(email: string, properties: Record<string, unknown>): Promise<void> {
  const clean = Object.fromEntries(
    Object.entries(properties).filter(([, v]) => v !== undefined && v !== "")
  );
  const res = await fetch(`${KLAVIYO_API_BASE}/events/`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      data: {
        type: "event",
        attributes: {
          metric: { data: { type: "metric", attributes: { name: "Questionnaire Submitted" } } },
          profile: { data: { type: "profile", attributes: { email } } },
          properties: clean,
        },
      },
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`  ✗ Event failed (${res.status}): ${text.slice(0, 120)}`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !KLAVIYO_PRIVATE_KEY) {
    console.error("Missing env vars. Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, KLAVIYO_PRIVATE_KEY.");
    process.exit(1);
  }

  console.log("Fetching users from Supabase…");
  const { data: users, error } = await supabase
    .from("users")
    .select("id, email, first_name, has_paid, protocol_status")
    .eq("has_paid", true)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch users:", error.message);
    process.exit(1);
  }

  console.log(`Found ${users.length} paid users.\n`);

  let synced = 0;
  let failed = 0;

  for (const user of users) {
    process.stdout.write(`[${synced + failed + 1}/${users.length}] ${user.email} … `);

    // Fetch questionnaire answers
    const { data: qr } = await supabase
      .from("questionnaire_responses")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    const props = buildProfileProperties(
      user as Record<string, unknown>,
      qr as Record<string, unknown> | null
    );

    const profileId = await upsertProfile(user.email, user.first_name ?? null, props);

    if (!profileId) {
      console.log("FAILED (profile upsert)");
      failed++;
      continue;
    }

    await addToList(profileId);

    // Fire event only if questionnaire was submitted
    const hasQuestionnaire = qr && (qr.status === "submitted" || qr.submitted_at);
    if (hasQuestionnaire) {
      await fireEvent(user.email, props);
      console.log(`OK (+ questionnaire event)`);
    } else {
      console.log("OK");
    }

    synced++;

    // Small delay to avoid rate limiting (Klaviyo: 75 req/s)
    await new Promise((r) => setTimeout(r, 60));
  }

  console.log(`\nDone. ${synced} synced, ${failed} failed.`);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
