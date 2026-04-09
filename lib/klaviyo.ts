const KLAVIYO_API_BASE = "https://a.klaviyo.com/api";
const KLAVIYO_LIST_ID = "UYABKB";

type KlaviyoItem = {
  ProductID: string;
  ProductName: string;
  Quantity: number;
  ItemPrice: number;
  RowTotal: number;
  ProductURL: string;
};

type StartedCheckoutProps = {
  email: string;
  firstName?: string;
  value: number;
  checkoutUrl: string;
  items: KlaviyoItem[];
  utm?: Record<string, string | undefined>;
};

function getApiKey(): string | null {
  const key = process.env.KLAVIYO_PRIVATE_KEY;
  if (!key) {
    console.warn("[klaviyo] KLAVIYO_PRIVATE_KEY not set — skipping");
    return null;
  }
  return key;
}

/**
 * Create or update a Klaviyo profile and subscribe them to the main list.
 * Returns the Klaviyo profile ID on success, null on failure.
 */
export async function upsertProfileAndSubscribe(
  apiKey: string,
  email: string,
  firstName?: string,
): Promise<string | null> {
  // Step 1: create/update profile
  const profileBody = {
    data: {
      type: "profile",
      attributes: {
        email,
        ...(firstName && { first_name: firstName }),
      },
    },
  };

  let profileId: string | null = null;
  try {
    const res = await fetch(`${KLAVIYO_API_BASE}/profiles/`, {
      method: "POST",
      headers: {
        Authorization: `Klaviyo-API-Key ${apiKey}`,
        "Content-Type": "application/json",
        revision: "2024-02-15",
      },
      body: JSON.stringify(profileBody),
    });

    if (res.status === 201 || res.status === 200) {
      const json = (await res.json()) as { data?: { id?: string } };
      profileId = json.data?.id ?? null;
    } else if (res.status === 409) {
      // Profile already exists — extract ID from the conflict response
      const json = (await res.json()) as { errors?: Array<{ meta?: { duplicate_profile_id?: string } }> };
      profileId = json.errors?.[0]?.meta?.duplicate_profile_id ?? null;
    } else {
      const text = await res.text().catch(() => "");
      console.error("[klaviyo] profile upsert failed", { status: res.status, body: text, email });
      return null;
    }
  } catch (err) {
    console.error("[klaviyo] profile upsert error", { error: String(err), email });
    return null;
  }

  if (!profileId) {
    console.error("[klaviyo] no profile ID returned", { email });
    return null;
  }

  // Step 2: add profile to list
  try {
    const res = await fetch(`${KLAVIYO_API_BASE}/lists/${KLAVIYO_LIST_ID}/relationships/profiles/`, {
      method: "POST",
      headers: {
        Authorization: `Klaviyo-API-Key ${apiKey}`,
        "Content-Type": "application/json",
        revision: "2024-02-15",
      },
      body: JSON.stringify({
        data: [{ type: "profile", id: profileId }],
      }),
    });

    if (res.ok || res.status === 204) {
      console.log("[klaviyo] profile added to list", { email, profileId, listId: KLAVIYO_LIST_ID });
    } else {
      const text = await res.text().catch(() => "");
      console.error("[klaviyo] list subscribe failed", { status: res.status, body: text, email });
    }
  } catch (err) {
    console.error("[klaviyo] list subscribe error", { error: String(err), email });
  }

  return profileId;
}

/**
 * Sync all questionnaire answers to the Klaviyo profile as custom properties,
 * and fire a "Questionnaire Submitted" event.
 * Called from both /api/questionnaire/submit and /api/questionnaire/finalize.
 */
export async function syncKlaviyoQuestionnaire(props: {
  email: string;
  answers: Record<string, unknown>;
}): Promise<void> {
  const apiKey = getApiKey();
  if (!apiKey) return;

  const a = props.answers;

  // Map answers to Klaviyo profile custom properties (PascalCase for readability in Klaviyo)
  const arr = (v: unknown) => (Array.isArray(v) ? (v as string[]).join(", ") : undefined);
  const num = (v: unknown) => (typeof v === "number" ? v : undefined);
  const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);

  const customProperties: Record<string, unknown> = {
    // Identity
    Protocol_Goal: str(a.goal),
    Protocol_Motivation: str(a.motivation),
    Protocol_Age: num(a.age),
    Protocol_City: str(a.city),
    Protocol_Phone: str(a.phone),
    Protocol_ProfessionalEnvironment: str(a.professional_environment),
    Protocol_FacialStructureSelf: str(a.facial_structure_self),
    Protocol_SocialPerception: arr(a.social_perception),
    Protocol_TypicalClothing: str(a.typical_clothing),
    // Biometrics
    Protocol_HeightCm: num(a.height_cm),
    Protocol_WeightKg: num(a.weight_kg),
    Protocol_WeightTrend: str(a.weight_trend_6mo),
    Protocol_WaistCm: num(a.waist_circumference_cm),
    // Training
    Protocol_TrainingExperience: str(a.training_experience),
    Protocol_SessionsPerWeek: num(a.sessions_per_week),
    Protocol_SessionDurationMin: num(a.session_duration_minutes),
    Protocol_TrainingLocation: str(a.training_location),
    Protocol_PreferredActivities: arr(a.preferred_activities),
    Protocol_DailyActivityLevel: str(a.daily_activity_level),
    Protocol_TrainingConsistency: str(a.training_consistency),
    // Nutrition
    Protocol_DietaryProfile: str(a.dietary_profile),
    Protocol_FoodAllergies: arr(a.food_allergies),
    Protocol_EatingHabits: arr(a.eating_habits),
    Protocol_MealsPerDay: num(a.meals_per_day),
    Protocol_MealPrepAvailability: str(a.meal_prep_availability),
    Protocol_SupplementUse: arr(a.supplement_use),
    // Health
    Protocol_Injuries: arr(a.injuries),
    Protocol_MedicalConditions: arr(a.medical_conditions),
    Protocol_Medications: arr(a.medications),
    Protocol_SleepHours: str(a.sleep_hours),
    Protocol_StressLevel: num(a.stress_level),
    Protocol_ConcernAreas: arr(a.concern_areas),
    // Status
    Protocol_Status: "submitted",
    Protocol_SubmittedAt: new Date().toISOString(),
  };

  // Remove undefined values
  const props_ = Object.fromEntries(
    Object.entries(customProperties).filter(([, v]) => v !== undefined && v !== "")
  );

  await Promise.allSettled([
    // Update profile properties
    (async () => {
      const res = await fetch(`${KLAVIYO_API_BASE}/profiles/`, {
        method: "POST",
        headers: {
          Authorization: `Klaviyo-API-Key ${apiKey}`,
          "Content-Type": "application/json",
          revision: "2024-02-15",
        },
        body: JSON.stringify({
          data: {
            type: "profile",
            attributes: {
              email: props.email,
              properties: props_,
            },
          },
        }),
      });
      if (!res.ok && res.status !== 409) {
        const text = await res.text().catch(() => "");
        console.error("[klaviyo] questionnaire profile update failed", { status: res.status, body: text });
      } else {
        // If 409 (profile exists), patch properties via the duplicate profile ID
        if (res.status === 409) {
          const json = (await res.json()) as { errors?: Array<{ meta?: { duplicate_profile_id?: string } }> };
          const profileId = json.errors?.[0]?.meta?.duplicate_profile_id;
          if (profileId) {
            await fetch(`${KLAVIYO_API_BASE}/profiles/${profileId}/`, {
              method: "PATCH",
              headers: {
                Authorization: `Klaviyo-API-Key ${apiKey}`,
                "Content-Type": "application/json",
                revision: "2024-02-15",
              },
              body: JSON.stringify({
                data: {
                  type: "profile",
                  id: profileId,
                  attributes: { properties: props_ },
                },
              }),
            });
          }
        }
        console.log("[klaviyo] questionnaire profile synced", { email: props.email });
      }
    })(),
    // Fire "Questionnaire Submitted" event
    (async () => {
      const res = await fetch(`${KLAVIYO_API_BASE}/events/`, {
        method: "POST",
        headers: {
          Authorization: `Klaviyo-API-Key ${apiKey}`,
          "Content-Type": "application/json",
          revision: "2024-02-15",
        },
        body: JSON.stringify({
          data: {
            type: "event",
            attributes: {
              metric: { data: { type: "metric", attributes: { name: "Questionnaire Submitted" } } },
              profile: { data: { type: "profile", attributes: { email: props.email } } },
              properties: props_,
            },
          },
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("[klaviyo] Questionnaire Submitted event failed", { status: res.status, body: text });
      } else {
        console.log("[klaviyo] Questionnaire Submitted event sent", { email: props.email });
      }
    })(),
  ]);
}

/**
 * Send a "Protocol Welcome" event to Klaviyo after a successful Stripe purchase.
 * Attach the registration URL so Klaviyo flows can send the welcome email.
 *
 * Required Klaviyo setup:
 * 1. Create a flow triggered by metric "Protocol Purchase"
 * 2. Add an email step using the "registration_url" property in the body
 *    e.g. "Click here to create your account: {{ event.registration_url }}"
 */
export async function sendKlaviyoWelcomeEmail(props: {
  email: string;
  firstName?: string;
  registrationUrl: string;
}): Promise<void> {
  const apiKey = getApiKey();
  if (!apiKey) return;

  await Promise.allSettled([
    upsertProfileAndSubscribe(apiKey, props.email, props.firstName),
    (async () => {
      const body = {
        data: {
          type: "event",
          attributes: {
            properties: {
              registration_url: props.registrationUrl,
              ...(props.firstName && { first_name: props.firstName }),
            },
            metric: {
              data: {
                type: "metric",
                attributes: { name: "Protocol Purchase" },
              },
            },
            profile: {
              data: {
                type: "profile",
                attributes: {
                  email: props.email,
                  ...(props.firstName && { first_name: props.firstName }),
                },
              },
            },
          },
        },
      };

      const res = await fetch(`${KLAVIYO_API_BASE}/events/`, {
        method: "POST",
        headers: {
          Authorization: `Klaviyo-API-Key ${apiKey}`,
          "Content-Type": "application/json",
          revision: "2024-02-15",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("[klaviyo] Protocol Purchase event failed", {
          status: res.status,
          body: text,
          email: props.email,
        });
      } else {
        console.log("[klaviyo] Protocol Purchase event sent", { email: props.email });
      }
    })(),
  ]);
}

/**
 * Send a "Started Checkout" event to Klaviyo and add the profile to the list.
 * Fires server-side only. Errors are non-fatal — logged but never thrown.
 */
export async function trackKlaviyoStartedCheckout(props: StartedCheckoutProps): Promise<void> {
  const apiKey = getApiKey();
  if (!apiKey) return;

  // Run profile upsert + list subscribe in parallel with the event
  const [, ] = await Promise.allSettled([
    upsertProfileAndSubscribe(apiKey, props.email, props.firstName),
    (async () => {
      const body = {
        data: {
          type: "event",
          attributes: {
            properties: {
              $value: props.value,
              CheckoutURL: props.checkoutUrl,
              ItemNames: props.items.map((i) => i.ProductName),
              Items: props.items,
              ...(props.utm?.utm_source && { utm_source: props.utm.utm_source }),
              ...(props.utm?.utm_campaign && { utm_campaign: props.utm.utm_campaign }),
              ...(props.utm?.utm_content && { utm_content: props.utm.utm_content }),
              ...(props.utm?.utm_medium && { utm_medium: props.utm.utm_medium }),
              ...(props.utm?.fbclid && { fbclid: props.utm.fbclid }),
            },
            metric: {
              data: {
                type: "metric",
                attributes: { name: "Started Checkout" },
              },
            },
            profile: {
              data: {
                type: "profile",
                attributes: {
                  email: props.email,
                  ...(props.firstName && { first_name: props.firstName }),
                },
              },
            },
          },
        },
      };

      const res = await fetch(`${KLAVIYO_API_BASE}/events/`, {
        method: "POST",
        headers: {
          Authorization: `Klaviyo-API-Key ${apiKey}`,
          "Content-Type": "application/json",
          revision: "2024-02-15",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("[klaviyo] Started Checkout failed", { status: res.status, body: text, email: props.email });
      } else {
        console.log("[klaviyo] Started Checkout sent", { email: props.email });
      }
    })(),
  ]);
}
