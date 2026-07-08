-- Track when each user's free trial began.
-- Existing free-plan users are backfilled from created_at so their trial
-- starts from when they first joined. Admins can manually extend by updating
-- this column if needed.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS trial_started_at timestamptz DEFAULT NOW();

UPDATE profiles
  SET trial_started_at = created_at
  WHERE trial_started_at IS NULL;
