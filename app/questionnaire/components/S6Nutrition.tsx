"use client";

import { useState } from "react";
import type { SectionProps } from "../QuestionnaireFlow";
import { SectionHeader, Field, SectionFooter, CardSelect, TagSelect, Stepper } from "./shared";

const DIET_OPTIONS = [
  { value: "omnivore", label: "Omnivore — I eat everything" },
  { value: "flexitarian", label: "Flexitarian — mostly plants, occasional meat" },
  { value: "vegetarian", label: "Vegetarian — no meat, fish ok" },
  { value: "vegan", label: "Vegan — no animal products" },
  { value: "keto", label: "Ketogenic / Low-carb" },
  { value: "paleo", label: "Paleo" },
  { value: "intermittent_fasting", label: "Intermittent fasting" },
  { value: "other", label: "Other" },
];

const ALLERGY_OPTIONS = [
  { value: "none", label: "None" },
  { value: "gluten", label: "Gluten / Wheat" },
  { value: "dairy", label: "Dairy / Lactose" },
  { value: "nuts", label: "Tree nuts" },
  { value: "peanuts", label: "Peanuts" },
  { value: "eggs", label: "Eggs" },
  { value: "soy", label: "Soy" },
  { value: "shellfish", label: "Shellfish" },
  { value: "fish", label: "Fish" },
  { value: "other", label: "Other" },
];

const HABITS_OPTIONS = [
  { value: "consistent", label: "Consistent — same times every day" },
  { value: "irregular", label: "Irregular — skip meals or eat at random times" },
  { value: "social_eating", label: "Social eating — most meals are social" },
  { value: "meal_prep", label: "I meal prep in advance" },
  { value: "fast_food", label: "Fast food / takeout regularly" },
  { value: "emotional_eating", label: "I eat when stressed or emotional" },
  { value: "low_appetite", label: "Low appetite — struggle to eat enough" },
  { value: "high_appetite", label: "High appetite — struggle not to overeat" },
  { value: "calorie_tracking", label: "I track calories or macros" },
];

const MEAL_PREP_OPTIONS = [
  { value: "none", label: "None — I need quick, grab-and-go options" },
  { value: "minimal", label: "Minimal — 30 minutes or less" },
  { value: "moderate", label: "Moderate — 1 to 2 hours on weekends" },
  { value: "high", label: "High — I enjoy cooking, 3+ hours available" },
];

const SUPPLEMENT_OPTIONS = [
  { value: "none", label: "None" },
  { value: "protein_powder", label: "Protein powder" },
  { value: "creatine", label: "Creatine" },
  { value: "pre_workout", label: "Pre-workout" },
  { value: "multivitamin", label: "Multivitamin" },
  { value: "omega3", label: "Omega-3 / Fish oil" },
  { value: "vitamin_d", label: "Vitamin D" },
  { value: "bcaa", label: "BCAAs / EAAs" },
  { value: "fat_burner", label: "Fat burner / Thermogenic" },
  { value: "other", label: "Other" },
];

export default function S6Nutrition({ answers, setAnswer, onNext, onBack, saving, serverError }: SectionProps) {
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => {
    if (!answers.dietary_profile) return setError("Please select your dietary profile.");
    if (answers.dietary_profile === "other" && !answers.other_diet_specified?.trim()) return setError("Please describe your diet.");
    if (!answers.food_allergies?.length) return setError("Please select your food allergies (or 'None').");
    if (!answers.eating_habits?.length) return setError("Please select at least one eating habit.");
    if (!answers.meals_per_day) return setError("Please set meals per day.");
    if (!answers.meal_prep_availability) return setError("Please select your meal prep availability.");
    if (!answers.supplement_use?.length) return setError("Please select your supplements (or 'None').");
    setError(null);
    onNext();
  };

  return (
    <div>
      <SectionHeader
        eyebrow="Section 6 — Nutrition"
        title="Your nutrition."
        subtitle="No judgment. What you actually eat, not what you think you should eat."
      />

      <div className="flex flex-col gap-8">
        <Field label="How would you describe your current diet?" required>
          <CardSelect
            value={answers.dietary_profile}
            onChange={(v) => setAnswer("dietary_profile", v)}
            options={DIET_OPTIONS}
          />
          {answers.dietary_profile === "other" && (
            <input
              type="text"
              placeholder="Describe your diet briefly…"
              value={answers.other_diet_specified ?? ""}
              onChange={(e) => setAnswer("other_diet_specified", e.target.value)}
              className="mt-2 w-full rounded-xl border border-black/12 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink/30 focus:border-black focus:outline-none"
            />
          )}
        </Field>

        <Field label="Do you have any food allergies or intolerances?" sublabel="Select all that apply, or 'None'." required>
          <TagSelect
            value={answers.food_allergies ?? []}
            onChange={(v) => setAnswer("food_allergies", v)}
            options={ALLERGY_OPTIONS}
          />
          {(answers.food_allergies ?? []).includes("other") && (
            <input
              type="text"
              placeholder="Specify other allergy or intolerance…"
              value={answers.food_allergies_other ?? ""}
              onChange={(e) => setAnswer("food_allergies_other", e.target.value)}
              className="mt-2 w-full rounded-xl border border-black/12 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink/30 focus:border-black focus:outline-none"
            />
          )}
        </Field>

        <Field label="Which of these describe your current eating habits?" sublabel="Select up to 3." required>
          <TagSelect
            value={answers.eating_habits ?? []}
            onChange={(v) => setAnswer("eating_habits", v)}
            options={HABITS_OPTIONS}
            max={3}
          />
        </Field>

        <Field label="How many meals or eating sessions do you have per day on average?" sublabel="Include snacks as separate eating sessions if they're significant." required>
          <Stepper
            value={answers.meals_per_day ?? 3}
            onChange={(v) => setAnswer("meals_per_day", v)}
            min={1}
            max={8}
            suffix={answers.meals_per_day === 1 ? "meal / day" : "meals / day"}
          />
        </Field>

        <Field label="How much time can you realistically spend on food prep per week?" required>
          <CardSelect
            value={answers.meal_prep_availability}
            onChange={(v) => setAnswer("meal_prep_availability", v)}
            options={MEAL_PREP_OPTIONS}
          />
        </Field>

        <Field label="Which supplements do you currently take?" sublabel="Select all that apply, or 'None'." required>
          <TagSelect
            value={answers.supplement_use ?? []}
            onChange={(v) => setAnswer("supplement_use", v)}
            options={SUPPLEMENT_OPTIONS}
          />
          {(answers.supplement_use ?? []).includes("other") && (
            <input
              type="text"
              placeholder="Specify other supplements…"
              value={answers.supplement_use_other ?? ""}
              onChange={(e) => setAnswer("supplement_use_other", e.target.value)}
              className="mt-2 w-full rounded-xl border border-black/12 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink/30 focus:border-black focus:outline-none"
            />
          )}
        </Field>
      </div>

      <SectionFooter
        onNext={handleNext}
        onBack={onBack}
        saving={saving}
        error={error ?? serverError}
      />
    </div>
  );
}
