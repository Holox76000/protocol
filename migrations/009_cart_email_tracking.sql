-- Track abandoned cart emails sent per user
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS cart_email_1_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cart_email_2_sent_at TIMESTAMPTZ;
