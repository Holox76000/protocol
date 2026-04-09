-- ============================================================
-- Migration 001: Auth schema for Protocol Club customer portal
-- Run this in your Supabase SQL editor
-- ============================================================

-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ──────────────────────────────────────────────
-- USERS
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email             TEXT UNIQUE NOT NULL,
  password_hash     TEXT NOT NULL,
  first_name        TEXT NOT NULL,
  stripe_customer_id TEXT,
  has_paid          BOOLEAN DEFAULT FALSE,
  protocol_status   TEXT NOT NULL DEFAULT 'not_started'
                    CHECK (protocol_status IN (
                      'not_started',
                      'questionnaire_in_progress',
                      'questionnaire_submitted',
                      'in_review',
                      'delivered'
                    )),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  last_login_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_email
  ON users(email);

CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id
  ON users(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

-- ──────────────────────────────────────────────
-- SESSIONS
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash   TEXT NOT NULL UNIQUE,
  expires_at   TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  ip_address   TEXT,
  user_agent   TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_token_hash
  ON sessions(token_hash);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id
  ON sessions(user_id);

-- Auto-delete expired sessions (optional, run periodically)
-- DELETE FROM sessions WHERE expires_at < NOW();

-- ──────────────────────────────────────────────
-- REGISTRATION TOKENS
-- Generated after Stripe purchase, single-use,
-- allows pre-filling /register with email + name
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS registration_tokens (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash          TEXT NOT NULL UNIQUE,
  email               TEXT NOT NULL,
  first_name          TEXT,
  stripe_customer_id  TEXT,
  used                BOOLEAN DEFAULT FALSE,
  expires_at          TIMESTAMPTZ NOT NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_registration_tokens_hash
  ON registration_tokens(token_hash);

CREATE INDEX IF NOT EXISTS idx_registration_tokens_email
  ON registration_tokens(email);

-- ──────────────────────────────────────────────
-- UPDATED_AT trigger
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ──────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- We use service_role key server-side only,
-- so RLS is disabled — server is the only writer.
-- ──────────────────────────────────────────────
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE registration_tokens DISABLE ROW LEVEL SECURITY;
