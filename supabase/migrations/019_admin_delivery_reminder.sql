-- Track payment timestamp + admin delivery reminder state.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS admin_delivery_reminder_sent_at TIMESTAMPTZ;

-- Backfill paid_at for existing paying users (use created_at as best proxy).
UPDATE users
SET paid_at = created_at
WHERE has_paid = true
  AND paid_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_users_delivery_reminder_pending
  ON users(paid_at)
  WHERE has_paid = true
    AND protocol_status <> 'delivered'
    AND admin_delivery_reminder_sent_at IS NULL;
