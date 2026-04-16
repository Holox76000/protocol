-- Migration 008: Add generated section contents to protocols table
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS nutrition_plan_content    TEXT;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS workout_plan_content      TEXT;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS sleeping_advices_content  TEXT;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS daily_protocol_content    TEXT;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS action_plan_content       TEXT;
