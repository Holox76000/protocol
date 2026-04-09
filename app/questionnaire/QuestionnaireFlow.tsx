"use client";

import { useState, useCallback } from "react";
import type { AuthUser } from "../../lib/auth";
import S1Identity from "./components/S1Identity";
import S2Social from "./components/S2Social";
import S3Biometrics from "./components/S3Biometrics";
import S4Photos from "./components/S4Photos";
import S5Training from "./components/S5Training";
import S6Nutrition from "./components/S6Nutrition";
import S7Health from "./components/S7Health";
import ReviewScreen from "./components/ReviewScreen";
import "./questionnaire.css";

export type Answers = {
  first_name?: string;
  phone?: string;
  city?: string;
  goal?: string;
  motivation?: string;
  age?: number;
  professional_environment?: string;
  professional_environment_other?: string;
  facial_structure_self?: string;
  social_perception?: string[];
  typical_clothing?: string;
  height_cm?: number;
  weight_kg?: number;
  weight_trend_6mo?: string;
  waist_circumference_cm?: number;
  photo_front_path?: string;
  photo_side_path?: string;
  photo_back_path?: string;
  photo_face_path?: string;
  photos_taken_correctly?: boolean;
  training_experience?: string;
  sessions_per_week?: number;
  session_duration_minutes?: number;
  training_location?: string;
  preferred_activities?: string[];
  daily_activity_level?: string;
  dietary_profile?: string;
  other_diet_specified?: string;
  food_allergies?: string[];
  food_allergies_other?: string;
  eating_habits?: string[];
  meals_per_day?: number;
  meal_prep_availability?: string;
  supplement_use?: string[];
  supplement_use_other?: string;
  injuries?: string[];
  injuries_other?: string;
  medical_conditions?: string[];
  medical_conditions_other?: string;
  medications?: string[];
  medications_other?: string;
  sleep_hours?: string;
  stress_level?: number;
  training_consistency?: string;
  concern_areas?: string[];
  coach_notes?: string;
};

export type SectionProps = {
  answers: Answers;
  setAnswer: <K extends keyof Answers>(key: K, value: Answers[K]) => void;
  onNext: () => void;
  onBack: () => void;
  saving: boolean;
  serverError: string | null;
  isFirst?: boolean;
};

type Props = {
  user: AuthUser;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialAnswers: Record<string, any>;
  initialSection: number;
};

const TOTAL_SECTIONS = 7;

const SECTION_NAMES = [
  "Identity",
  "Social context",
  "Biometrics",
  "Photos",
  "Training",
  "Nutrition",
  "Health",
];

export default function QuestionnaireFlow({ user, initialAnswers, initialSection }: Props) {
  const [section, setSection] = useState(Math.max(1, Math.min(initialSection, TOTAL_SECTIONS + 1)));
  const [answers, setAnswers] = useState<Answers>({
    first_name: user.first_name,
    ...initialAnswers,
  });
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const setAnswer = useCallback(<K extends keyof Answers>(key: K, value: Answers[K]) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }, []);

  const saveSection = useCallback(
    async (nextSection: number): Promise<boolean> => {
      setSaving(true);
      setServerError(null);
      try {
        const res = await fetch("/api/questionnaire/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...answers, current_section: nextSection }),
        });
        if (!res.ok) {
          const data = (await res.json()) as { error?: string };
          setServerError(data.error ?? "Save failed. Please try again.");
          return false;
        }
        return true;
      } catch {
        setServerError("Network error. Please check your connection.");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [answers]
  );

  const handleNext = useCallback(async () => {
    const nextSection = section + 1;
    const ok = await saveSection(nextSection);
    if (ok) {
      setSection(nextSection);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [section, saveSection]);

  const handleBack = useCallback(() => {
    setServerError(null);
    setSection((s) => Math.max(1, s - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleSubmit = useCallback(async () => {
    setSaving(true);
    setServerError(null);
    try {
      const res = await fetch("/api/questionnaire/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setServerError(data.error ?? "Submit failed. Please try again.");
        return;
      }
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setServerError("Network error. Please check your connection.");
    } finally {
      setSaving(false);
    }
  }, [answers]);

  if (submitted) return <SuccessScreen firstName={user.first_name} />;

  const sectionProps: SectionProps = {
    answers,
    setAnswer,
    onNext: handleNext,
    onBack: handleBack,
    saving,
    serverError,
  };

  const progressPct = Math.min(((section - 1) / TOTAL_SECTIONS) * 100, 100);
  const sectionName = section <= TOTAL_SECTIONS ? SECTION_NAMES[section - 1] : "Review";

  return (
    <main className="min-h-screen bg-pebble">
      {/* Fixed header with animated progress */}
      <header className="fixed top-0 left-0 right-0 z-10 bg-white border-b border-wire">
        {/* Animated progress line */}
        <div className="h-[2px] bg-wire">
          <div
            className="h-full bg-void transition-all duration-700 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="mx-auto max-w-[560px] px-6 py-3.5 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-mute">
            {sectionName}
          </span>
          <span className="text-[11px] font-semibold text-mute/60">
            {section <= TOTAL_SECTIONS ? `${section} / ${TOTAL_SECTIONS}` : ""}
          </span>
        </div>
      </header>

      {/* Content — key forces remount + CSS animation on section change */}
      <div className="mx-auto max-w-[560px] px-6 pt-20 pb-24">
        <div key={section} className="section-enter">
          {section === 1 && <S1Identity {...sectionProps} isFirst />}
          {section === 2 && <S2Social {...sectionProps} />}
          {section === 3 && <S3Biometrics {...sectionProps} />}
          {section === 4 && <S4Photos {...sectionProps} />}
          {section === 5 && <S5Training {...sectionProps} />}
          {section === 6 && <S6Nutrition {...sectionProps} />}
          {section === 7 && <S7Health {...sectionProps} />}
          {section === 8 && (
            <ReviewScreen
              answers={answers}
              onSubmit={handleSubmit}
              onBack={handleBack}
              saving={saving}
              error={serverError}
            />
          )}
        </div>
      </div>
    </main>
  );
}

function SuccessScreen({ firstName }: { firstName: string }) {
  return (
    <main className="min-h-screen bg-pebble flex items-center justify-center px-6">
      <div className="mx-auto max-w-[420px] text-center">
        <div className="mb-8 inline-flex h-14 w-14 items-center justify-center rounded-full bg-void">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5 9.5-10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <p className="inline-block rounded-lg border border-wire px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-mute mb-5">
          Assessment submitted
        </p>
        <h1 className="font-display text-[36px] font-normal leading-tight text-void mb-4">
          You&apos;re all set,<br />{firstName}.
        </h1>
        <p className="text-[13.5px] leading-relaxed text-dim mb-10">
          Your assessment has been received. Our team will begin building your personalized Protocol. Expect delivery within 48–72 hours.
        </p>
        <a
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-lg bg-void px-8 py-3 text-[13px] font-semibold text-white transition-all duration-150 hover:bg-[#1a1a1b] active:scale-[0.98]"
        >
          Back to dashboard
        </a>
      </div>
    </main>
  );
}
