-- Store the next Razorpay billing date so we can send reminder emails
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS next_billing_date timestamptz;
