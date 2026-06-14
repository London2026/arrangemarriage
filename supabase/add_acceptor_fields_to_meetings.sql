ALTER TABLE public.video_meetings
  ADD COLUMN IF NOT EXISTS acceptor_family_member text,
  ADD COLUMN IF NOT EXISTS acceptor_message text;
