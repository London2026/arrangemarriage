-- SMS queued outside the 9 AM–9 PM IST window permitted by TRAI's DLT
-- scrubbing layer. Dispatched by /api/send-queued-sms at 9 AM IST daily.
create table if not exists public.sms_queue (
  id          uuid default gen_random_uuid() primary key,
  phone       text not null,
  template_id text not null,
  variables   jsonb not null default '{}',
  status      text not null default 'pending', -- 'pending' | 'sent' | 'failed'
  created_at  timestamptz not null default now(),
  sent_at     timestamptz
);

-- RLS enabled with no policies: only the service-role key (used server-side)
-- can read or write this table.
alter table public.sms_queue enable row level security;
