-- Add supplement_protocol_content column to protocols table
ALTER TABLE protocols
  ADD COLUMN IF NOT EXISTS supplement_protocol_content text;
