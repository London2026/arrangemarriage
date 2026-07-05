'use server'

import { redirect } from 'next/navigation'
import Razorpay from 'razorpay'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendMeetingRequestEmail, sendMeetingAcceptedEmail, sendMeetingConfirmedAcceptorEmail, sendMeetingCancelledEmail } from '@/lib/sendEmail'
import { sendMeetingRequestSMS, sendMeetingAcceptedSMS, sendMeetingDeclinedSMS, sendMeetingCancelledSMS } from '@/lib/sendSMS'
import { firstNameOnly } from '@/lib/maskName'

export async function deleteProfile(): Promise<never> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  // Cancel Razorpay subscription immediately so no future charge occurs
  if (profile?.stripe_customer_id && profile?.plan && profile.plan !== 'free') {
    const keyId     = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET
    if (keyId && keySecret) {
      try {
        const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret })
        await razorpay.subscriptions.cancel(profile.stripe_customer_id, false)
      } catch (_) { /* already cancelled or not found — safe to ignore */ }
    }
  }

  // Remove all uploaded files from storage
  const storagePaths = [
    profile?.back_photo_1_path, profile?.back_photo_2_path,
    profile?.voice_path, profile?.voice_en_path,
    profile?.front_photo_path, profile?.id_document_path,
  ].filter((p): p is string => !!p)
  if (storagePaths.length) {
    await supabase.storage.from('profile-media').remove(storagePaths)
  }

  // Delete profile row (FK cascades will clean up related rows)
  await supabase.from('profiles').delete().eq('id', user.id)

  // Delete the auth account so they cannot log in again
  const admin = createAdminClient()
  await admin.auth.admin.deleteUser(user.id)

  redirect('/')
}

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

  // Enforce paid plan for requester
  const { data: myProfile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
  if (!myProfile?.plan || myProfile.plan === 'free') throw new Error('Upgrade required to request meetings')

  // Enforce paid plan for recipient — free-plan members cannot receive meeting requests
  const { data: recipientPlan } = await supabase.from('profiles').select('plan').eq('id', recipientId).single()
  if (!recipientPlan?.plan || recipientPlan.plan === 'free') throw new Error('This member is on a free plan and cannot receive meeting requests at this time')

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

  // Email + SMS the recipient
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
      ? sendMeetingRequestEmail(recipientEmail, recipientFirstName, name, safeDateStr, safeTime, message, familyMember, recipientId)
      : Promise.resolve(),
    recipientProfile?.phone
      ? sendMeetingRequestSMS(recipientProfile.phone, recipientFirstName, name, safeDateStr, safeTime)
      : Promise.resolve(),
  ])

  return { meetingId: meeting.id }
}

export async function acceptMeeting(meetingId: string, familyMember: string = '', message: string = ''): Promise<{ roomId: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: meeting } = await supabase
    .from('video_meetings')
    .select('*')
    .eq('id', meetingId)
    .single()

  if (!meeting) throw new Error('Meeting not found')

  await supabase.from('video_meetings').update({
    status: 'accepted',
    acceptor_family_member: familyMember || null,
    acceptor_message: message || null,
  }).eq('id', meetingId)

  const { data: me } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
  const dateStr = new Date(meeting.preferred_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  const familyMemberNote = familyMember ? ` ${me?.full_name ?? 'Someone'} will be joined by ${familyMember}.` : ''
  const messageNote = message ? ` They said: "${message}"` : ''

  // Notify requester
  await supabase.from('notifications').insert({
    recipient_id: meeting.requester_id,
    sender_id: user.id,
    type: 'meeting_accepted',
    message: `${me?.full_name ?? 'Someone'} accepted your video meeting request for ${dateStr} at ${meeting.preferred_time}.${familyMemberNote}${messageNote} Join via the meeting link in your profile.`,
    meeting_id: meetingId,
  })

  // Email + SMS the requester
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
      ? sendMeetingAcceptedEmail(requesterEmail, requesterFirstName, acceptorName, safeDateStr, meeting.preferred_time ?? '', meeting.room_id, familyMember, message, meetingId, meeting.requester_id, meeting.requester_id)
      : Promise.resolve(),
    requesterProfile?.phone
      ? sendMeetingAcceptedSMS(requesterProfile.phone, requesterFirstName, acceptorName, safeDateStr, meeting.preferred_time ?? '', meeting.room_id)
      : Promise.resolve(),
    // Notify acceptor (Person B) with their own copy of the meeting link
    acceptorEmail
      ? sendMeetingConfirmedAcceptorEmail(acceptorEmail, acceptorFirstName, requesterProfile?.full_name ?? 'Your match', safeDateStr, meeting.preferred_time ?? '', meeting.room_id, meetingId, user.id, user.id)
      : Promise.resolve(),
    acceptorProfile?.phone
      ? sendMeetingAcceptedSMS(acceptorProfile.phone, acceptorFirstName, requesterProfile?.full_name ?? 'Your match', safeDateStr, meeting.preferred_time ?? '', meeting.room_id)
      : Promise.resolve(),
  ])

  return { roomId: meeting.room_id }
}

export async function cancelMeeting(meetingId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: meeting } = await supabase
    .from('video_meetings')
    .select('requester_id, recipient_id, preferred_date, preferred_time, status')
    .eq('id', meetingId)
    .single()

  if (!meeting) throw new Error('Meeting not found')
  if (meeting.requester_id !== user.id && meeting.recipient_id !== user.id) throw new Error('Not authorised')
  if (meeting.status === 'cancelled') return

  await supabase.from('video_meetings').update({ status: 'cancelled' }).eq('id', meetingId)

  const otherId = meeting.requester_id === user.id ? meeting.recipient_id : meeting.requester_id
  const { data: me } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
  const dateStr = meeting.preferred_date
    ? new Date(meeting.preferred_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
    : 'your meeting date'

  await supabase.from('notifications').insert({
    recipient_id: otherId,
    sender_id: user.id,
    type: 'meeting_cancelled',
    message: `${me?.full_name ?? 'Someone'} has cancelled the video meeting scheduled for ${dateStr}. Your meeting slot has been returned and you may request a new time.`,
    meeting_id: meetingId,
  })

  const admin = createAdminClient()
  const { data: otherAuth } = await admin.auth.admin.getUserById(otherId)
  const otherEmail = otherAuth?.user?.email
  const { data: otherProfile } = await supabase.from('profiles').select('full_name').eq('id', otherId).single()
  const { data: otherProfileFull } = await supabase.from('profiles').select('full_name, phone').eq('id', otherId).single()
  await Promise.all([
    otherEmail
      ? sendMeetingCancelledEmail(otherEmail, firstNameOnly(otherProfileFull?.full_name ?? ''), me?.full_name ?? 'Your match', dateStr, meeting.preferred_time ?? '', otherId)
      : Promise.resolve(),
    otherProfileFull?.phone
      ? sendMeetingCancelledSMS(otherProfileFull.phone, firstNameOnly(otherProfileFull.full_name ?? ''), me?.full_name ?? 'Your match', dateStr)
      : Promise.resolve(),
  ])
}

export async function rateMeeting(meetingId: string, rating: number, note?: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  if (rating < 1 || rating > 5) throw new Error('Invalid rating')

  const { data: meeting } = await supabase
    .from('video_meetings')
    .select('requester_id, recipient_id')
    .eq('id', meetingId)
    .single()

  if (!meeting) throw new Error('Meeting not found')
  if (meeting.requester_id !== user.id && meeting.recipient_id !== user.id) throw new Error('Not authorised')

  await supabase.from('meeting_ratings').upsert(
    { meeting_id: meetingId, rater_id: user.id, rating, ...(note?.trim() ? { note: note.trim() } : {}) },
    { onConflict: 'meeting_id,rater_id' }
  )
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
  await Promise.all([
    requesterProfile?.phone
      ? sendMeetingDeclinedSMS(requesterProfile.phone, firstNameOnly(requesterProfile.full_name ?? ''), me?.full_name ?? 'Your match', dateStr)
      : Promise.resolve(),
  ])
}
