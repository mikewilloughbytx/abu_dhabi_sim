-- Player log for the Abu Dhabi 2021 sim. Run once in Supabase: SQL Editor > New query > paste > Run.
create table if not exists public.runs (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  name         text not null,
  email        text not null,
  consent_at   timestamptz not null,
  first_call   text not null,
  team_calls   text not null,
  ending       text not null,
  champion     text not null,
  run_seconds  integer,
  token_id     text not null unique,   -- one row per run, so a results email can't be replayed
  email_status text not null default 'pending'
);
create index if not exists runs_email_created on public.runs (email, created_at);

-- Row level security on with no policies: only the server's service key can read or write.
alter table public.runs enable row level security;

-- Retention: delete runs older than 12 months. Run by hand, or schedule it with Supabase's pg_cron.
-- delete from public.runs where created_at < now() - interval '12 months';
