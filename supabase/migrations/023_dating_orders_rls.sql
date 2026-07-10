-- dating_orders holds customer PII (email, first_name, photo paths).
-- Server code uses the service-role key, which bypasses RLS — enabling it
-- with zero policies denies anon/authenticated PostgREST access for free.
alter table dating_orders enable row level security;

alter table dating_orders
  add constraint dating_orders_status_check
  check (status in ('paid', 'photos_uploaded', 'delivered'));
