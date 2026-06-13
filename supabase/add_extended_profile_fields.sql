-- Add columns needed by the expanded onboarding form
-- (Personal Details, Family Background, Lifestyle, Looking For, ID Verification)
-- Run this in Supabase SQL Editor BEFORE deploying the updated app code,
-- otherwise onboarding "Save" will fail with "column ... does not exist".

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS caste               text,
  ADD COLUMN IF NOT EXISTS height              text,
  ADD COLUMN IF NOT EXISTS weight              text,
  ADD COLUMN IF NOT EXISTS brothers            text,
  ADD COLUMN IF NOT EXISTS sisters             text,
  ADD COLUMN IF NOT EXISTS father_occupation   text,
  ADD COLUMN IF NOT EXISTS mother_occupation   text,
  ADD COLUMN IF NOT EXISTS housing             text,
  ADD COLUMN IF NOT EXISTS disability          text,
  ADD COLUMN IF NOT EXISTS food_habits         text,
  ADD COLUMN IF NOT EXISTS smoking             text,
  ADD COLUMN IF NOT EXISTS alcohol             text,
  ADD COLUMN IF NOT EXISTS education_subject   text,
  ADD COLUMN IF NOT EXISTS other_qualifications text,
  ADD COLUMN IF NOT EXISTS occupation_city     text,
  ADD COLUMN IF NOT EXISTS annual_salary       text,
  ADD COLUMN IF NOT EXISTS marital_status      text,
  ADD COLUMN IF NOT EXISTS has_kids            text,
  ADD COLUMN IF NOT EXISTS pref_caste          text,
  ADD COLUMN IF NOT EXISTS pref_education      text,
  ADD COLUMN IF NOT EXISTS pref_height         text,
  ADD COLUMN IF NOT EXISTS pref_cooking        text,
  ADD COLUMN IF NOT EXISTS pref_other          text,
  ADD COLUMN IF NOT EXISTS id_country          text,
  ADD COLUMN IF NOT EXISTS id_document_path    text,
  ADD COLUMN IF NOT EXISTS id_verified         boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS voice_en_path       text;
