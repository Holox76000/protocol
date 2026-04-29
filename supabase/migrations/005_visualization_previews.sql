CREATE TABLE IF NOT EXISTS visualization_previews (
  preview_id TEXT PRIMARY KEY,
  before_path TEXT NOT NULL,
  after_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
