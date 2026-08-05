import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendMeetingReminderEmail } from '@/lib/sendEmail'
import { sendMeetingReminderSMS } from '@/lib/sendSMS'
import { firstNameOnly } from '@/lib/maskName'

// Triggered every 5 minutes by a GitHub Actions workflow (Vercel Cron on the
// Hobby plan can only run once per day, which can't support a 60/15-minute
// pre-meeting reminder). Sends a reminder to both parties of every confirmed
// meeting starting in ~60 minutes or ~15 minutes.
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const admin = createAdminClient()
  const todayIST = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const { data: meetings, error } = await admin
    .from('video_meetings')
    .select('id, room_id, requester_id, recipient_id, preferred_date, preferred_time, reminder_60_sent_at, reminder_15_sent_at')
    .eq('status', 'accepted')
    .gte('preferred_date', todayIST)
    .or('reminder_60_sent_at.is.null,reminder_15_sent_at.is.null')

  if (error) {
    console.error('meeting-reminders: query error', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const now = Date.now()
  let sent60 = 0, sent15 = 0

  for (const meeting of meetings ?? []) {
    if (!meeting.preferred_date || !meeting.preferred_time) continue

    // preferred_date/preferred_time are entered and displayed as IST wall-clock values
    const meetingAt = new Date(`${meeting.preferred_date}T${meeting.preferred_time}:00+05:30`).getTime()
    if (Number.isNaN(meetingAt)) continue
    const minutesUntil = (meetingAt - now) / 60000

    const due60 = !meeting.reminder_60_sent_at && minutesUntil <= 65 && minutesUntil >= 50
    const due15 = !meeting.reminder_15_sent_at && minutesUntil <= 20 && minutesUntil >= 8

    if (!due60 && !due15) continue

    const [{ data: requester }, { data: recipient }, { data: requesterAuth }, { data: recipientAuth }] = await Promise.all([
      admin.from('profiles').select('full_name, phone').eq('id', meeting.requester_id).single(),
      admin.from('profiles').select('full_name, phone').eq('id', meeting.recipient_id).single(),
      admin.auth.admin.getUserById(meeting.requester_id),
      admin.auth.admin.getUserById(meeting.recipient_id),
    ])

    const dateStr = new Date(meeting.preferred_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
    const minutesBefore: 60 | 15 = due60 ? 60 : 15

    const requesterFirstName = firstNameOnly(requester?.full_name ?? '')
    const recipientFirstName = firstNameOnly(recipient?.full_name ?? '')

    await Promise.all([
      requesterAuth?.user?.email
        ? sendMeetingReminderEmail(requesterAuth.user.email, requesterFirstName, recipient?.full_name ?? 'your match', dateStr, meeting.preferred_time, meeting.room_id, minutesBefore, meeting.requester_id)
        : Promise.resolve(),
      requester?.phone
        ? sendMeetingReminderSMS(requester.phone, requesterFirstName, recipient?.full_name ?? 'your match', meeting.preferred_time, minutesBefore)
        : Promise.resolve(),
      recipientAuth?.user?.email
        ? sendMeetingReminderEmail(recipientAuth.user.email, recipientFirstName, requester?.full_name ?? 'your match', dateStr, meeting.preferred_time, meeting.room_id, minutesBefore, meeting.recipient_id)
        : Promise.resolve(),
      recipient?.phone
        ? sendMeetingReminderSMS(recipient.phone, recipientFirstName, requester?.full_name ?? 'your match', meeting.preferred_time, minutesBefore)
        : Promise.resolve(),
    ])

    await admin.from('video_meetings').update(
      due60 ? { reminder_60_sent_at: new Date().toISOString() } : { reminder_15_sent_at: new Date().toISOString() }
    ).eq('id', meeting.id)

    if (due60) sent60++
    else sent15++
  }

  return NextResponse.json({ sent60, sent15 })
}
