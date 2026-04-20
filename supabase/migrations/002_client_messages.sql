create table if not exists client_messages (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references users(id) on delete cascade,
  direction       text        not null check (direction in ('outbound', 'inbound')),
  body            text        not null,
  resend_email_id text        null,
  created_at      timestamptz not null default now()
);

create index if not exists client_messages_user_id_created_at
  on client_messages (user_id, created_at);

alter table client_messages disable row level security;
