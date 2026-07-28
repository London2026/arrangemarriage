-- Add is_demo column to profiles, so demo/showcase profiles can be
-- clearly labeled as such to customers browsing Discover.
-- Run this in Supabase SQL Editor.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_demo boolean DEFAULT false;
