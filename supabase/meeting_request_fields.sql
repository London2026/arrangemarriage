-- Add date/time/message fields to video_meetings
-- Run in Supabase SQL Editor

ALTER TABLE public.video_meetings
  ADD COLUMN IF NOT EXISTS preferred_date date,
  ADD COLUMN IF NOT EXISTS preferred_time text,
  ADD COLUMN IF NOT EXISTS message       text;

-- Allow 'accepted' and 'declined' as status values (no constraint change needed)
-- existing default is 'pending' which is correct
