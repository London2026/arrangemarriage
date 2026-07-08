'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPhotoRevealedEmail, sendMutualShortlistEmail, sendProfileLikedEmail, sendMutualLikeEmail } from '@/lib/sendEmail'
import { sendPhotoRevealSMS, sendProfileLikedSMS, sendMutualLikeSMS } from '@/lib/sendSMS'
import { firstNameOnly } from '@/lib/maskName'
import { isTrialActive, TRIAL_LIMITS } from '@/lib/trial'


export async function revealPhoto(viewedUserId: string): Promise<{ signedUrl: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Enforce plan limits server-side
  const { data: me } = await supabase.from('profiles').select('plan, trial_started_at').eq('id', user.id).single()
  if (me?.plan === 'free') {
    if (!isTrialActive(me.trial_started_at ?? null, 'free'))
      throw new Error('Your free trial has ended. Upgrade to reveal photos.')
    const { count } = await supabase.from('photo_reveals')
      .select('*', { count: 'exact', head: true })
      .eq('viewer_id', user.id)
      .gte('revealed_at', me.trial_started_at!)
    if ((count ?? 0) >= TRIAL_LIMITS.photoReveals)
      throw new Error(`You have used all ${TRIAL_LIMITS.photoReveals} photo reveals in your free trial. Upgrade to continue.`)
  }

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

export async function toggleLikeProfile(likedId: string): Promise<{ liked: boolean; mutual: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  if (user.id === likedId) throw new Error('Cannot like yourself')

  const { data: existing } = await supabase
    .from('profile_likes')
    .select('id')
    .eq('liker_id', user.id)
    .eq('liked_id', likedId)
    .maybeSingle()

  if (existing) {
    await supabase.from('profile_likes').delete()
      .eq('liker_id', user.id).eq('liked_id', likedId)
    return { liked: false, mutual: false }
  }

  // Check like quota (trial users: 5 total during trial; paid: monthly limit)
  const { data: myRow } = await supabase.from('profiles')
    .select('plan, trial_started_at').eq('id', user.id).single()
  const plan = myRow?.plan ?? 'free'
  const trialActive = isTrialActive(myRow?.trial_started_at ?? null, plan)

  let limit: number
  let since: string
  if (plan === 'free') {
    if (!trialActive)
      throw new Error('Your free trial has ended. Upgrade your plan to continue liking profiles.')
    limit = TRIAL_LIMITS.likes
    since = myRow!.trial_started_at!
  } else {
    const PAID_LIKE_LIMITS: Record<string, number> = { starter: 10, standard: 15 }
    limit = PAID_LIKE_LIMITS[plan] ?? 10
    const monthStart = new Date()
    monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)
    since = monthStart.toISOString()
  }
  const { count: likesCount } = await supabase
    .from('profile_likes')
    .select('*', { count: 'exact', head: true })
    .eq('liker_id', user.id)
    .gte('created_at', since)
  if ((likesCount ?? 0) >= limit) {
    throw new Error(plan === 'free'
      ? `You have used all ${limit} likes in your free trial. Upgrade your plan to continue.`
      : `You have used all ${limit} likes for this month. Upgrade your plan for more likes.`)
  }

  await supabase.from('profile_likes').insert({ liker_id: user.id, liked_id: likedId })

  const { data: theyLikedMe } = await supabase
    .from('profile_likes')
    .select('id')
    .eq('liker_id', likedId)
    .eq('liked_id', user.id)
    .maybeSingle()
  const isMutual = !!theyLikedMe

  const myDisplayId   = `AM-${user.id.slice(0, 8).toUpperCase()}`
  const theirDisplayId = `AM-${likedId.slice(0, 8).toUpperCase()}`

  try {
    const admin = createAdminClient()
    const [{ data: myData }, { data: ownerData }, { data: myAuth }, { data: ownerAuth }] = await Promise.all([
      supabase.from('profiles').select('full_name, phone, email_unsubscribed').eq('id', user.id).single(),
      supabase.from('profiles').select('full_name, phone, email_unsubscribed').eq('id', likedId).single(),
      admin.auth.admin.getUserById(user.id),
      admin.auth.admin.getUserById(likedId),
    ])
    const myFirstName    = firstNameOnly(myData?.full_name ?? '')
    const ownerFirstName = firstNameOnly(ownerData?.full_name ?? '')
    const myEmail        = myAuth?.user?.email
    const ownerEmail     = ownerAuth?.user?.email
    const myPhone        = myData?.phone ?? null
    const ownerPhone     = ownerData?.phone ?? null

    if (isMutual) {
      await Promise.all([
        supabase.from('notifications').insert([
          {
            recipient_id: likedId, sender_id: user.id, type: 'mutual_like',
            message: `You and ${myDisplayId} have both liked each other! Video meeting requests are now activated — log in to request a meeting.`,
          },
          {
            recipient_id: user.id, sender_id: likedId, type: 'mutual_like',
            message: `You and ${theirDisplayId} have both liked each other! Video meeting requests are now activated — log in to request a meeting.`,
          },
        ]),
        ownerEmail && !ownerData?.email_unsubscribed
          ? sendMutualLikeEmail(ownerEmail, ownerFirstName, myDisplayId, likedId)
          : Promise.resolve(),
        myEmail && !myData?.email_unsubscribed
          ? sendMutualLikeEmail(myEmail, myFirstName, theirDisplayId, user.id)
          : Promise.resolve(),
        ownerPhone ? sendMutualLikeSMS(ownerPhone, ownerFirstName, myDisplayId) : Promise.resolve(),
        myPhone    ? sendMutualLikeSMS(myPhone, myFirstName, theirDisplayId)    : Promise.resolve(),
      ])
    } else {
      await Promise.all([
        supabase.from('notifications').insert({
          recipient_id: likedId, sender_id: user.id, type: 'profile_liked',
          message: `${myDisplayId} liked your profile! Log in to see their profile. Like them back to unlock video meeting requests between you.`,
        }),
        ownerEmail && !ownerData?.email_unsubscribed
          ? sendProfileLikedEmail(ownerEmail, ownerFirstName, myDisplayId, likedId)
          : Promise.resolve(),
        ownerPhone ? sendProfileLikedSMS(ownerPhone, ownerFirstName, myDisplayId) : Promise.resolve(),
      ])
    }
  } catch (err) {
    console.error('Like notification error:', err)
  }

  return { liked: true, mutual: isMutual }
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
