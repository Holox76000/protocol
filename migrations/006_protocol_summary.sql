-- Migration 006: Add generated summary to protocols table
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS summary TEXT;
