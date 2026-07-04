import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWeeklyDigestEmail } from '@/lib/sendEmail'
import { firstNameOnly } from '@/lib/maskName'

// Runs every Monday at 06:00 UTC (11:30 IST) via Vercel Cron
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const admin = createAdminClient()
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Fetch all active members, recent reveals, and new members in parallel
  const [membersRes, revealsRes, newMembersRes] = await Promise.all([
    admin.from('profiles')
      .select('id, full_name, city, country, email_unsubscribed')
      .eq('onboarding_complete', true)
      .neq('suspended', true)
      .neq('email_unsubscribed', true),
    admin.from('photo_reveals')
      .select('viewed_id')
      .gte('revealed_at', sevenDaysAgo),
    admin.from('profiles')
      .select('id, city, country')
      .eq('onboarding_complete', true)
      .gte('created_at', sevenDaysAgo),
  ])

  const members    = membersRes.data   ?? []
  const reveals    = revealsRes.data   ?? []
  const newMembers = newMembersRes.data ?? []

  // Build auth email map in one batch to avoid N+1 calls
  const emailMap: Record<string, string> = {}
  let page = 1
  while (true) {
    const { data: { users }, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error || !users?.length) break
    for (const u of users) {
      if (u.email) emailMap[u.id] = u.email
    }
    if (users.length < 1000) break
    page++
  }

  // Build view count map
  const viewCount: Record<string, number> = {}
  for (const r of reveals) {
    viewCount[r.viewed_id] = (viewCount[r.viewed_id] ?? 0) + 1
  }

  let sent = 0
  for (const member of members) {
    const views = viewCount[member.id] ?? 0

    // Count new members in the same city (preferred) or same country (fallback)
    const nearbyNew = newMembers.filter(nm => {
      if (nm.id === member.id) return false
      if (member.city && nm.city && nm.city.toLowerCase() === member.city.toLowerCase()) return true
      if (!member.city && member.country && nm.country && nm.country.toLowerCase() === member.country.toLowerCase()) return true
      return false
    }).length

    if (views === 0 && nearbyNew === 0) continue

    const email = emailMap[member.id]
    if (!email) continue

    const firstName = firstNameOnly(member.full_name ?? '')
    const location  = member.city ?? member.country ?? 'your area'
    await sendWeeklyDigestEmail(email, firstName, views, nearbyNew, location, member.id).catch(() => {})
    sent++
  }

  return NextResponse.json({ sent })
}
