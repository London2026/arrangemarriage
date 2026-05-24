-- ============================================================
--  Soul Mate – Database Schema
--  Run this in Supabase SQL Editor (Database → SQL Editor)
-- ============================================================

-- Profiles
create table public.profiles (
  id               uuid references auth.users(id) on delete cascade primary key,
  full_name        text,
  age              integer check (age >= 18 and age <= 100),
  gender           text,
  city             text,
  country          text,
  religion         text,
  mother_tongue    text,
  education        text,
  occupation       text,
  pref_gender      text,
  pref_age_min     integer default 18,
  pref_age_max     integer default 60,
  pref_location    text,
  pref_religion    text,
  voice_path       text,
  back_photo_1_path text,
  back_photo_2_path text,
  front_photo_path  text,
  onboarding_complete boolean default false,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- Photo reveals – tracks who has revealed whose face photo
create table public.photo_reveals (
  id          uuid default gen_random_uuid() primary key,
  viewer_id   uuid references public.profiles(id) on delete cascade,
  viewed_id   uuid references public.profiles(id) on delete cascade,
  revealed_at timestamptz default now(),
  unique (viewer_id, viewed_id)
);

-- Notifications
create table public.notifications (
  id           uuid default gen_random_uuid() primary key,
  recipient_id uuid references public.profiles(id) on delete cascade,
  sender_id    uuid references public.profiles(id) on delete cascade,
  type         text not null,   -- 'photo_revealed' | 'video_meeting_request'
  message      text,
  read         boolean default false,
  created_at   timestamptz default now()
);

-- ── RLS ──────────────────────────────────────────────────────

alter table public.profiles       enable row level security;
alter table public.photo_reveals  enable row level security;
alter table public.notifications  enable row level security;

-- Profiles: any authenticated user can view; only owner can write
create policy "profiles_select" on public.profiles
  for select to authenticated using (true);

create policy "profiles_insert" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

create policy "profiles_update" on public.profiles
  for update to authenticated using (auth.uid() = id);

-- Photo reveals
create policy "reveals_select" on public.photo_reveals
  for select to authenticated
  using (auth.uid() = viewer_id or auth.uid() = viewed_id);

create policy "reveals_insert" on public.photo_reveals
  for insert to authenticated with check (auth.uid() = viewer_id);

-- Notifications
create policy "notifications_select" on public.notifications
  for select to authenticated using (auth.uid() = recipient_id);

create policy "notifications_insert" on public.notifications
  for insert to authenticated with check (auth.uid() = sender_id);

create policy "notifications_update" on public.notifications
  for update to authenticated using (auth.uid() = recipient_id);

-- ── Storage bucket ───────────────────────────────────────────
-- Creates a private bucket for all profile media
insert into storage.buckets (id, name, public)
values ('profile-media', 'profile-media', false)
on conflict do nothing;

create policy "storage_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'profile-media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "storage_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'profile-media');

create policy "storage_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'profile-media' and (storage.foldername(name))[1] = auth.uid()::text);
