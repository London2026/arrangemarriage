-- Add "family member joining" field to video meeting requests
-- Run this in Supabase SQL Editor

ALTER TABLE public.video_meetings
  ADD COLUMN IF NOT EXISTS family_member text;
