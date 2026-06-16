-- Add Own Farm Land column to profiles
-- Run this in Supabase SQL Editor

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS own_farm_land text;
