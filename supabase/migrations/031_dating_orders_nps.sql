-- NPS survey for dating orders.
-- Fires 1h after the client first opens their gallery. Stores the raw
-- responses on the order row so we can join with delivery + generation
-- metadata for cohort analysis without extra plumbing.

alter table dating_orders
  add column if not exists gallery_first_viewed_at timestamptz,
  add column if not exists nps_token               uuid,
  add column if not exists nps_sent_at             timestamptz,
  add column if not exists nps_reminder_1_sent_at  timestamptz,
  add column if not exists nps_submitted_at        timestamptz,
  add column if not exists nps_score               int,
  add column if not exists nps_reason              text,
  add column if not exists nps_favorite_template   text,
  add column if not exists nps_intent              text;

create unique index if not exists dating_orders_nps_token_unique
  on dating_orders (nps_token)
  where nps_token is not null;

-- Speeds up the cron scan for orders eligible to receive the NPS email.
create index if not exists dating_orders_nps_eligibility_idx
  on dating_orders (gallery_first_viewed_at)
  where nps_sent_at is null and gallery_first_viewed_at is not null;
