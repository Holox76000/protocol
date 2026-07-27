-- Post-purchase upsells for dating orders.
-- Two independent $20 upsells sold on /dating/success:
--   1. Priority delivery: guarantees delivery within 8h of the original
--      payment (vs the standard 24h window with 6-8h artificial hold).
--   2. Luxury lifestyle pack: unlocks 8 extra photos generated from the
--      `luxury` template set (yacht, private jet, ski chalet, etc).
-- Payments flow through Stripe Checkout as separate sessions. The webhook
-- routes them by session.metadata.upsell_kind and stamps the flags below.

alter table dating_orders
  add column if not exists upsell_priority          boolean not null default false,
  add column if not exists upsell_luxury            boolean not null default false,
  add column if not exists upsell_priority_pi_id    text,
  add column if not exists upsell_luxury_pi_id      text,
  add column if not exists upsell_priority_paid_at  timestamptz,
  add column if not exists upsell_luxury_paid_at    timestamptz;

-- Templates get a `kind` so the generator can address the core set and the
-- luxury set independently. Default 'core' preserves existing behaviour.
alter table dating_templates
  add column if not exists kind text not null default 'core';

-- Guard rail: keep the vocabulary tight — future values only via migration.
alter table dating_templates
  drop constraint if exists dating_templates_kind_check;
alter table dating_templates
  add constraint dating_templates_kind_check check (kind in ('core', 'luxury'));

create index if not exists dating_templates_active_kind_idx
  on dating_templates (active, kind, sort_order);
