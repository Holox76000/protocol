# Protocol — Skinny-Fat Assessment + 30-Day Recomp Reset Landing Page

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file with Supabase credentials:

```
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

3. Run the dev server:

```bash
npm run dev
```

4. Open:
- Quiz: http://localhost:3000
- Landing page: http://localhost:3000/program
- Admin: http://localhost:3000/admin

## Supabase Setup (SQL)
Run the following in Supabase SQL editor:

```sql
create table if not exists leads (
  id bigserial primary key,
  email text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists event_sessions (
  id bigserial primary key,
  session_id text not null,
  event text not null,
  step integer,
  payload jsonb,
  created_at timestamptz not null default now(),
  unique (session_id, event, step)
);
```

## Notes
- Leads are stored in Supabase.
- Tracking events are stored in Supabase and aggregated in `/admin`.
- Use a service role key only on the server (never in the client).
