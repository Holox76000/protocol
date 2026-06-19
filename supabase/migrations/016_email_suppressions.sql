-- Email suppression list (unsubscribed, bounced, complained).
-- One row per email; presence = do not send marketing.

CREATE TABLE IF NOT EXISTS email_suppressions (
  email          TEXT PRIMARY KEY,
  suppressed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reason         TEXT NOT NULL,
  source         TEXT
);

-- One-click unsubscribe tokens (1-year TTL).
CREATE TABLE IF NOT EXISTS unsubscribe_tokens (
  token_hash  TEXT PRIMARY KEY,
  email       TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_unsubscribe_tokens_email
  ON unsubscribe_tokens(email);
