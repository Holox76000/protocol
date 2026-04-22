-- Add disabled_sections column to protocols table.
-- Stores an array of section IDs that are hidden from the client view.
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS disabled_sections text[] DEFAULT '{}';
