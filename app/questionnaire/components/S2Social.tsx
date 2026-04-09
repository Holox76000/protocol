"use client";

import { useState } from "react";
import type { SectionProps } from "../QuestionnaireFlow";
import { SectionHeader, Field, SectionFooter, CardSelect, TagSelect } from "./shared";

const PROFESSIONAL_OPTIONS = [
  { value: "corporate", label: "Corporate / Finance / Law", sublabel: "Appearance signals authority" },
  { value: "creative", label: "Creative / Media / Design", sublabel: "Style and aesthetics matter" },
  { value: "public_facing", label: "Public-facing / Sales / Service", sublabel: "First impressions are everything" },
  { value: "physical_trades", label: "Physical trades / Construction", sublabel: "Physique is the baseline" },
  { value: "entrepreneur", label: "Entrepreneur / Startup", sublabel: "Adaptable, presence varies by context" },
  { value: "student", label: "Student / Early career" },
  { value: "other", label: "Other" },
];

const FACIAL_OPTIONS = [
  { value: "soft", label: "Soft / Round", sublabel: "Fuller face, less visible bone structure" },
  { value: "average", label: "Average / Neutral", sublabel: "Balanced — nothing particularly stands out" },
  { value: "angular", label: "Angular / Defined", sublabel: "Visible jawline, cheekbones, sharp features" },
  { value: "mature", label: "Mature / Strong", sublabel: "Heavy bone structure, dominant features" },
  { value: "unsure", label: "I'm honestly not sure" },
];

const SOCIAL_OPTIONS = [
  { value: "approachable", label: "Approachable / Friendly" },
  { value: "intimidating", label: "Intimidating / Intense" },
  { value: "forgettable", label: "Forgettable / Invisible" },
  { value: "trustworthy", label: "Trustworthy / Reliable" },
  { value: "attractive", label: "Physically attractive" },
  { value: "average_looking", label: "Average-looking" },
  { value: "professional", label: "Professional / Put-together" },
  { value: "awkward", label: "Awkward / Unsure of himself" },
  { value: "young_for_age", label: "Young for my age" },
  { value: "unsure", label: "I genuinely don't know" },
];

const CLOTHING_OPTIONS = [
  { value: "formal", label: "Formal — suits, dress shirts, ties" },
  { value: "smart_casual", label: "Smart casual — chinos, button-downs, clean sneakers" },
  { value: "casual", label: "Casual — jeans, t-shirts, hoodies" },
  { value: "athletic", label: "Athletic — gym clothes, track pants, trainers" },
  { value: "workwear", label: "Workwear — boots, functional clothing" },
];

export default function S2Social({ answers, setAnswer, onNext, onBack, saving, serverError }: SectionProps) {
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => {
    if (!answers.age) return setError("Please enter your age.");
    const age = Number(answers.age);
    if (isNaN(age) || age < 16 || age > 80) return setError("Age must be between 16 and 80.");
    if (!answers.professional_environment) return setError("Please select your professional environment.");
    if (!answers.facial_structure_self) return setError("Please select your facial structure.");
    if (!answers.social_perception?.length) return setError("Please select at least one social perception.");
    if (!answers.typical_clothing) return setError("Please select your clothing style.");
    setError(null);
    onNext();
  };

  return (
    <div>
      <SectionHeader
        eyebrow="Section 2 — Social Context"
        title="Your social context."
        subtitle="Attractiveness is perceived differently depending on your world. These answers help us calibrate."
      />

      <div className="flex flex-col gap-8">
        <Field label="How old are you?" required>
          <input
            type="number"
            placeholder="28"
            min={16}
            max={80}
            value={answers.age ?? ""}
            onChange={(e) => setAnswer("age", e.target.value ? Number(e.target.value) : undefined)}
            className="w-full rounded-xl border border-black/12 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink/30 focus:border-black focus:outline-none"
          />
        </Field>

        <Field label="What's your professional environment?" sublabel="Your context affects which aspects of your appearance have the most leverage." required>
          <CardSelect
            value={answers.professional_environment}
            onChange={(v) => setAnswer("professional_environment", v)}
            options={PROFESSIONAL_OPTIONS}
          />
          {answers.professional_environment === "other" && (
            <input
              type="text"
              placeholder="Describe your professional environment…"
              value={answers.professional_environment_other ?? ""}
              onChange={(e) => setAnswer("professional_environment_other", e.target.value)}
              className="mt-2 w-full rounded-xl border border-black/12 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink/30 focus:border-black focus:outline-none"
            />
          )}
        </Field>

        <Field label="How would you describe your facial bone structure?" sublabel="Don't overthink it — your best honest read." required>
          <CardSelect
            value={answers.facial_structure_self}
            onChange={(v) => setAnswer("facial_structure_self", v)}
            options={FACIAL_OPTIONS}
          />
        </Field>

        <Field label="How do people typically perceive you?" sublabel="Think about first impressions — how strangers or new acquaintances see you. Select up to 3." required>
          <TagSelect
            value={answers.social_perception ?? []}
            onChange={(v) => setAnswer("social_perception", v)}
            options={SOCIAL_OPTIONS}
            max={3}
          />
        </Field>

        <Field label="What's your typical day-to-day clothing style?" sublabel="Not your aspirational style — what you actually wear most days." required>
          <CardSelect
            value={answers.typical_clothing}
            onChange={(v) => setAnswer("typical_clothing", v)}
            options={CLOTHING_OPTIONS}
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
