import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendOnboardingReminderEmail } from '@/lib/sendEmail'

// Runs daily at 05:00 UTC (10:30 IST) via Vercel Cron.
// Targets users who signed up 24–48h ago but have not completed their profile.
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const admin = createAdminClient()
  const oneDayAgo  = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000)

  // Collect auth users who signed up in the 24–48h window
  const targetUsers: { id: string; email: string; firstName: string }[] = []
  let page = 1
  while (true) {
    const { data: { users }, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error || !users?.length) break
    for (const u of users) {
      const created = new Date(u.created_at)
      if (created >= twoDaysAgo && created < oneDayAgo && u.email) {
        const meta = u.user_metadata as Record<string, string> | undefined
        const firstName = (meta?.full_name ?? u.email).split(' ')[0]
        targetUsers.push({ id: u.id, email: u.email, firstName })
      }
    }
    if (users.length < 1000) break
    page++
  }

  if (targetUsers.length === 0) return NextResponse.json({ sent: 0 })

  // Fetch profiles for all target users in one query
  const ids = targetUsers.map(u => u.id)
  const { data: profiles } = await admin.from('profiles')
    .select('id, onboarding_complete, plan, email_unsubscribed')
    .in('id', ids)

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))

  let sent = 0
  for (const u of targetUsers) {
    const profile = profileMap[u.id]

    // Skip if already complete or unsubscribed
    if (profile?.onboarding_complete) continue
    if (profile?.email_unsubscribed) continue

    const hasPlan = !!(profile?.plan && profile.plan !== 'free')
    await sendOnboardingReminderEmail(u.email, u.firstName, hasPlan, u.id).catch(() => {})
    sent++
  }

  return NextResponse.json({ sent })
}
