import { createAdminClient } from '@/lib/supabase/admin'

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * Returns the original trial_started_at for this email if it has already
 * consumed a free trial on a (possibly now-deleted) account, otherwise null.
 */
export async function getPriorTrialStart(email: string): Promise<string | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('used_trial_emails')
    .select('first_trial_started_at')
    .eq('email', normalizeEmail(email))
    .maybeSingle()
  return data?.first_trial_started_at ?? null
}

/**
 * Records that this email has consumed a free trial, so a future signup
 * with the same email cannot get a fresh 30-day trial. The earliest
 * trial_started_at is preserved across repeated delete/recreate cycles.
 */
export async function recordTrialEmail(email: string, trialStartedAt: string): Promise<void> {
  const admin = createAdminClient()
  await admin.from('used_trial_emails').upsert(
    { email: normalizeEmail(email), first_trial_started_at: trialStartedAt, last_seen_at: new Date().toISOString() },
    { onConflict: 'email', ignoreDuplicates: true }
  )
}
