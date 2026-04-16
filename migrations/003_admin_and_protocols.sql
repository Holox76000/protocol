-- ============================================================
-- Migration 003: Admin flag + protocols table
-- Run in Supabase SQL editor after 002
-- ============================================================

-- 1. Add is_admin flag to existing users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Set your own account as admin:
-- UPDATE users SET is_admin = TRUE WHERE email = 'your@email.com';

-- 2. Protocols table — one row per client, stores Markdown content
CREATE TABLE IF NOT EXISTS protocols (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  content      TEXT NOT NULL DEFAULT '',
  delivered_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_protocols_user_id ON protocols(user_id);

-- Auto-update updated_at on every write
CREATE OR REPLACE FUNCTION update_protocols_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS protocols_updated_at ON protocols;
CREATE TRIGGER protocols_updated_at
  BEFORE UPDATE ON protocols
  FOR EACH ROW EXECUTE FUNCTION update_protocols_updated_at();

ALTER TABLE protocols DISABLE ROW LEVEL SECURITY;
