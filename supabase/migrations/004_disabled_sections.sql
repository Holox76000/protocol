-- Allow admins to disable individual protocol sections per client.
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS disabled_sections text[] DEFAULT '{}';
