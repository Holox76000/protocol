-- Run this in Supabase SQL editor after 001_auth_schema.sql

CREATE TABLE IF NOT EXISTS questionnaire_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- Section 1
  first_name text,
  goal text,
  motivation text,

  -- Section 2
  age integer,
  professional_environment text,
  facial_structure_self text,
  social_perception jsonb DEFAULT '[]'::jsonb,
  typical_clothing text,

  -- Section 3
  height_cm integer,
  weight_kg numeric(5,1),
  weight_trend_6mo text,
  waist_circumference_cm integer,

  -- Section 4 (photos — store storage paths)
  photo_front_path text,
  photo_side_path text,
  photo_back_path text,
  photo_face_path text,
  photos_taken_correctly boolean DEFAULT false,

  -- Section 5 (training)
  training_experience text,
  sessions_per_week integer,
  session_duration_minutes integer,
  training_location text,
  preferred_activities jsonb DEFAULT '[]'::jsonb,
  daily_activity_level text,

  -- Section 6 (nutrition)
  dietary_profile text,
  other_diet_specified text,
  food_allergies jsonb DEFAULT '[]'::jsonb,
  eating_habits jsonb DEFAULT '[]'::jsonb,
  meals_per_day integer,
  meal_prep_availability text,
  supplement_use jsonb DEFAULT '[]'::jsonb,

  -- Section 7 (health)
  injuries jsonb DEFAULT '[]'::jsonb,
  injuries_other text,
  medical_conditions jsonb DEFAULT '[]'::jsonb,
  medical_conditions_other text,
  medications jsonb DEFAULT '[]'::jsonb,
  medications_other text,
  sleep_hours text,
  stress_level integer,
  training_consistency text,
  concern_areas jsonb DEFAULT '[]'::jsonb,
  coach_notes text,

  -- Progress tracking
  current_section integer DEFAULT 1,
  status text NOT NULL DEFAULT 'in_progress',
  submitted_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION update_questionnaire_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER questionnaire_updated_at
  BEFORE UPDATE ON questionnaire_responses
  FOR EACH ROW EXECUTE FUNCTION update_questionnaire_updated_at();

-- RLS disabled: service_role key is used server-side only
ALTER TABLE questionnaire_responses ENABLE ROW LEVEL SECURITY;
