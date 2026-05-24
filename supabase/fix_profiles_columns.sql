-- ============================================================
--  Fix: Add all missing columns to the profiles table
--  Run this FIRST in Supabase SQL Editor, then run the seed
-- ============================================================

-- Drop NOT NULL constraints from legacy columns created by register.html
ALTER TABLE public.profiles
  ALTER COLUMN first_name DROP NOT NULL;

ALTER TABLE public.profiles
  ALTER COLUMN last_name DROP NOT NULL;

-- Add our app columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name        text,
  ADD COLUMN IF NOT EXISTS age              integer,
  ADD COLUMN IF NOT EXISTS gender           text,
  ADD COLUMN IF NOT EXISTS city             text,
  ADD COLUMN IF NOT EXISTS country          text,
  ADD COLUMN IF NOT EXISTS religion         text,
  ADD COLUMN IF NOT EXISTS mother_tongue    text,
  ADD COLUMN IF NOT EXISTS education        text,
  ADD COLUMN IF NOT EXISTS occupation       text,
  ADD COLUMN IF NOT EXISTS pref_gender      text,
  ADD COLUMN IF NOT EXISTS pref_age_min     integer DEFAULT 18,
  ADD COLUMN IF NOT EXISTS pref_age_max     integer DEFAULT 60,
  ADD COLUMN IF NOT EXISTS pref_location    text,
  ADD COLUMN IF NOT EXISTS pref_religion    text,
  ADD COLUMN IF NOT EXISTS voice_path       text,
  ADD COLUMN IF NOT EXISTS back_photo_1_path text,
  ADD COLUMN IF NOT EXISTS back_photo_2_path text,
  ADD COLUMN IF NOT EXISTS front_photo_path  text,
  ADD COLUMN IF NOT EXISTS onboarding_complete boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS plan             text DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS updated_at       timestamptz DEFAULT now();

-- Also create the other tables if they don't exist yet
CREATE TABLE IF NOT EXISTS public.photo_reveals (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  viewer_id   uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewed_id   uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  revealed_at timestamptz DEFAULT now(),
  UNIQUE (viewer_id, viewed_id)
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_id    uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  type         text NOT NULL,
  message      text,
  read         boolean DEFAULT false,
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.video_meetings (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id      text UNIQUE NOT NULL,
  requester_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  status       text DEFAULT 'pending',
  created_at   timestamptz DEFAULT now()
);

-- Enable RLS (safe to run even if already enabled)
ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_reveals  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_meetings ENABLE ROW LEVEL SECURITY;

-- Recreate policies (DROP first to avoid duplicates)
DROP POLICY IF EXISTS "profiles_select"       ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert"       ON public.profiles;
DROP POLICY IF EXISTS "profiles_update"       ON public.profiles;
DROP POLICY IF EXISTS "reveals_select"        ON public.photo_reveals;
DROP POLICY IF EXISTS "reveals_insert"        ON public.photo_reveals;
DROP POLICY IF EXISTS "notifications_select"  ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert"  ON public.notifications;
DROP POLICY IF EXISTS "notifications_update"  ON public.notifications;
DROP POLICY IF EXISTS "meetings_select"       ON public.video_meetings;
DROP POLICY IF EXISTS "meetings_insert"       ON public.video_meetings;
DROP POLICY IF EXISTS "meetings_update"       ON public.video_meetings;

CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "reveals_select" ON public.photo_reveals
  FOR SELECT TO authenticated
  USING (auth.uid() = viewer_id OR auth.uid() = viewed_id);
CREATE POLICY "reveals_insert" ON public.photo_reveals
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = viewer_id);

CREATE POLICY "notifications_select" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = recipient_id);
CREATE POLICY "notifications_insert" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "notifications_update" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = recipient_id);

CREATE POLICY "meetings_select" ON public.video_meetings
  FOR SELECT TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id);
CREATE POLICY "meetings_insert" ON public.video_meetings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "meetings_update" ON public.video_meetings
  FOR UPDATE TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

-- Storage bucket (safe to run again)
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-media', 'profile-media', false)
ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "storage_select" ON storage.objects;
DROP POLICY IF EXISTS "storage_update" ON storage.objects;

CREATE POLICY "storage_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'profile-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "storage_select" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'profile-media');
CREATE POLICY "storage_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'profile-media' AND (storage.foldername(name))[1] = auth.uid()::text);
