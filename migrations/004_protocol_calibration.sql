-- Add calibration data to protocols table
ALTER TABLE protocols
  ADD COLUMN IF NOT EXISTS overlay_points JSONB,
  ADD COLUMN IF NOT EXISTS metrics        JSONB;
