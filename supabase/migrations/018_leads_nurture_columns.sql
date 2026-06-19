-- Lead nurture sequence tracking (E2-E7).
-- Lives on leads (not users) because nurture targets people who opted in
-- for the report but never created an account / reached checkout.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS nurture_e2_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS nurture_e3_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS nurture_e4_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS nurture_e5_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS nurture_e6_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS nurture_e7_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS nurture_paused_at  TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_leads_nurture_active
  ON leads(created_at)
  WHERE nurture_paused_at IS NULL;
