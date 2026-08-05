-- Tracks whether the 60-min and 15-min pre-meeting reminders have been
-- sent, so the reminder cron never double-sends. Reset to null whenever a
-- meeting is rescheduled, so reminders fire again for the new time.
ALTER TABLE public.video_meetings
  ADD COLUMN IF NOT EXISTS reminder_60_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_15_sent_at timestamptz;
