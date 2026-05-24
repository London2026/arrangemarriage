-- ============================================================
--  Soul Mate — Demo Profiles Seed
--  Run AFTER fix_profiles_columns.sql
-- ============================================================

-- Step 1: Drop the FK constraint so demo profiles can be inserted
--         without matching auth.users entries
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Step 2: Insert demo profiles
INSERT INTO public.profiles (
  id, full_name, age, gender, city, country,
  religion, mother_tongue, education, occupation,
  pref_gender, pref_age_min, pref_age_max, pref_location, pref_religion,
  plan, onboarding_complete,
  back_photo_1_path, back_photo_2_path, front_photo_path, voice_path
) VALUES

('a0000000-0000-0000-0000-000000000001',
  'Priya Sharma', 26, 'Woman', 'London', 'United Kingdom',
  'Hindu', 'Gujarati', 'Master''s Degree', 'Software Engineer',
  'Man', 24, 36, 'London', 'Hindu', 'standard', true, null, null, null, null),

('a0000000-0000-0000-0000-000000000002',
  'Anita Patel', 28, 'Woman', 'Manchester', 'United Kingdom',
  'Hindu', 'Punjabi', 'Bachelor''s Degree', 'Doctor',
  'Man', 26, 38, 'United Kingdom', 'Any', 'starter', true, null, null, null, null),

('a0000000-0000-0000-0000-000000000003',
  'James Mitchell', 30, 'Man', 'Edinburgh', 'United Kingdom',
  'Christian', 'English', 'Master''s Degree', 'Architect',
  'Woman', 25, 35, 'United Kingdom', 'Any', 'standard', true, null, null, null, null),

('a0000000-0000-0000-0000-000000000004',
  'Sophie Williams', 27, 'Woman', 'Bristol', 'United Kingdom',
  'Christian', 'English', 'Bachelor''s Degree', 'Nurse',
  'Man', 25, 36, 'United Kingdom', 'Christian', 'starter', true, null, null, null, null),

('a0000000-0000-0000-0000-000000000005',
  'Rahul Mehta', 31, 'Man', 'Birmingham', 'United Kingdom',
  'Hindu', 'Hindi', 'Master''s Degree', 'Finance Manager',
  'Woman', 26, 34, 'United Kingdom', 'Hindu', 'standard', true, null, null, null, null),

('a0000000-0000-0000-0000-000000000006',
  'Fatima Khan', 25, 'Woman', 'Leeds', 'United Kingdom',
  'Muslim', 'Urdu', 'Bachelor''s Degree', 'Teacher',
  'Man', 24, 32, 'United Kingdom', 'Muslim', 'free', true, null, null, null, null)

ON CONFLICT (id) DO NOTHING;

-- Step 3: Re-add the FK constraint with NOT VALID
--         New real users will still be checked; existing demo rows are skipped
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_id_fkey
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
  NOT VALID;
