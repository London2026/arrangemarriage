'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPhotoRevealedEmail, sendMutualShortlistEmail } from '@/lib/sendEmail'
import { sendPhotoRevealSMS } from '@/lib/sendSMS'
import { firstNameOnly } from '@/lib/maskName'


export async function revealPhoto(viewedUserId: string): Promise<{ signedUrl: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Enforce paid plan server-side
  const { data: me } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
  if (!me?.plan || me.plan === 'free') throw new Error('Upgrade required to reveal photos')

  // Only insert reveal + notification once
  const { data: existing } = await supabase
    .from('photo_reveals')
    .select('id')
    .eq('viewer_id', user.id)
    .eq('viewed_id', viewedUserId)
    .maybeSingle()

  if (!existing) {
    await supabase.from('photo_reveals').insert({
      viewer_id: user.id,
      viewed_id: viewedUserId,
    })

    // Format date/time in IST
    const now = new Date()
    const istOpts: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Kolkata', hour12: true }
    const dateStr = now.toLocaleDateString('en-IN', { ...istOpts, day: 'numeric', month: 'long', year: 'numeric' })
    const timeStr = now.toLocaleTimeString('en-IN', { ...istOpts, hour: '2-digit', minute: '2-digit' })

    const ownerRes = await supabase.from('profiles').select('full_name, phone').eq('id', viewedUserId).single()
    const ownerName  = ownerRes.data?.full_name ?? ''
    const ownerPhone = ownerRes.data?.phone ?? null
    const viewerProfileId = user.id.slice(0, 8).toUpperCase()

    await supabase.from('notifications').insert({
      recipient_id: viewedUserId,
      sender_id: user.id,
      type: 'photo_revealed',
      message: `Today on ${dateStr} at ${timeStr} IST, your profile was viewed by Profile #${viewerProfileId}. You may receive a video call request — would you like to see their profile? Log in to Discover and search for #${viewerProfileId}.`,
    })

    // Email + SMS the photo owner
    const admin = createAdminClient()
    const { data: ownerAuth } = await admin.auth.admin.getUserById(viewedUserId)
    const ownerEmail = ownerAuth?.user?.email
    await Promise.all([
      ownerEmail
        ? sendPhotoRevealedEmail(ownerEmail, firstNameOnly(ownerName), viewerProfileId, dateStr, timeStr, viewedUserId)
        : Promise.resolve(),
      ownerPhone
        ? sendPhotoRevealSMS(ownerPhone, firstNameOnly(ownerName), viewerProfileId, dateStr, timeStr)
        : Promise.resolve(),
    ])
  }

  // Fetch the front photo path and generate a signed URL
  const { data: profile } = await supabase
    .from('profiles')
    .select('front_photo_path')
    .eq('id', viewedUserId)
    .single()

  if (!profile?.front_photo_path) throw new Error('No front photo on file.')

  const { data: urlData, error } = await supabase.storage
    .from('profile-media')
    .createSignedUrl(profile.front_photo_path, 3600)

  if (error || !urlData?.signedUrl) throw new Error('Could not generate photo URL.')

  return { signedUrl: urlData.signedUrl }
}

export async function toggleSaveProfile(savedId: string): Promise<{ saved: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  if (user.id === savedId) throw new Error('Cannot save yourself')

  const { data: existing } = await supabase
    .from('saved_profiles')
    .select('id')
    .eq('user_id', user.id)
    .eq('saved_profile_id', savedId)
    .maybeSingle()

  if (existing) {
    await supabase.from('saved_profiles').delete().eq('user_id', user.id).eq('saved_profile_id', savedId)
    return { saved: false }
  }

  await supabase.from('saved_profiles').insert({ user_id: user.id, saved_profile_id: savedId })

  // Check for mutual shortlist — if they also saved us, notify both
  try {
    const { data: theyAlsoSaved } = await supabase
      .from('saved_profiles')
      .select('id')
      .eq('user_id', savedId)
      .eq('saved_profile_id', user.id)
      .maybeSingle()

    if (theyAlsoSaved) {
      const myDisplayId  = `Profile #${user.id.slice(0, 8).toUpperCase()}`
      const theirDisplayId = `Profile #${savedId.slice(0, 8).toUpperCase()}`
      const admin = createAdminClient()

      const [{ data: myProfile }, { data: theirProfile }, { data: myAuth }, { data: theirAuth }] = await Promise.all([
        supabase.from('profiles').select('full_name, email_unsubscribed').eq('id', user.id).single(),
        supabase.from('profiles').select('full_name, email_unsubscribed').eq('id', savedId).single(),
        admin.auth.admin.getUserById(user.id),
        admin.auth.admin.getUserById(savedId),
      ])

      await Promise.all([
        supabase.from('notifications').insert([
          {
            recipient_id: user.id, sender_id: savedId, type: 'mutual_shortlist',
            message: `You and ${theirDisplayId} have both shortlisted each other — why not send a meeting request?`,
          },
          {
            recipient_id: savedId, sender_id: user.id, type: 'mutual_shortlist',
            message: `You and ${myDisplayId} have both shortlisted each other — why not send a meeting request?`,
          },
        ]),
        myAuth?.user?.email && !myProfile?.email_unsubscribed
          ? sendMutualShortlistEmail(myAuth.user.email, firstNameOnly(myProfile?.full_name ?? ''), theirDisplayId, user.id)
          : Promise.resolve(),
        theirAuth?.user?.email && !theirProfile?.email_unsubscribed
          ? sendMutualShortlistEmail(theirAuth.user.email, firstNameOnly(theirProfile?.full_name ?? ''), myDisplayId, savedId)
          : Promise.resolve(),
      ])
    }
  } catch (err) {
    console.error('Mutual shortlist notification error:', err)
  }

  return { saved: true }
}

export async function blockMember(blockedId: string): Promise<{ blocked: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  if (user.id === blockedId) throw new Error('Cannot block yourself')

  const { data: existing } = await supabase
    .from('blocked_profiles')
    .select('id')
    .eq('blocker_id', user.id)
    .eq('blocked_id', blockedId)
    .maybeSingle()

  if (existing) {
    await supabase.from('blocked_profiles').delete().eq('blocker_id', user.id).eq('blocked_id', blockedId)
    return { blocked: false }
  }

  await supabase.from('blocked_profiles').insert({ blocker_id: user.id, blocked_id: blockedId })
  return { blocked: true }
}

export async function reportProfile(reportedId: string, reason: string, details: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  if (user.id === reportedId) throw new Error('Cannot report yourself')
  const { error } = await supabase.from('profile_reports').upsert(
    { reporter_id: user.id, reported_id: reportedId, reason, details, status: 'open' },
    { onConflict: 'reporter_id,reported_id', ignoreDuplicates: false }
  )
  if (error) throw new Error(error.message)
}

export async function markNotificationRead(notificationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
    .eq('recipient_id', user.id)
}
