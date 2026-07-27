-- Two-phase delivery: generation happens right after upload, but the email +
-- status flip to `delivered` is held back 6-8h to signal "we're reviewing".
-- `generated_at` marks when the photos were actually produced (audit trail);
-- `deliver_at` is the wall-clock moment when the cron may release the order.
alter table dating_orders
  add column if not exists generated_at timestamptz,
  add column if not exists deliver_at timestamptz;

-- New `generated` state sits between generating and delivered.
alter table dating_orders
  drop constraint if exists dating_orders_status_check;

alter table dating_orders
  add constraint dating_orders_status_check
  check (status in ('paid', 'photos_uploaded', 'generating', 'generated', 'delivered', 'failed'));

-- The release cron scans `generated` orders where deliver_at is due; index
-- keeps the scan cheap.
create index if not exists dating_orders_deliver_ready_idx
  on dating_orders (status, deliver_at);
