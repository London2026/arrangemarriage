import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import AdminClient from './AdminClient'

const ADMIN_EMAIL = 'london.anup@gmail.com'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  let adminRole: 'owner' | 'support' | null = null
  if (user.email === ADMIN_EMAIL) {
    adminRole = 'owner'
  } else {
    const { data: profileData } = await admin.from('profiles').select('admin_role').eq('id', user.id).single()
    if (profileData?.admin_role === 'support') adminRole = 'support'
  }
  if (!adminRole) redirect('/discover')

  const [membersRes, meetingsRes, revealsRes, ratingsRes, ticketsRes, reportsRes] = await Promise.all([
    admin.from('profiles')
      .select('id, full_name, age, gender, city, country, religion, caste, plan, phone, onboarding_complete, created_at, id_verified, id_document_path, id_country, crm_status, crm_notes')
      .order('created_at', { ascending: false }),
    admin.from('video_meetings')
      .select('id, room_id, requester_id, recipient_id, status, preferred_date, preferred_time, created_at')
      .order('created_at', { ascending: false })
      .limit(200),
    admin.from('photo_reveals')
      .select('id, viewer_id, viewed_id, revealed_at')
      .order('revealed_at', { ascending: false })
      .limit(200),
    admin.from('meeting_ratings')
      .select('id, meeting_id, rater_id, rating, created_at')
      .order('created_at', { ascending: false })
      .limit(200),
    admin.from('contact_submissions')
      .select('id, name, email, subject, message, status, admin_notes, created_at')
      .order('created_at', { ascending: false }),
    admin.from('profile_reports')
      .select('id, reporter_id, reported_id, reason, details, status, admin_notes, created_at')
      .order('created_at', { ascending: false }),
  ])

  const members   = membersRes.data   ?? []
  const meetings  = meetingsRes.data  ?? []
  const reveals   = revealsRes.data   ?? []
  const ratings   = ratingsRes.data   ?? []
  const tickets   = ticketsRes.data   ?? []
  const rawReports = reportsRes.data  ?? []

  // Build name lookup from members
  const nameById: Record<string, string> = {}
  for (const m of members) {
    if (m.id && m.full_name) nameById[m.id] = m.full_name
  }

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const stats = {
    totalMembers:       members.filter(m => m.onboarding_complete).length,
    newThisWeek:        members.filter(m => new Date(m.created_at) > weekAgo && m.onboarding_complete).length,
    activeSubscribers:  members.filter(m => m.plan && m.plan !== 'free').length,
    revealsToday:       reveals.filter(r => new Date(r.revealed_at) >= today).length,
    pendingMeetings:    meetings.filter(m => m.status === 'pending').length,
    openTickets:        tickets.filter(t => t.status === 'open').length,
    openReports:        rawReports.filter(r => r.status === 'open').length,
  }

  const planCounts = members.filter(m => m.onboarding_complete).reduce((acc, m) => {
    const plan = m.plan ?? 'free'
    acc[plan] = (acc[plan] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Estimated recurring revenue based on current active subscriptions
  const PLAN_PRICES_INR = { starter: 350, standard: 550 } // ₹ per month
  const monthlyRevenue = (planCounts.starter ?? 0) * PLAN_PRICES_INR.starter
    + (planCounts.standard ?? 0) * PLAN_PRICES_INR.standard
  const earnings = {
    daily:   Math.round(monthlyRevenue / 30),
    weekly:  Math.round(monthlyRevenue / 30 * 7),
    monthly: monthlyRevenue,
    yearly:  monthlyRevenue * 12,
  }

  // Breakdown of completed profiles by location / caste / religion — for marketing insights
  function countBy(field: 'city' | 'caste' | 'religion') {
    const counts: Record<string, number> = {}
    for (const m of members) {
      if (!m.onboarding_complete) continue
      const raw = (m as Record<string, unknown>)[field] as string | null | undefined
      const country = (m as Record<string, unknown>).country as string | null | undefined
      let label = (raw && raw.trim()) || 'Not specified'
      if (field === 'city' && raw && raw.trim() && country) label = `${raw.trim()}, ${country}`
      counts[label] = (counts[label] ?? 0) + 1
    }
    return Object.entries(counts).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count)
  }

  const locationCounts = countBy('city')
  const casteCounts    = countBy('caste')
  const religionCounts = countBy('religion')

  const reports = rawReports.map(r => ({
    ...r,
    reporter_name: nameById[r.reporter_id] ?? r.reporter_id.slice(0, 8),
    reported_name: nameById[r.reported_id] ?? r.reported_id.slice(0, 8),
  }))

  const meetingsWithNames = meetings.map(m => ({
    ...m,
    requester_name: nameById[m.requester_id] ?? m.requester_id.slice(0, 8),
    recipient_name: nameById[m.recipient_id] ?? m.recipient_id.slice(0, 8),
  }))

  const ratingsWithNames = ratings.map(r => {
    const mtg = meetings.find(m => m.id === r.meeting_id)
    return {
      ...r,
      rater_name: nameById[r.rater_id] ?? r.rater_id.slice(0, 8),
      meeting_date: mtg?.preferred_date ?? null,
      meeting_requester: mtg ? (nameById[mtg.requester_id] ?? '—') : '—',
      meeting_recipient: mtg ? (nameById[mtg.recipient_id] ?? '—') : '—',
    }
  })

  const revealsWithNames = reveals.map(r => ({
    ...r,
    viewer_name: nameById[r.viewer_id] ?? r.viewer_id.slice(0, 8),
    viewed_name: nameById[r.viewed_id] ?? r.viewed_id.slice(0, 8),
  }))

  // Build ID verification list — members who submitted a doc but aren't yet verified
  const pendingIdMembers = members.filter(m => m.id_document_path && !m.id_verified)
  const idDocPaths = pendingIdMembers.map(m => m.id_document_path).filter((p): p is string => !!p)
  const idUrlMap: Record<string, string> = {}
  if (idDocPaths.length > 0) {
    const { data: signed } = await admin.storage.from('profile-media').createSignedUrls(idDocPaths, 3600)
    for (const s of signed ?? []) {
      if (s.path && s.signedUrl) idUrlMap[s.path] = s.signedUrl
    }
  }
  const idVerifications = pendingIdMembers.map(m => ({
    id: m.id,
    full_name: m.full_name ?? '—',
    id_country: (m as Record<string, unknown>).id_country as string ?? '—',
    doc_url: m.id_document_path ? (idUrlMap[m.id_document_path] ?? null) : null,
    created_at: m.created_at,
  }))

  return (
    <AdminClient
      adminRole={adminRole}
      stats={stats}
      members={members}
      meetings={meetingsWithNames}
      reveals={revealsWithNames}
      ratings={ratingsWithNames}
      planCounts={planCounts}
      idVerifications={idVerifications}
      earnings={earnings}
      locationCounts={locationCounts}
      casteCounts={casteCounts}
      religionCounts={religionCounts}
      tickets={tickets}
      reports={reports}
    />
  )
}
