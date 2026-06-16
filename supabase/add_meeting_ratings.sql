-- Meeting ratings: one rating per user per meeting (1–5 stars)
-- Visible only in admin panel — never shown to other members
CREATE TABLE IF NOT EXISTS public.meeting_ratings (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id uuid NOT NULL,
  rater_id   uuid NOT NULL,
  rating     integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz DEFAULT now(),
  UNIQUE(meeting_id, rater_id)
);
