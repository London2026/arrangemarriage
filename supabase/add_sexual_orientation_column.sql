-- Add Sexual Orientation column to profiles
-- Run this in Supabase SQL Editor

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS sexual_orientation text;
