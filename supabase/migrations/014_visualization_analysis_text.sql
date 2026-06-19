ALTER TABLE visualization_previews
  ADD COLUMN IF NOT EXISTS analysis_text TEXT;
