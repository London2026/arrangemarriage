-- Add personality fields to profiles table
-- Run in Supabase SQL Editor

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS fav_reels       text,
  ADD COLUMN IF NOT EXISTS fav_youtube     text,
  ADD COLUMN IF NOT EXISTS fav_web_series  text,
  ADD COLUMN IF NOT EXISTS fav_travel      text,
  ADD COLUMN IF NOT EXISTS fav_foods       text,
  ADD COLUMN IF NOT EXISTS fav_ai_tools    text;
