-- Add funnel_sid to users for 1-hop personalization lookup in cart-abandon emails.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS funnel_sid TEXT;

CREATE INDEX IF NOT EXISTS idx_users_funnel_sid
  ON users(funnel_sid)
  WHERE funnel_sid IS NOT NULL;

-- Backfill from the latest matching lead row.
UPDATE users u
SET funnel_sid = (
  SELECT l.payload->>'funnel_sid'
  FROM leads l
  WHERE LOWER(l.email) = LOWER(u.email)
    AND l.payload->>'funnel_sid' IS NOT NULL
  ORDER BY l.created_at DESC
  LIMIT 1
)
WHERE u.funnel_sid IS NULL;
