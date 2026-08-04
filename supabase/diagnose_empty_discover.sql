-- Read-only diagnostic: why is Discover empty for real accounts?
-- Run this in the Supabase SQL Editor and share the results.

-- 1. How many profiles exist in total, and how many are onboarding_complete?
select
  count(*) as total_profiles,
  count(*) filter (where onboarding_complete = true) as onboarding_complete_profiles,
  count(*) filter (where is_demo = true) as demo_profiles
from public.profiles;

-- 2. List every profile Discover would consider showing, newest first
select id, full_name, gender, city, onboarding_complete, is_demo, plan, created_at
from public.profiles
order by created_at desc
limit 30;
