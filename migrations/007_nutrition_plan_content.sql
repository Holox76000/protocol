-- Migration 007: Add generated nutrition plan to protocols table
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS nutrition_plan_content TEXT;
