-- Add Blood Group column to profiles
-- Run this in Supabase SQL Editor

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS blood_group text;
