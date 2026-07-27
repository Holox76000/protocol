-- Fields to track the generation pipeline: which paths in storage hold the
-- 30 output photos, how much we spent generating them (audit / margin),
-- and a `generating` status between photos_uploaded and delivered so the
-- cron worker is idempotent (a second tick sees status='generating' and
-- skips instead of double-firing 30 more Nano Banana requests).
alter table dating_orders
  add column if not exists output_paths jsonb not null default '[]',
  add column if not exists output_count int not null default 0,
  add column if not exists generation_cost_cents int,
  add column if not exists generation_started_at timestamptz,
  add column if not exists generation_error text;

-- Extend the status check to include the new `generating` state.
-- Drop the old constraint if present, then re-add with the full set.
alter table dating_orders
  drop constraint if exists dating_orders_status_check;

alter table dating_orders
  add constraint dating_orders_status_check
  check (status in ('paid', 'photos_uploaded', 'generating', 'delivered', 'failed'));

-- Cron worker picks orders in `photos_uploaded` (fresh) or resurrects those
-- stuck in `generating` for >30 min (crashed mid-run). Index makes both scans
-- cheap even with a large backlog.
create index if not exists dating_orders_generation_ready_idx
  on dating_orders (status, generation_started_at nulls first);
