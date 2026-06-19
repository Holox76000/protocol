-- Anchor the lead nurture sequence on a dedicated timestamp so we can
-- onboard legacy leads (created before the sequence shipped) at a
-- controlled cadence without using their original created_at — which
-- would make them instantly eligible for E2 → E6 in a single burst.
--
-- New leads inherit DEFAULT NOW() = optin time, identical to created_at.
-- Legacy leads get a randomized future window so the daily cohort doesn't
-- send all at once.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS nurture_starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Stagger legacy leads across the next 6 hours so the per-day batches don't
-- all hit the same minute. New leads (just created in the last hour) keep
-- their natural starts_at = created_at.
UPDATE leads
SET nurture_starts_at = NOW() + (RANDOM() * INTERVAL '6 hours')
WHERE nurture_paused_at IS NULL
  AND created_at < NOW() - INTERVAL '1 hour';

CREATE INDEX IF NOT EXISTS idx_leads_nurture_starts
  ON leads(nurture_starts_at)
  WHERE nurture_paused_at IS NULL;
