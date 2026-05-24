-- ============================================================
--  Soul Mate – Video Meetings Table
--  Run in Supabase SQL Editor after schema.sql
-- ============================================================

create table public.video_meetings (
  id           uuid default gen_random_uuid() primary key,
  room_id      text unique not null,
  requester_id uuid references public.profiles(id) on delete cascade,
  recipient_id uuid references public.profiles(id) on delete cascade,
  status       text default 'pending',   -- 'pending' | 'active' | 'ended'
  created_at   timestamptz default now()
);

alter table public.video_meetings enable row level security;

create policy "meetings_select" on public.video_meetings
  for select to authenticated
  using (auth.uid() = requester_id or auth.uid() = recipient_id);

create policy "meetings_insert" on public.video_meetings
  for insert to authenticated
  with check (auth.uid() = requester_id);

create policy "meetings_update" on public.video_meetings
  for update to authenticated
  using (auth.uid() = requester_id or auth.uid() = recipient_id);
