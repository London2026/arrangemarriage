import { redirect } from 'next/navigation'
import Navigation from '@/components/Navigation'
import BottomNav from '@/components/BottomNav'
import { createClient } from '@/lib/supabase/server'
import ProfileCard, { type ProfileData } from './ProfileCard'
import NotificationBanner from './NotificationBanner'
import DiscoverClient from './DiscoverClient'

export default async function DiscoverPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Guard: onboarding must be complete + get plan
  const { data: me } = await supabase
    .from('profiles')
    .select('onboarding_complete, plan')
    .eq('id', user.id)
    .maybeSingle()

  if (!me?.onboarding_complete) redirect('/onboarding')

  const userPlan  = me?.plan ?? 'free'
  const canReveal = userPlan !== 'free'
  const canMeet   = userPlan !== 'free'

  const PLAN_LIMITS: Record<string, number> = { free: 0, starter: 2, standard: 4 }
  const monthStart = new Date()
  monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)

  const [{ count: meetingsSent }, { count: extraPurchased }] = await Promise.all([
    supabase.from('video_meetings').select('*', { count: 'exact', head: true })
      .eq('requester_id', user.id).gte('created_at', monthStart.toISOString()),
    supabase.from('extra_meeting_purchases').select('*', { count: 'exact', head: true })
      .eq('user_id', user.id).gte('created_at', monthStart.toISOString()),
  ])
  const planLimit    = PLAN_LIMITS[userPlan] ?? 0
  const meetingsLeft = Math.max(0, planLimit + (extraPurchased ?? 0) - (meetingsSent ?? 0))

  // Fetch all complete profiles except the current user
  const { data: rows } = await supabase
    .from('profiles')
    .select(`
      id, full_name, age, gender, city, country,
      religion, mother_tongue, education, occupation, marital_status, has_kids, id_verified,
      back_photo_1_path, back_photo_2_path, voice_path, front_photo_path,
      fav_reels, fav_youtube, fav_web_series, fav_travel, fav_foods, fav_ai_tools
    `)
    .eq('onboarding_complete', true)
    .neq('id', user.id)
    .order('created_at', { ascending: false })
    .limit(30)

  // Which profiles has the current user already revealed?
  const { data: myReveals } = await supabase
    .from('photo_reveals')
    .select('viewed_id')
    .eq('viewer_id', user.id)

  const revealedSet = new Set((myReveals ?? []).map((r) => r.viewed_id as string))

  // Existing video meetings
  const { data: meetingRows } = await supabase
    .from('video_meetings')
    .select('room_id, requester_id, recipient_id, status')
    .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)

  const meetingByOther: Record<string, { room_id: string; status: string }> = {}
  for (const m of meetingRows ?? []) {
    const other = m.requester_id === user.id ? m.recipient_id : m.requester_id
    meetingByOther[other] = { room_id: m.room_id, status: m.status }
  }

  // Collect all storage paths we need signed URLs for
  const allPaths: string[] = []
  for (const p of rows ?? []) {
    if (p.back_photo_1_path) allPaths.push(p.back_photo_1_path)
    if (p.back_photo_2_path) allPaths.push(p.back_photo_2_path)
    if (p.voice_path) allPaths.push(p.voice_path)
    // front photo only for already-revealed profiles
    if (revealedSet.has(p.id) && p.front_photo_path) allPaths.push(p.front_photo_path)
  }

  // Batch sign all URLs in one call
  const urlMap: Record<string, string> = {}
  if (allPaths.length > 0) {
    const { data: signed } = await supabase.storage
      .from('profile-media')
      .createSignedUrls(allPaths, 3600)

    for (const item of signed ?? []) {
      if (item.path && item.signedUrl) urlMap[item.path] = item.signedUrl
    }
  }

  const profiles: ProfileData[] = (rows ?? []).map((p) => ({
    id: p.id,
    full_name: p.full_name,
    age: p.age,
    gender: p.gender,
    city: p.city,
    country: p.country,
    religion: p.religion,
    mother_tongue: p.mother_tongue,
    education: p.education,
    occupation: p.occupation,
    marital_status: p.marital_status ?? null,
    has_kids: p.has_kids ?? null,
    id_verified: p.id_verified ?? false,
    back_photo_1_url: p.back_photo_1_path ? (urlMap[p.back_photo_1_path] ?? null) : null,
    back_photo_2_url: p.back_photo_2_path ? (urlMap[p.back_photo_2_path] ?? null) : null,
    voice_url: p.voice_path ? (urlMap[p.voice_path] ?? null) : null,
    front_photo_url:
      revealedSet.has(p.id) && p.front_photo_path
        ? (urlMap[p.front_photo_path] ?? null)
        : null,
    already_revealed: revealedSet.has(p.id),
    meeting_room_id: meetingByOther[p.id]?.room_id ?? null,
    meeting_status: meetingByOther[p.id]?.status ?? null,
    fav_reels: p.fav_reels ?? null,
    fav_youtube: p.fav_youtube ?? null,
    fav_web_series: p.fav_web_series ?? null,
    fav_travel: p.fav_travel ?? null,
    fav_foods: p.fav_foods ?? null,
    fav_ai_tools: p.fav_ai_tools ?? null,
  }))

  // Fetch unread notifications for the current user
  const { data: notifications } = await supabase
    .from('notifications')
    .select('id, message, read, created_at')
    .eq('recipient_id', user.id)
    .eq('read', false)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#07111f' }}>
      <style>{`
        .disc-main { padding: 5.5rem 1.5rem 5rem; }
        .disc-h1 { font-size: 2rem; }
        @media (max-width: 600px) {
          .disc-main { padding: 5rem 0.75rem 7rem; }
          .disc-h1 { font-size: 1.5rem; }
        }
        @media (max-width: 400px) {
          .disc-main { padding: 4.5rem 0.5rem 7rem; }
        }
      `}</style>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(201,168,76,0.05) 0%, transparent 70%)' }} />

      <Navigation />

      <main className="disc-main" style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* Heading */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 className="disc-h1" style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontWeight: 600, color: '#f5f0e6', margin: '0 0 0.5rem' }}>
            Discover
          </h1>
          <div style={{ height: '1px', background: 'linear-gradient(to right, #c9a84c, transparent)' }} />
        </div>

        {/* Notifications */}
        <NotificationBanner notifications={notifications ?? []} />

        {/* Grid client — search, AI, cards */}
        {profiles.length === 0 ? (
          <EmptyState />
        ) : (
          <DiscoverClient profiles={profiles} canReveal={canReveal} canMeet={canMeet} meetingsLeft={meetingsLeft} />
        )}
      </main>
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '5rem 0' }}>
      <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 1.25rem' }}>
        💘
      </div>
      <h2 style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '1.5rem', color: '#f5f0e6', margin: '0 0 0.5rem' }}>
        No profiles yet
      </h2>
      <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', color: '#bdb5a6' }}>
        Be the first to invite someone to Soul Mate.
      </p>
    </div>
  )
}
