CREATE TABLE IF NOT EXISTS funnel_sessions (
  session_id TEXT PRIMARY KEY,
  answers    JSONB        NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
