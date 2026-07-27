-- Dynamic face-swap templates for Protocol Dating. Each row = one photo
-- variant generated per order. Admin CRUDs from /admin/dating/templates.
-- The reference image lives in the existing `dating-photos` bucket under
-- the `templates/{slug}.{ext}` prefix (private; the worker downloads it
-- via the service role — never served publicly).

create table if not exists dating_templates (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,      -- stable, used in output filename
  label           text not null,             -- human-readable
  prompt          text not null,             -- body only; buildPrompt() wraps
  ref_image_path  text not null,             -- e.g. templates/snorkel-selfie.webp
  active          boolean not null default true,
  sort_order      int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Cheap lookup for the worker's "active templates in order" query.
create index if not exists dating_templates_active_sort_idx
  on dating_templates (active, sort_order, created_at);

-- Slug shape: kebab-case, lowercase, digits allowed. Constraint here so
-- the admin API can't accidentally write a slug that would break the
-- storage path or filename.
alter table dating_templates
  add constraint dating_templates_slug_shape
  check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) between 2 and 60);

-- keep updated_at fresh on every mutation
create or replace function set_dating_templates_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists dating_templates_touch_updated_at on dating_templates;
create trigger dating_templates_touch_updated_at
  before update on dating_templates
  for each row execute function set_dating_templates_updated_at();

-- RLS: admin-only via service role; no anon/user access.
alter table dating_templates enable row level security;

drop policy if exists dating_templates_service_role_all on dating_templates;
create policy dating_templates_service_role_all
  on dating_templates
  for all
  to service_role
  using (true)
  with check (true);
