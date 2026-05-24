-- Add hobby field for personality section
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hobby text;
