-- Track promo blast sends per user (prevents duplicates)
ALTER TABLE users ADD COLUMN IF NOT EXISTS promo_summer40_sent_at TIMESTAMPTZ;
