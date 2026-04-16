-- Migration 005: Before/After AI preview
-- Stores the Supabase Storage path of the Gemini-generated "after" image
ALTER TABLE protocols
  ADD COLUMN IF NOT EXISTS before_after_preview_path TEXT;
