-- Shared, persistent rate limiting (see lib/rateLimit.ts).
-- Counters are bucketed per (key, window_start). The RPC does an atomic
-- upsert-and-increment so concurrent serverless instances can't race past
-- the limit. Old rows are disposable — a periodic cleanup job (or a cron)
-- can delete window_start < now() - interval '1 day'.

create table if not exists public.rate_limits (
  key          text        not null,
  window_start timestamptz not null,
  count        integer     not null default 0,
  primary key (key, window_start)
);

-- Deny-by-default: only the service role (which bypasses RLS) may touch this.
alter table public.rate_limits enable row level security;

create index if not exists rate_limits_window_start_idx
  on public.rate_limits (window_start);

create or replace function public.increment_rate_limit(
  p_key text,
  p_window_start timestamptz
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  insert into public.rate_limits (key, window_start, count)
  values (p_key, p_window_start, 1)
  on conflict (key, window_start)
  do update set count = public.rate_limits.count + 1
  returning count into new_count;
  return new_count;
end;
$$;
