import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPostMeetingFeedbackEmail } from '@/lib/sendEmail'
import { firstNameOnly } from '@/lib/maskName'

// Runs daily at 10:00 UTC (15:30 IST) via Vercel Cron.
// Finds accepted meetings from yesterday and emails both parties who haven't rated yet.
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const admin = createAdminClient()

  // Yesterday's date in UTC (YYYY-MM-DD)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  const { data: meetings } = await admin.from('video_meetings')
    .select('id, requester_id, recipient_id, preferred_date')
    .eq('status', 'accepted')
    .eq('preferred_date', yesterdayStr)

  if (!meetings?.length) return NextResponse.json({ sent: 0 })

  // All participant IDs
  const allIds = [...new Set(meetings.flatMap(m => [m.requester_id, m.recipient_id]))]

  // Fetch profiles and build auth email map in parallel
  const [{ data: profiles }, emailMap] = await Promise.all([
    admin.from('profiles').select('id, full_name, email_unsubscribed').in('id', allIds),
    (async () => {
      const map: Record<string, string> = {}
      let page = 1
      while (true) {
        const { data: { users }, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
        if (error || !users?.length) break
        for (const u of users) if (u.email) map[u.id] = u.email
        if (users.length < 1000) break
        page++
      }
      return map
    })(),
  ])

  // Check which participants have already rated
  const meetingIds = meetings.map(m => m.id)
  const { data: existingRatings } = await admin.from('meeting_ratings')
    .select('meeting_id, rater_id')
    .in('meeting_id', meetingIds)

  const ratedSet = new Set((existingRatings ?? []).map(r => `${r.meeting_id}:${r.rater_id}`))
  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))
  const dateOpts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }

  let sent = 0
  for (const meeting of meetings) {
    const dateStr = new Date(meeting.preferred_date).toLocaleDateString('en-GB', dateOpts)

    for (const [userId, otherId] of [
      [meeting.requester_id, meeting.recipient_id],
      [meeting.recipient_id, meeting.requester_id],
    ] as [string, string][]) {
      if (ratedSet.has(`${meeting.id}:${userId}`)) continue
      const profile = profileMap[userId]
      if (!profile || profile.email_unsubscribed) continue
      const email = emailMap[userId]
      if (!email) continue

      const otherProfileId = `Profile #${otherId.slice(0, 8).toUpperCase()}`
      const firstName = firstNameOnly(profile.full_name ?? '')
      await sendPostMeetingFeedbackEmail(email, firstName, otherProfileId, dateStr, meeting.id, userId, userId).catch(() => {})
      sent++
    }
  }

  return NextResponse.json({ sent })
}
