CREATE TABLE IF NOT EXISTS public.extra_meeting_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_session_id text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.extra_meeting_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own" ON public.extra_meeting_purchases
  FOR SELECT USING (auth.uid() = user_id);
