-- Per-photo admin feedback stored on the order, keyed by template slug.
-- Format: { "sunset-garden-dog": "Nose is too thin, keep the wide nose",
--           "restaurant-terrace-black-tee": "Jaw too sharp" }
-- Used by the single-photo regenerate action to enrich the prompt with
-- the specific correction the admin wants applied on the next run.
alter table dating_orders
  add column if not exists feedback_by_template jsonb not null default '{}'::jsonb;
