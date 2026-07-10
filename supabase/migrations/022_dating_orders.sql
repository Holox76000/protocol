create table if not exists dating_orders (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text unique not null,
  email text not null,
  first_name text,
  amount_cents int,
  status text not null default 'paid', -- paid | photos_uploaded | delivered
  photo_paths jsonb not null default '[]',
  photos_count int not null default 0,
  utm_source text,
  utm_campaign text,
  utm_content text,
  created_at timestamptz not null default now(),
  photos_uploaded_at timestamptz,
  delivered_at timestamptz
);

create index if not exists dating_orders_email_idx on dating_orders (email);
