import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendTrialEndingEmail } from '@/lib/sendEmail'
import { firstNameOnly } from '@/lib/maskName'
import { TRIAL_DURATION_DAYS } from '@/lib/trial'

const REMINDER_DAYS_BEFORE_END = 3

// Runs daily at 04:00 UTC (09:30 IST) via Vercel Cron (vercel.json)
// Emails every free-plan user whose trial ends in exactly 3 days, prompting them to upgrade.
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const admin = createAdminClient()

  // trial_started_at that expires in exactly REMINDER_DAYS_BEFORE_END days
  // = today - (TRIAL_DURATION_DAYS - REMINDER_DAYS_BEFORE_END)
  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() - (TRIAL_DURATION_DAYS - REMINDER_DAYS_BEFORE_END))
  const dateStr = targetDate.toISOString().slice(0, 10) // YYYY-MM-DD

  const { data: profiles, error } = await admin
    .from('profiles')
    .select('id, full_name, plan, trial_started_at, email_unsubscribed')
    .eq('plan', 'free')
    .not('trial_started_at', 'is', null)
    .gte('trial_started_at', `${dateStr}T00:00:00.000Z`)
    .lt('trial_started_at',  `${dateStr}T23:59:59.999Z`)
    .neq('email_unsubscribed', true)

  if (error) {
    console.error('trial-ending-reminder: query error', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let sent = 0
  for (const profile of profiles ?? []) {
    const { data: authUser } = await admin.auth.admin.getUserById(profile.id)
    const email = authUser?.user?.email
    if (!email) continue

    await sendTrialEndingEmail(email, firstNameOnly(profile.full_name ?? ''), REMINDER_DAYS_BEFORE_END, profile.id).catch(() => {})
    sent++
  }

  return NextResponse.json({ sent })
}
