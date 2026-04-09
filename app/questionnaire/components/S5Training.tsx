"use client";

import { useState } from "react";
import type { SectionProps } from "../QuestionnaireFlow";
import { SectionHeader, Field, SectionFooter, CardSelect, TagSelect, Stepper } from "./shared";

const EXPERIENCE_OPTIONS = [
  { value: "beginner", label: "Beginner", sublabel: "Less than 6 months of consistent training" },
  { value: "novice", label: "Novice", sublabel: "6 months to 1.5 years" },
  { value: "intermediate", label: "Intermediate", sublabel: "1.5 to 4 years" },
  { value: "experienced", label: "Experienced", sublabel: "4 to 8 years" },
  { value: "advanced", label: "Advanced", sublabel: "8+ years, trained seriously" },
];

const DURATION_OPTIONS = [
  { value: "30", label: "Under 30 minutes" },
  { value: "45", label: "30–45 minutes" },
  { value: "60", label: "45–60 minutes" },
  { value: "75", label: "60–75 minutes" },
  { value: "90", label: "75–90 minutes" },
  { value: "120", label: "90 minutes or more" },
];

const LOCATION_OPTIONS = [
  { value: "commercial_gym", label: "Commercial gym — full equipment" },
  { value: "home_gym", label: "Home gym — some equipment" },
  { value: "bodyweight", label: "Bodyweight only — no equipment" },
  { value: "outdoor", label: "Outdoor — parks, tracks" },
  { value: "mixed", label: "Mixed — varies by week" },
];

const ACTIVITY_OPTIONS = [
  { value: "strength_training", label: "Strength training (barbell, dumbbell)" },
  { value: "calisthenics", label: "Calisthenics / Bodyweight" },
  { value: "hiit", label: "HIIT / Circuit training" },
  { value: "running", label: "Running / Jogging" },
  { value: "cycling", label: "Cycling" },
  { value: "swimming", label: "Swimming" },
  { value: "martial_arts", label: "Martial arts / Combat sports" },
  { value: "team_sports", label: "Team sports" },
  { value: "yoga_pilates", label: "Yoga / Pilates" },
  { value: "none", label: "None — I'm starting from scratch" },
];

const DAILY_ACTIVITY_OPTIONS = [
  { value: "sedentary", label: "Sedentary", sublabel: "Desk job, mostly sitting, minimal walking" },
  { value: "lightly_active", label: "Lightly active", sublabel: "Some walking, mostly seated work" },
  { value: "moderately_active", label: "Moderately active", sublabel: "On my feet regularly, some manual activity" },
  { value: "very_active", label: "Very active", sublabel: "Physical job, lots of movement" },
  { value: "extremely_active", label: "Extremely active", sublabel: "Manual labor or very high daily movement" },
];

export default function S5Training({ answers, setAnswer, onNext, onBack, saving, serverError }: SectionProps) {
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => {
    if (!answers.training_experience) return setError("Please select your training experience level.");
    if (answers.sessions_per_week === undefined) return setError("Please set sessions per week.");
    if (!answers.session_duration_minutes) return setError("Please select your typical session duration.");
    if (!answers.training_location) return setError("Please select where you train.");
    if (!answers.preferred_activities?.length) return setError("Please select at least one training activity.");
    if (!answers.daily_activity_level) return setError("Please select your daily activity level.");
    setError(null);
    onNext();
  };

  return (
    <div>
      <SectionHeader
        eyebrow="Section 5 — Training"
        title="Your training."
        subtitle="Your current reality, not your ideal. Be honest."
      />

      <div className="flex flex-col gap-8">
        <Field label="What's your current training experience level?" required>
          <CardSelect
            value={answers.training_experience}
            onChange={(v) => setAnswer("training_experience", v)}
            options={EXPERIENCE_OPTIONS}
          />
        </Field>

        <Field label="How many training sessions do you do per week?" sublabel="Your current average, not your goal." required>
          <Stepper
            value={answers.sessions_per_week ?? 0}
            onChange={(v) => setAnswer("sessions_per_week", v)}
            min={0}
            max={14}
            suffix={answers.sessions_per_week === 1 ? "session / week" : "sessions / week"}
          />
        </Field>

        <Field label="How long is a typical training session?" required>
          <CardSelect
            value={answers.session_duration_minutes?.toString()}
            onChange={(v) => setAnswer("session_duration_minutes", Number(v))}
            options={DURATION_OPTIONS}
          />
        </Field>

        <Field label="Where do you train?" required>
          <CardSelect
            value={answers.training_location}
            onChange={(v) => setAnswer("training_location", v)}
            options={LOCATION_OPTIONS}
          />
        </Field>

        <Field label="What training activities do you currently do or prefer?" sublabel="Select all that apply." required>
          <TagSelect
            value={answers.preferred_activities ?? []}
            onChange={(v) => setAnswer("preferred_activities", v)}
            options={ACTIVITY_OPTIONS}
          />
        </Field>

        <Field label="How active are you on a typical non-training day?" required>
          <CardSelect
            value={answers.daily_activity_level}
            onChange={(v) => setAnswer("daily_activity_level", v)}
            options={DAILY_ACTIVITY_OPTIONS}
          />
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
