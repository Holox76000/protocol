-- Append-only log of Resend webhook events for monitoring + analytics.

CREATE TABLE IF NOT EXISTS email_events (
  id          BIGSERIAL PRIMARY KEY,
  email_id    TEXT NOT NULL,
  type        TEXT NOT NULL,
  email       TEXT,
  subject     TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload     JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_email_events_email_id  ON email_events(email_id);
CREATE INDEX IF NOT EXISTS idx_email_events_email     ON email_events(email);
CREATE INDEX IF NOT EXISTS idx_email_events_type_time ON email_events(type, occurred_at DESC);
