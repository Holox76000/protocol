-- Track questionnaire reminder emails sent per user
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS questionnaire_reminder_1_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS questionnaire_reminder_2_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS questionnaire_reminder_3_sent_at TIMESTAMPTZ;
