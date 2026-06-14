'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendMeetingRequestEmail, sendMeetingAcceptedEmail, sendMeetingConfirmedAcceptorEmail } from '@/lib/sendEmail'
import { sendMeetingRequestWhatsApp, sendMeetingAcceptedWhatsApp, sendMeetingDeclinedWhatsApp, sendMeetingConfirmedAcceptorWhatsApp } from '@/lib/sendWhatsApp'
import { firstNameOnly } from '@/lib/maskName'

export async function requestVideoMeeting(
  recipientId: string,
  preferredDate: string,
  preferredTime: string,
  message: string,
  familyMember: string = ''
): Promise<{ meetingId: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Check if a pending/accepted meeting already exists
  const { data: existing } = await supabase
    .from('video_meetings')
    .select('id, status')
    .or(
      `and(requester_id.eq.${user.id},recipient_id.eq.${recipientId}),` +
      `and(requester_id.eq.${recipientId},recipient_id.eq.${user.id})`
    )
    .in('status', ['pending', 'accepted'])
    .maybeSingle()

  if (existing) return { meetingId: existing.id }

  const { data: me } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
  const name = me?.full_name ?? 'Someone'

  const roomId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`

  // Try inserting with optional fields; fall back to base insert if columns don't exist yet
  let meeting: { id: string } | null = null
  const fullInsert = await supabase.from('video_meetings').insert({
    room_id: roomId,
    requester_id: user.id,
    recipient_id: recipientId,
    status: 'pending',
    preferred_date: preferredDate || null,
    preferred_time: preferredTime || null,
    message: message || null,
    family_member: familyMember || null,
  }).select('id').single()

  if (fullInsert.error) {
    // Columns might not exist yet — insert without them
    const baseInsert = await supabase.from('video_meetings').insert({
      room_id: roomId,
      requester_id: user.id,
      recipient_id: recipientId,
      status: 'pending',
    }).select('id').single()
    if (baseInsert.error || !baseInsert.data) throw new Error(baseInsert.error?.message ?? 'Failed to create meeting request')
    meeting = baseInsert.data
  } else {
    meeting = fullInsert.data
  }

  if (!meeting) throw new Error('Failed to create meeting request')

  const dateStr = new Date(preferredDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  const familyMemberNote = familyMember ? ` ${name} will be joined by ${familyMember}.` : ''

  await supabase.from('notifications').insert({
    recipient_id: recipientId,
    sender_id: user.id,
    type: 'video_meeting_request',
    message: `${name} has requested a video meeting on ${dateStr} at ${preferredTime}. Message: "${message}"${familyMemberNote}`,
    meeting_id: meeting.id,
  })

  // Email + WhatsApp the recipient
  const admin = createAdminClient()
  const { data: recipientAuth } = await admin.auth.admin.getUserById(recipientId)
  const recipientEmail = recipientAuth?.user?.email
  const safeDateStr = preferredDate
    ? new Date(preferredDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
    : 'a date to be confirmed'
  const { data: recipientProfile } = await supabase.from('profiles').select('full_name, phone').eq('id', recipientId).single()
  const recipientFirstName = firstNameOnly(recipientProfile?.full_name ?? '')
  const safeTime = preferredTime || 'time to be confirmed'
  await Promise.all([
    recipientEmail
      ? sendMeetingRequestEmail(recipientEmail, recipientFirstName, name, safeDateStr, safeTime, message, familyMember)
      : Promise.resolve(),
    recipientProfile?.phone
      ? sendMeetingRequestWhatsApp(recipientProfile.phone, recipientFirstName, name, safeDateStr, safeTime, familyMember)
      : Promise.resolve(),
  ])

  return { meetingId: meeting.id }
}

export async function acceptMeeting(meetingId: string): Promise<{ roomId: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: meeting } = await supabase
    .from('video_meetings')
    .select('*')
    .eq('id', meetingId)
    .single()

  if (!meeting) throw new Error('Meeting not found')

  await supabase.from('video_meetings').update({ status: 'accepted' }).eq('id', meetingId)

  const { data: me } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
  const dateStr = new Date(meeting.preferred_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  // Notify requester
  await supabase.from('notifications').insert({
    recipient_id: meeting.requester_id,
    sender_id: user.id,
    type: 'meeting_accepted',
    message: `${me?.full_name ?? 'Someone'} accepted your video meeting request for ${dateStr} at ${meeting.preferred_time}. Join via the meeting link in your profile.`,
    meeting_id: meetingId,
  })

  // Email + WhatsApp the requester
  const admin = createAdminClient()
  const { data: requesterAuth } = await admin.auth.admin.getUserById(meeting.requester_id)
  const requesterEmail = requesterAuth?.user?.email
  const safeDateStr = meeting.preferred_date
    ? new Date(meeting.preferred_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
    : 'your requested date'
  const { data: requesterProfile } = await supabase.from('profiles').select('full_name, phone').eq('id', meeting.requester_id).single()
  const requesterFirstName = firstNameOnly(requesterProfile?.full_name ?? '')
  const acceptorName = me?.full_name ?? 'Your match'
  const acceptorFirstName = firstNameOnly(me?.full_name ?? '')
  const { data: acceptorAuth } = await admin.auth.admin.getUserById(user.id)
  const acceptorEmail = acceptorAuth?.user?.email
  const { data: acceptorProfile } = await supabase.from('profiles').select('phone').eq('id', user.id).single()
  await Promise.all([
    // Notify requester (Person A)
    requesterEmail
      ? sendMeetingAcceptedEmail(requesterEmail, requesterFirstName, acceptorName, safeDateStr, meeting.preferred_time ?? '', meeting.room_id)
      : Promise.resolve(),
    requesterProfile?.phone
      ? sendMeetingAcceptedWhatsApp(requesterProfile.phone, requesterFirstName, acceptorName, safeDateStr, meeting.preferred_time ?? '', meeting.room_id)
      : Promise.resolve(),
    // Notify acceptor (Person B) with their own copy of the meeting link
    acceptorEmail
      ? sendMeetingConfirmedAcceptorEmail(acceptorEmail, acceptorFirstName, requesterProfile?.full_name ?? 'Your match', safeDateStr, meeting.preferred_time ?? '', meeting.room_id)
      : Promise.resolve(),
    acceptorProfile?.phone
      ? sendMeetingConfirmedAcceptorWhatsApp(acceptorProfile.phone, acceptorFirstName, requesterProfile?.full_name ?? 'Your match', safeDateStr, meeting.preferred_time ?? '', meeting.room_id)
      : Promise.resolve(),
  ])

  return { roomId: meeting.room_id }
}

export async function declineMeeting(meetingId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: meeting } = await supabase.from('video_meetings').select('requester_id, preferred_date, preferred_time').eq('id', meetingId).single()
  if (!meeting) return

  await supabase.from('video_meetings').update({ status: 'declined' }).eq('id', meetingId)

  const { data: me } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
  const dateStr = meeting.preferred_date ? new Date(meeting.preferred_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) : 'your requested date'

  await supabase.from('notifications').insert({
    recipient_id: meeting.requester_id,
    sender_id: user.id,
    type: 'meeting_declined',
    message: `${me?.full_name ?? 'Someone'} is unavailable for ${dateStr} at ${meeting.preferred_time}. You can send a new request with a different date.`,
  })

  const { data: requesterProfile } = await supabase.from('profiles').select('full_name, phone').eq('id', meeting.requester_id).single()
  if (requesterProfile?.phone) {
    await sendMeetingDeclinedWhatsApp(
      requesterProfile.phone,
      firstNameOnly(requesterProfile.full_name ?? ''),
      me?.full_name ?? 'Your match',
      dateStr,
    )
  }
}
