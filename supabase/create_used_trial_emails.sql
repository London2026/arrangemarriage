-- Permanent ledger of emails that have already consumed a free trial.
-- Rows here are NEVER deleted when a profile/account is deleted — this is
-- what stops someone from deleting their account and signing up again with
-- the same email to get a brand new 30-day free trial.
create table if not exists public.used_trial_emails (
  email                   text primary key,
  first_trial_started_at  timestamptz not null,
  last_seen_at            timestamptz not null default now()
);

-- RLS enabled with no policies: only the service-role key (used server-side
-- in trusted code paths) can read or write this table.
alter table public.used_trial_emails enable row level security;
