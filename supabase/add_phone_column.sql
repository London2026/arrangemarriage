-- Add phone number column for WhatsApp notifications
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
