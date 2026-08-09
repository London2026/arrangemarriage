-- Stores the self-declared date of birth captured at signup, enforced
-- server-side (18+) before the account is allowed to exist. Used as
-- compliance evidence of age verification prior to account creation/payment.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS date_of_birth date;
