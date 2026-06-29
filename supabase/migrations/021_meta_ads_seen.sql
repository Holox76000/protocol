-- 2026-06-29 — track Meta ads we've already notified about in Slack #ads-meta.
-- The Netlify cron at netlify/functions/meta-ads-check.mts polls Meta every
-- 15 minutes, diffs the returned ads against this table, and posts only new
-- ones to Slack. Without this table the cron would re-notify the same ads
-- every cycle. The cron also seeds existing-but-old ads on first run so we
-- don't spam Slack with the whole back-catalog at startup.

CREATE TABLE IF NOT EXISTS meta_ads_seen (
  ad_id            text         PRIMARY KEY,
  name             text,
  campaign_name    text,
  adset_name       text,
  effective_status text,
  thumbnail_url    text,
  created_time     timestamptz,
  seen_at          timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS meta_ads_seen_seen_at_idx ON meta_ads_seen (seen_at DESC);
CREATE INDEX IF NOT EXISTS meta_ads_seen_created_time_idx ON meta_ads_seen (created_time DESC);
