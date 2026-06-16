'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPhotoRevealedEmail } from '@/lib/sendEmail'
import { sendPhotoRevealWhatsApp } from '@/lib/sendWhatsApp'
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

    // Email + WhatsApp the photo owner
    const admin = createAdminClient()
    const { data: ownerAuth } = await admin.auth.admin.getUserById(viewedUserId)
    const ownerEmail = ownerAuth?.user?.email
    await Promise.all([
      ownerEmail
        ? sendPhotoRevealedEmail(ownerEmail, firstNameOnly(ownerName), viewerProfileId, dateStr, timeStr)
        : Promise.resolve(),
      ownerPhone
        ? sendPhotoRevealWhatsApp(ownerPhone, firstNameOnly(ownerName), viewerProfileId, dateStr, timeStr)
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
