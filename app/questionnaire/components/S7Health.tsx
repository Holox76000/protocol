"use client";

import { useState } from "react";
import type { SectionProps } from "../QuestionnaireFlow";
import { SectionHeader, Field, SectionFooter, CardSelect, TagSelect } from "./shared";

const INJURY_OPTIONS = [
  { value: "none", label: "None" },
  { value: "shoulder", label: "Shoulder (rotator cuff, AC joint)" },
  { value: "lower_back", label: "Lower back" },
  { value: "knee", label: "Knee (ACL, meniscus, patellar)" },
  { value: "hip", label: "Hip" },
  { value: "elbow", label: "Elbow (tendonitis, tennis/golfer's)" },
  { value: "wrist", label: "Wrist or hand" },
  { value: "ankle", label: "Ankle or foot" },
  { value: "neck", label: "Neck or cervical spine" },
  { value: "other", label: "Other" },
];

const MEDICAL_OPTIONS = [
  { value: "none", label: "None" },
  { value: "cardiovascular", label: "Cardiovascular condition (heart disease, hypertension)" },
  { value: "diabetes", label: "Diabetes (Type 1 or 2)" },
  { value: "asthma", label: "Asthma or respiratory condition" },
  { value: "joint_disease", label: "Joint disease (arthritis, etc.)" },
  { value: "hormonal", label: "Hormonal condition (thyroid, etc.)" },
  { value: "neurological", label: "Neurological condition" },
  { value: "disordered_eating", label: "History of disordered eating" },
  { value: "mental_health_eating", label: "Mental health condition affecting relationship with food" },
  { value: "other", label: "Other" },
];

const MEDICATION_OPTIONS = [
  { value: "none", label: "None" },
  { value: "corticosteroids", label: "Corticosteroids" },
  { value: "beta_blockers", label: "Beta blockers" },
  { value: "ssri_snri", label: "Antidepressants (SSRI / SNRI)" },
  { value: "hormones", label: "Hormone therapy (TRT, HRT, etc.)" },
  { value: "blood_pressure", label: "Blood pressure medication" },
  { value: "blood_thinners", label: "Blood thinners" },
  { value: "other", label: "Other" },
];

const SLEEP_OPTIONS = [
  { value: "less_5", label: "Less than 5 hours" },
  { value: "5_6", label: "5–6 hours" },
  { value: "6_7", label: "6–7 hours" },
  { value: "7_8", label: "7–8 hours" },
  { value: "8_9", label: "8–9 hours" },
  { value: "more_9", label: "More than 9 hours" },
];

const CONSISTENCY_OPTIONS = [
  { value: "very_consistent", label: "Very consistent — trained regularly throughout" },
  { value: "mostly_consistent", label: "Mostly consistent — a few gaps but generally on track" },
  { value: "inconsistent", label: "Inconsistent — started and stopped multiple times" },
  { value: "barely_trained", label: "Barely trained — mostly inactive" },
  { value: "not_trained", label: "Haven't trained at all" },
];

const CONCERN_OPTIONS = [
  { value: "shoulders", label: "Shoulders — too narrow" },
  { value: "chest", label: "Chest — underdeveloped" },
  { value: "arms", label: "Arms — too thin or lacking definition" },
  { value: "waist", label: "Waist — too wide or lacking definition" },
  { value: "back", label: "Back — weak or lacks V-taper" },
  { value: "legs", label: "Legs — unbalanced or underdeveloped" },
  { value: "posture", label: "Posture — rounded or collapsed" },
  { value: "neck", label: "Neck — too thin relative to head" },
  { value: "overall_skinniness", label: "Overall skinniness — I look too thin" },
  { value: "overall_softness", label: "Overall softness — I look too soft" },
];

export default function S7Health({ answers, setAnswer, onNext, onBack, saving, serverError }: SectionProps) {
  const [error, setError] = useState<string | null>(null);

  const hasInjuries = (answers.injuries ?? []).some((v) => v !== "none");
  const hasMedical = (answers.medical_conditions ?? []).some((v) => v !== "none");
  const hasMeds = (answers.medications ?? []).some((v) => v !== "none");

  const handleNext = () => {
    if (!answers.injuries?.length) return setError("Please select your injuries (or 'None').");
    if (!answers.medical_conditions?.length) return setError("Please select your medical conditions (or 'None').");
    if (!answers.medications?.length) return setError("Please select your medications (or 'None').");
    if (!answers.sleep_hours) return setError("Please select your average sleep.");
    if (!answers.stress_level) return setError("Please select your stress level.");
    if (!answers.training_consistency) return setError("Please select your training consistency.");
    if (!answers.concern_areas?.length) return setError("Please select at least one area of concern.");
    setError(null);
    onNext();
  };

  return (
    <div>
      <SectionHeader
        eyebrow="Section 7 — Health"
        title="Your health."
        subtitle="This section helps us build a Protocol that's safe and realistic for your body."
      />

      <div className="flex flex-col gap-8">
        <Field label="Do you have any current or past injuries that affect your training?" sublabel="Select all that apply." required>
          <TagSelect
            value={answers.injuries ?? []}
            onChange={(v) => setAnswer("injuries", v)}
            options={INJURY_OPTIONS}
          />
          {hasInjuries && (
            <textarea
              placeholder="Describe briefly (optional)…"
              value={answers.injuries_other ?? ""}
              onChange={(e) => setAnswer("injuries_other", e.target.value)}
              rows={2}
              className="mt-2 w-full rounded-xl border border-black/12 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink/30 focus:border-black focus:outline-none resize-none"
            />
          )}
        </Field>

        <Field label="Do you have any medical conditions relevant to physical training?" sublabel="This is confidential. Only your Protocol coach sees this." required>
          <TagSelect
            value={answers.medical_conditions ?? []}
            onChange={(v) => setAnswer("medical_conditions", v)}
            options={MEDICAL_OPTIONS}
          />
          {hasMedical && (
            <textarea
              placeholder="Describe briefly (optional)…"
              value={answers.medical_conditions_other ?? ""}
              onChange={(e) => setAnswer("medical_conditions_other", e.target.value)}
              rows={2}
              className="mt-2 w-full rounded-xl border border-black/12 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink/30 focus:border-black focus:outline-none resize-none"
            />
          )}
        </Field>

        <Field label="Are you currently taking any medications that could affect your training or physique?" required>
          <TagSelect
            value={answers.medications ?? []}
            onChange={(v) => setAnswer("medications", v)}
            options={MEDICATION_OPTIONS}
          />
          {hasMeds && (
            <textarea
              placeholder="Describe briefly (optional)…"
              value={answers.medications_other ?? ""}
              onChange={(e) => setAnswer("medications_other", e.target.value)}
              rows={2}
              className="mt-2 w-full rounded-xl border border-black/12 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink/30 focus:border-black focus:outline-none resize-none"
            />
          )}
        </Field>

        <Field label="How many hours of sleep do you get on average per night?" required>
          <div className="flex flex-wrap gap-2">
            {SLEEP_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setAnswer("sleep_hours", opt.value)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  answers.sleep_hours === opt.value
                    ? "border-black bg-black text-white"
                    : "border-black/15 bg-white text-ink hover:border-black/40"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="How would you rate your current stress level?" required>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((level) => {
              const labels = ["Very low", "Low", "Moderate", "High", "Very high"];
              const selected = answers.stress_level === level;
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => setAnswer("stress_level", level)}
                  className={`flex-1 rounded-xl border py-3 text-center transition ${
                    selected ? "border-black bg-black text-white" : "border-black/12 bg-white text-ink hover:border-black/30"
                  }`}
                >
                  <span className="block text-base font-bold">{level}</span>
                  <span className={`block text-[10px] mt-0.5 ${selected ? "text-white/70" : "text-ink/40"}`}>
                    {labels[level - 1]}
                  </span>
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="How consistent have you been with training over the past 12 months?" required>
          <CardSelect
            value={answers.training_consistency}
            onChange={(v) => setAnswer("training_consistency", v)}
            options={CONSISTENCY_OPTIONS}
          />
        </Field>

        <Field label="Which areas of your body are you most self-conscious about or want to improve most?" sublabel="Select up to 3. This helps us prioritize your Protocol." required>
          <TagSelect
            value={answers.concern_areas ?? []}
            onChange={(v) => setAnswer("concern_areas", v)}
            options={CONCERN_OPTIONS}
            max={3}
          />
        </Field>

        <Field label="Anything else your coach should know before building your Protocol?" sublabel="Optional. Past attempts, specific constraints, context that doesn't fit above.">
          <textarea
            placeholder="e.g. I had a bad experience with X, I travel frequently, I'm recovering from…"
            value={answers.coach_notes ?? ""}
            onChange={(e) => setAnswer("coach_notes", e.target.value)}
            maxLength={1000}
            rows={4}
            className="w-full rounded-xl border border-black/12 bg-white px-4 py-3 text-sm text-ink placeholder:text-ink/30 focus:border-black focus:outline-none resize-none"
          />
          <p className="text-[11px] text-ink/30 text-right mt-1">{(answers.coach_notes ?? "").length} / 1000</p>
        </Field>
      </div>

      <SectionFooter
        onNext={handleNext}
        onBack={onBack}
        saving={saving}
        error={error ?? serverError}
        nextLabel="Review my answers →"
      />
    </div>
  );
}
