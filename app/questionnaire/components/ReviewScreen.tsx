"use client";

import type { Answers } from "../QuestionnaireFlow";

type Props = {
  answers: Answers;
  onSubmit: () => void;
  onBack: () => void;
  saving: boolean;
  error: string | null;
};

function Row({ label, value }: { label: string; value: string | number | undefined | null }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between gap-4 py-2.5 border-b border-black/6 last:border-0">
      <span className="text-[12px] text-ink/50 shrink-0">{label}</span>
      <span className="text-[12px] font-semibold text-ink text-right">{String(value)}</span>
    </div>
  );
}

function SectionSummary({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-black/10 bg-white overflow-hidden mb-3">
      <div className="px-4 py-3 border-b border-black/6 bg-ash">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/50">{title}</p>
      </div>
      <div className="px-4">{children}</div>
    </div>
  );
}

function formatList(arr?: string[]): string {
  if (!arr?.length) return "—";
  return arr.join(", ");
}

export default function ReviewScreen({ answers, onSubmit, onBack, saving, error }: Props) {
  const bmi =
    answers.height_cm && answers.weight_kg
      ? (answers.weight_kg / Math.pow(answers.height_cm / 100, 2)).toFixed(1)
      : null;

  const photos = [
    answers.photo_front_path,
    answers.photo_side_path,
    answers.photo_back_path,
    answers.photo_face_path,
  ].filter(Boolean).length;

  return (
    <div>
      <div className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/40">Review</p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-ink">Check your answers.</h2>
        <p className="mt-2 text-sm text-ink/60">Review everything before submitting. Once submitted, your assessment is sent to your Protocol coach.</p>
      </div>

      <SectionSummary title="Identity & Objective">
        <Row label="First name" value={answers.first_name} />
        <Row label="Primary goal" value={answers.goal?.replace(/_/g, " ")} />
        <Row label="Motivation" value={answers.motivation?.replace(/_/g, " ")} />
      </SectionSummary>

      <SectionSummary title="Social Context">
        <Row label="Age" value={answers.age} />
        <Row label="Professional environment" value={answers.professional_environment?.replace(/_/g, " ")} />
        <Row label="Facial structure" value={answers.facial_structure_self?.replace(/_/g, " ")} />
        <Row label="Social perception" value={formatList(answers.social_perception)} />
        <Row label="Typical clothing" value={answers.typical_clothing?.replace(/_/g, " ")} />
      </SectionSummary>

      <SectionSummary title="Biometrics">
        <Row label="Height" value={answers.height_cm ? `${answers.height_cm} cm` : undefined} />
        <Row label="Weight" value={answers.weight_kg ? `${answers.weight_kg} kg` : undefined} />
        <Row label="BMI" value={bmi ?? undefined} />
        <Row label="Weight trend (6mo)" value={answers.weight_trend_6mo?.replace(/_/g, " ")} />
        <Row label="Waist" value={answers.waist_circumference_cm ? `${answers.waist_circumference_cm} cm` : undefined} />
      </SectionSummary>

      <SectionSummary title="Photos">
        <Row label="Photos uploaded" value={`${photos} / 4`} />
        <Row label="Instructions confirmed" value={answers.photos_taken_correctly ? "Yes" : "No"} />
      </SectionSummary>

      <SectionSummary title="Training">
        <Row label="Experience" value={answers.training_experience?.replace(/_/g, " ")} />
        <Row label="Sessions / week" value={answers.sessions_per_week} />
        <Row label="Session duration" value={answers.session_duration_minutes ? `${answers.session_duration_minutes} min` : undefined} />
        <Row label="Training location" value={answers.training_location?.replace(/_/g, " ")} />
        <Row label="Activities" value={formatList(answers.preferred_activities)} />
        <Row label="Daily activity" value={answers.daily_activity_level?.replace(/_/g, " ")} />
      </SectionSummary>

      <SectionSummary title="Nutrition">
        <Row label="Diet" value={answers.dietary_profile?.replace(/_/g, " ")} />
        {answers.other_diet_specified && <Row label="Diet details" value={answers.other_diet_specified} />}
        <Row label="Food allergies" value={formatList(answers.food_allergies)} />
        <Row label="Eating habits" value={formatList(answers.eating_habits)} />
        <Row label="Meals / day" value={answers.meals_per_day} />
        <Row label="Meal prep" value={answers.meal_prep_availability?.replace(/_/g, " ")} />
        <Row label="Supplements" value={formatList(answers.supplement_use)} />
      </SectionSummary>

      <SectionSummary title="Health">
        <Row label="Injuries" value={formatList(answers.injuries)} />
        {answers.injuries_other && <Row label="Injury notes" value={answers.injuries_other} />}
        <Row label="Medical conditions" value={formatList(answers.medical_conditions)} />
        {answers.medical_conditions_other && <Row label="Medical notes" value={answers.medical_conditions_other} />}
        <Row label="Medications" value={formatList(answers.medications)} />
        {answers.medications_other && <Row label="Medication notes" value={answers.medications_other} />}
        <Row label="Sleep" value={answers.sleep_hours?.replace(/_/g, " ")} />
        <Row label="Stress level" value={answers.stress_level ? `${answers.stress_level} / 5` : undefined} />
        <Row label="Training consistency" value={answers.training_consistency?.replace(/_/g, " ")} />
        <Row label="Areas of concern" value={formatList(answers.concern_areas)} />
        {answers.coach_notes && <Row label="Coach notes" value={answers.coach_notes} />}
      </SectionSummary>

      {error && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-black/20 px-5 py-3.5 text-sm font-semibold text-ink/50 hover:border-black/40 hover:text-ink transition"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={saving}
          className="flex-1 inline-flex items-center justify-center rounded-full border border-black bg-black px-6 py-3.5 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Submitting…" : "Submit my assessment →"}
        </button>
      </div>

      <p className="mt-4 text-center text-[11px] text-ink/30">
        Once submitted, your Protocol coach will receive your assessment and begin building your Protocol.
      </p>
    </div>
  );
}
