import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import BottomNav from '@/components/BottomNav'
import { createClient } from '@/lib/supabase/server'
import RevealedByCard, { type Viewer } from './RevealedByCard'
import MeetingCard from './MeetingCard'
import ProfileActions from './ProfileActions'
import ReferralSection from './ReferralSection'
import BlockedMembersList from './BlockedMembersList'
import { Reveal, FadeDown } from '@/components/anim'
import { maskName } from '@/lib/maskName'

const c = {
  bg: '#07111f', navy: '#0d1f3c', navyMid: '#1a3a5c',
  gold: '#8b6914', goldLight: '#c9a84c',
  sepia: '#5a6e82', ivory: '#f5f0e6', ivoryDim: '#bdb5a6',
  border: 'rgba(201,168,76,0.18)', borderSub: 'rgba(201,168,76,0.08)',
  green: '#16a34a',
}

function isProfileUrl(s: string) { return /^https?:\/\//i.test(s.trim()) }

function shortProfileLabel(url: string) {
  try {
    const u = new URL(url)
    const path = u.pathname.length > 22 ? u.pathname.slice(0, 22) + '…' : u.pathname
    return (u.hostname.replace('www.', '') + path).replace(/\/$/, '')
  } catch { return url.length > 34 ? url.slice(0, 34) + '…' : url }
}

function splitChips(value: string): string[] {
  if (!value) return []
  if (value.includes(' | ')) return value.split(' | ').map(s => s.trim()).filter(Boolean)
  return value.split(',').map(s => s.trim()).filter(Boolean)
}

// ── Shared section components ──────────────────────────────────────────────

function SecHead({ icon, title }: { icon: string; title: string }) {
  return (
    <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: c.goldLight, margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
      <span style={{ fontSize: '1rem' }}>{icon}</span>{title}
    </p>
  )
}

function Row({ label, value }: { label: string; value: string | null | undefined | number }) {
  if (!value && value !== 0) return null
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.8rem' }}>
      <span className="prof-row-label" style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.85rem', fontWeight: 600, color: c.ivoryDim, minWidth: '185px', flexShrink: 0 }}>{label}</span>
      <span style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.15rem', color: c.ivory, lineHeight: 1.5 }}>{value}</span>
    </div>
  )
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '1.4rem 1.75rem', borderTop: `1px solid ${c.borderSub}` }}>
      {children}
    </div>
  )
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile?.onboarding_complete) redirect('/onboarding')

  // Sign own media URLs
  const ownPaths = [
    profile.back_photo_1_path, profile.back_photo_2_path,
    profile.voice_path, profile.voice_en_path, profile.front_photo_path,
  ].filter((p): p is string => !!p)

  const ownUrlMap: Record<string, string> = {}
  if (ownPaths.length) {
    const { data: signed } = await supabase.storage.from('profile-media').createSignedUrls(ownPaths, 3600)
    for (const s of signed ?? []) { if (s.path && s.signedUrl) ownUrlMap[s.path] = s.signedUrl }
  }

  // Who the user has blocked
  const { data: blockedRows } = await supabase
    .from('blocked_profiles').select('blocked_id').eq('blocker_id', user.id)

  const blockedProfileIds = (blockedRows ?? []).map(r => r.blocked_id as string)
  const blockedProfileData = blockedProfileIds.length > 0
    ? (await supabase.from('profiles').select('id, full_name').in('id', blockedProfileIds)).data ?? []
    : []

  // Who revealed YOUR photo
  const { data: revealRows } = await supabase
    .from('photo_reveals').select('viewer_id, revealed_at')
    .eq('viewed_id', user.id).order('revealed_at', { ascending: false })

  const viewerIds = (revealRows ?? []).map(r => r.viewer_id as string)
  const viewerProfiles = viewerIds.length > 0
    ? (await supabase.from('profiles').select('id, full_name, age, city, religion, back_photo_1_path').in('id', viewerIds)).data ?? []
    : []

  const thumbPaths = viewerProfiles.map(v => v.back_photo_1_path).filter((p): p is string => !!p)
  const thumbUrlMap: Record<string, string> = {}
  if (thumbPaths.length) {
    const { data: signed } = await supabase.storage.from('profile-media').createSignedUrls(thumbPaths, 3600)
    for (const s of signed ?? []) { if (s.path && s.signedUrl) thumbUrlMap[s.path] = s.signedUrl }
  }

  // Video meetings
  const { data: meetingRows } = await supabase
    .from('video_meetings')
    .select('id, room_id, requester_id, recipient_id, status, created_at, preferred_date, preferred_time, message, family_member, acceptor_family_member, acceptor_message')
    .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  const meetingByOther: Record<string, string> = {}
  for (const m of meetingRows ?? []) {
    const other = m.requester_id === user.id ? m.recipient_id : m.requester_id
    meetingByOther[other] = m.room_id
  }
  const meetingOtherIds = (meetingRows ?? []).map(m => m.requester_id === user.id ? m.recipient_id : m.requester_id)
  const { data: meetingProfiles } = meetingOtherIds.length > 0
    ? await supabase.from('profiles').select('id, full_name').in('id', meetingOtherIds)
    : { data: [] }
  const nameById = Object.fromEntries((meetingProfiles ?? []).map(p => [p.id, p.full_name]))

  const viewers: Viewer[] = viewerProfiles.map(v => ({
    id: v.id, full_name: v.full_name, age: v.age, city: v.city, religion: v.religion,
    thumbnail_url: v.back_photo_1_path ? (thumbUrlMap[v.back_photo_1_path] ?? null) : null,
    meeting_room_id: meetingByOther[v.id] ?? null,
    revealed_at: revealRows?.find(r => r.viewer_id === v.id)?.revealed_at ?? '',
  }))

  const meetings = (meetingRows ?? []).map(m => ({
    id: m.id, room_id: m.room_id, status: m.status, created_at: m.created_at,
    i_requested: m.requester_id === user.id,
    other_name: nameById[m.requester_id === user.id ? m.recipient_id : m.requester_id] ?? 'Member',
    preferred_date: m.preferred_date ?? null, preferred_time: m.preferred_time ?? null, message: m.message ?? null,
    family_member: m.family_member ?? null,
    acceptor_family_member: m.acceptor_family_member ?? null, acceptor_message: m.acceptor_message ?? null,
  }))

  const back1Url    = profile.back_photo_1_path ? ownUrlMap[profile.back_photo_1_path] ?? null : null
  const back2Url    = profile.back_photo_2_path ? ownUrlMap[profile.back_photo_2_path] ?? null : null
  const voiceUrl    = profile.voice_path    ? ownUrlMap[profile.voice_path]    ?? null : null
  const voiceEnUrl  = profile.voice_en_path ? ownUrlMap[profile.voice_en_path] ?? null : null
  const frontUrl    = profile.front_photo_path ? ownUrlMap[profile.front_photo_path] ?? null : null

  const personalityFields = [
    { icon: '🎬', label: 'My Favourite Reels',           value: profile.fav_reels },
    { icon: '▶️', label: 'My Favourite YouTube Channel',  value: profile.fav_youtube },
    { icon: '📺', label: 'My Favourite Web Series',       value: profile.fav_web_series },
    { icon: '✈️', label: 'My Favourite Travel',           value: profile.fav_travel },
    { icon: '🍽️', label: 'My Favourite Foods',            value: profile.fav_foods },
    { icon: '🤖', label: 'My Favourite AI Tools',         value: profile.fav_ai_tools },
  ].filter(f => f.value)

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0d0a1a 0%, #07111f 45%, #0f0a18 100%)' }}>
      <style>{`
        @keyframes petalFall {
          0%   { transform: translateY(-40px) translateX(0px) rotate(0deg); opacity: 0; }
          5%   { opacity: 1; }
          85%  { opacity: 0.85; }
          100% { transform: translateY(105vh) translateX(var(--sway)) rotate(var(--spin)); opacity: 0; }
        }
        .petal { position:fixed; top:-40px; pointer-events:none; z-index:1; line-height:1; animation:petalFall var(--dur) var(--delay) infinite ease-in; will-change:transform; filter: drop-shadow(0 0 4px rgba(255,77,109,0.35)); }
        .prof-main { max-width: 900px; margin: 0 auto; padding: 5.5rem 1.5rem 5rem; }
        .prof-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 0.5rem; }
        .prof-h1 { font-size: 2rem; }
        .prof-personality-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .prof-revealed-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        @media (max-width: 600px) {
          .prof-main { padding: 5rem 0.75rem 7rem; }
          .prof-h1 { font-size: 1.5rem !important; }
          .prof-header { flex-direction: column; gap: 0.75rem; }
          .prof-personality-grid { grid-template-columns: 1fr; }
          .prof-revealed-grid { grid-template-columns: 1fr 1fr; gap: 0.6rem; }
        }
        @media (max-width: 400px) {
          .prof-revealed-grid { grid-template-columns: 1fr; }
          .prof-main { padding: 4.5rem 0.5rem 7rem; }
          .prof-row-label { min-width: 130px !important; }
        }
        .prof-sub { padding: 1.5rem 1.75rem; }
        .prof-sub-cta { display: inline-block; }
        @keyframes profCardEnter { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        .prof-card-enter { animation: profCardEnter 0.7s ease-out 0.15s both; }
        @media (prefers-reduced-motion: reduce) { .prof-card-enter { animation: none; } }
        @media (max-width: 480px) {
          .prof-sub { padding: 1.1rem 1rem; }
          .prof-sub-cta { display: block; text-align: center; }
        }
      `}</style>

      {/* Rose petals */}
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1, overflow: 'hidden' }}>
        {([
          { l:'3%', size:18, dur:'9s', delay:'0s', sway:'40px',  spin:'600deg' },
          { l:'15%',size:24, dur:'8s', delay:'3s', sway:'50px',  spin:'720deg' },
          { l:'30%',size:20, dur:'10s',delay:'5s', sway:'30px',  spin:'660deg' },
          { l:'45%',size:26, dur:'9s', delay:'7s', sway:'55px',  spin:'780deg' },
          { l:'60%',size:20, dur:'8s', delay:'4s', sway:'45px',  spin:'640deg' },
          { l:'74%',size:22, dur:'10s',delay:'6s', sway:'35px',  spin:'700deg' },
          { l:'88%',size:16, dur:'9s', delay:'8s', sway:'50px',  spin:'480deg' },
          { l:'52%',size:18, dur:'13s',delay:'1s', sway:'-30px', spin:'500deg' },
        ] as const).map((p, i) => (
          <span key={i} className="petal" style={{
            left: p.l, fontSize: `${p.size}px`,
            ['--dur' as string]: p.dur, ['--delay' as string]: p.delay,
            ['--sway' as string]: p.sway, ['--spin' as string]: p.spin,
          }}>🌹</span>
        ))}
      </div>

      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(201,168,76,0.06) 0%, transparent 65%)' }} />
      <Navigation />

      <main className="prof-main">

        {/* Page header */}
        <FadeDown>
        <div className="prof-header">
          <div>
            <h1 className="prof-h1" style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontWeight: 600, color: c.ivory, margin: '0 0 0.5rem' }}>My Profile</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 1rem', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.35)', borderRadius: '8px' }}>
                <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: c.sepia }}>Profile ID</span>
                <span style={{ fontFamily: '"Courier New", monospace', fontSize: '1.2rem', fontWeight: 900, color: c.goldLight, letterSpacing: '0.12em' }}>AM-{user.id.slice(0, 8).toUpperCase()}</span>
              </div>
              {(!profile.plan || profile.plan === 'free') ? (
                <Link href="/pricing" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 1rem', background: 'linear-gradient(135deg, rgba(232,200,118,0.18), rgba(201,168,76,0.12))', border: '1px solid rgba(201,168,76,0.5)', borderRadius: '8px', fontFamily: 'Raleway, sans-serif', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: c.goldLight, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                  ✦ Upgrade →
                </Link>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 1rem', background: profile.plan === 'standard' ? 'rgba(74,222,128,0.08)' : 'rgba(201,168,76,0.08)', border: `1px solid ${profile.plan === 'standard' ? 'rgba(74,222,128,0.3)' : 'rgba(201,168,76,0.3)'}`, borderRadius: '8px', fontFamily: 'Raleway, sans-serif', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: profile.plan === 'standard' ? '#4ade80' : c.goldLight }}>
                  {profile.plan === 'standard' ? '💎 Standard Plan' : '⭐ Starter Plan'}
                </span>
              )}
            </div>
          </div>
          <Link href="/onboarding?edit=true" style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: c.goldLight, textDecoration: 'none', padding: '0.55rem 1.1rem', border: `1px solid rgba(201,168,76,0.35)`, borderRadius: '6px', whiteSpace: 'nowrap' }}>
            ✏ Edit Profile
          </Link>
        </div>
        <div style={{ height: '1px', background: `linear-gradient(to right, ${c.goldLight}, transparent)`, marginBottom: '1.75rem' }} />
        </FadeDown>

        {/* ── Main profile card ── */}
        <div className="prof-card-enter" style={{ background: 'rgba(26,58,92,0.25)', border: `1px solid ${c.border}`, borderRadius: '14px', overflow: 'hidden', marginBottom: '2.5rem', boxShadow: '0 8px 40px rgba(0,0,0,0.4)' }}>

          {/* Header */}
          <div style={{ padding: '1.75rem 1.75rem 1.4rem', borderBottom: `1px solid ${c.borderSub}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '2rem', fontWeight: 600, color: c.ivory, margin: 0 }}>
                {profile.full_name}
              </h2>
              {profile.id_verified ? (
                <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: c.green, background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.3)', borderRadius: '20px', padding: '0.28rem 0.75rem' }}>✅ ID Verified</span>
              ) : (
                <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#f59e0b', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '20px', padding: '0.28rem 0.75rem' }}>⏳ Verification Pending</span>
              )}
            </div>
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.25rem', color: c.ivoryDim, margin: '0 0 1rem' }}>
              {profile.age} yrs · {profile.gender} · {profile.city}, {profile.country}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {[profile.religion, profile.caste, profile.mother_tongue].filter(Boolean).map(tag => (
                <span key={tag} style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.08em', padding: '0.35rem 0.9rem', background: 'rgba(201,168,76,0.1)', border: `1px solid rgba(201,168,76,0.25)`, borderRadius: '20px', color: c.goldLight }}>{tag}</span>
              ))}
            </div>
          </div>

          {/* Back photos */}
          {(back1Url || back2Url) && (
            <div style={{ display: 'grid', gridTemplateColumns: back1Url && back2Url ? '1fr 1fr' : '1fr', gap: '2px' }}>
              {[back1Url, back2Url].filter(Boolean).map((url, i) => (
                <div key={i} style={{ aspectRatio: '3/4', backgroundColor: c.navy, overflow: 'hidden' }}>
                  <img src={url!} alt={`Back photo ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
              ))}
            </div>
          )}

          {/* Voice recordings */}
          {(voiceUrl || voiceEnUrl) && (
            <Section>
              <SecHead icon="🎙" title="Voice Introduction" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {voiceUrl && (
                  <div>
                    <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: c.ivoryDim, margin: '0 0 0.4rem' }}>🇮🇳 Mother Tongue</p>
                    <audio controls src={voiceUrl} preload="none" style={{ width: '100%', accentColor: c.goldLight }} />
                  </div>
                )}
                {voiceEnUrl && (
                  <div>
                    <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: c.ivoryDim, margin: '0 0 0.4rem' }}>🇬🇧 English</p>
                    <audio controls src={voiceEnUrl} preload="none" style={{ width: '100%', accentColor: c.goldLight }} />
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Face photo (own — shown clearly) */}
          {frontUrl && (
            <Section>
              <SecHead icon="📸" title="Your Face Photo (Reveal Photo)" />
              <div style={{ borderRadius: '10px', overflow: 'hidden', aspectRatio: '3/4', maxWidth: '320px' }}>
                <img src={frontUrl} alt="Your face photo" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
              <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '0.95rem', color: c.sepia, margin: '0.75rem 0 0', fontStyle: 'italic' }}>
                This photo is blurred for other members until they click &ldquo;Reveal Face Photo&rdquo; on your profile.
              </p>
            </Section>
          )}

          {/* Personal Details */}
          <Section>
            <SecHead icon="👤" title="Personal Details" />
            <Row label="Height"          value={profile.height} />
            <Row label="Weight"          value={profile.weight} />
            <Row label="Rashi / Zodiac Sign" value={profile.rashi} />
            <Row label="Marital Status"  value={profile.marital_status} />
            <Row label="Children"        value={profile.has_kids} />
            <Row label="Disability"      value={profile.disability} />
          </Section>

          {/* Education & Career */}
          <Section>
            <SecHead icon="🎓" title="Education & Career" />
            <Row label="Education Level"        value={profile.education} />
            <Row label="University / College"   value={profile.university_name} />
            <Row label="Subject / Specialisation" value={profile.education_subject} />
            <Row label="Other Qualifications"   value={profile.other_qualifications} />
            <Row label="Occupation"             value={profile.occupation} />
            <Row label="City of Work"           value={profile.occupation_city} />
            <Row label="Annual Salary"          value={profile.annual_salary} />
          </Section>

          {/* Family Background */}
          <Section>
            <SecHead icon="🏠" title="Family Background" />
            <Row label="No. of Brothers"    value={profile.brothers} />
            <Row label="No. of Sisters"     value={profile.sisters} />
            <Row label="Father's Occupation" value={profile.father_occupation} />
            <Row label="Mother's Occupation" value={profile.mother_occupation} />
            <Row label="Housing"            value={profile.housing} />
          </Section>

          {/* Lifestyle */}
          <Section>
            <SecHead icon="🌿" title="Lifestyle" />
            <Row label="Food Habits"       value={profile.food_habits} />
            <Row label="Smoking"           value={profile.smoking} />
            <Row label="Alcohol"           value={profile.alcohol} />
            <Row label="Hobbies & Interests" value={profile.hobby} />
          </Section>

          {/* Looking For */}
          {(profile.pref_gender || profile.pref_age_min || profile.pref_religion || profile.pref_caste || profile.pref_location || profile.pref_education || profile.pref_height || profile.pref_cooking || profile.pref_other) && (
            <Section>
              <SecHead icon="💑" title="Looking For" />
              <Row label="Gender"           value={profile.pref_gender} />
              <Row label="Age Range"        value={profile.pref_age_min ? `${profile.pref_age_min} – ${profile.pref_age_max ?? 60} years` : null} />
              <Row label="Religion"         value={profile.pref_religion} />
              <Row label="Caste"            value={profile.pref_caste} />
              <Row label="Location"         value={profile.pref_location} />
              <Row label="Education"        value={profile.pref_education} />
              <Row label="Preferred Height" value={profile.pref_height} />
              <Row label="Cooking"          value={profile.pref_cooking} />
              {profile.pref_other && (
                <div style={{ marginTop: '0.5rem', padding: '0.85rem 1rem', background: 'rgba(201,168,76,0.05)', border: `1px solid rgba(201,168,76,0.15)`, borderRadius: '6px' }}>
                  <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: c.ivoryDim, margin: '0 0 0.5rem' }}>Other Preferences</p>
                  <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.1rem', color: c.ivory, margin: 0, lineHeight: 1.65 }}>{profile.pref_other}</p>
                </div>
              )}
            </Section>
          )}

          {/* Personality & Interests */}
          {personalityFields.length > 0 && (
            <Section>
              <SecHead icon="✦" title="Personality & Interests" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {personalityFields.map(f => (
                  <div key={f.label} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.2rem', flexShrink: 0, marginTop: '0.1rem' }}>{f.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: c.goldLight, margin: '0 0 0.4rem' }}>{f.label}</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        {splitChips(f.value!).map((chip, i) => (
                          isProfileUrl(chip) ? (
                            <a key={i} href={chip} target="_blank" rel="noopener noreferrer"
                              style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.05rem', color: '#7fb3f5', textDecoration: 'underline', padding: '0.3rem 0.85rem', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: '20px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                              {shortProfileLabel(chip)}
                            </a>
                          ) : (
                            <span key={i} style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.05rem', color: c.ivory, padding: '0.3rem 0.85rem', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: '20px', display: 'inline-block' }}>
                              {chip}
                            </span>
                          )
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* ── Who revealed your photo ── */}
        <div style={{ marginBottom: '2rem' }}>
          <SectionHeader title="Who Revealed Your Photo" count={viewers.length} />
          {viewers.length === 0 ? (
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1rem', color: c.sepia }}>
              No one has revealed your photo yet.
            </p>
          ) : (
            <div className="prof-revealed-grid">
              {viewers.map(v => <RevealedByCard key={v.id} viewer={v} />)}
            </div>
          )}
        </div>

        {/* ── Video meetings ── */}
        <div style={{ marginBottom: '2rem' }}>
          <SectionHeader title="Video Meetings" count={meetings.length} />
          {meetings.length === 0 ? (
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1rem', color: c.sepia }}>
              No video meeting requests yet.
            </p>
          ) : (
            <div>{meetings.map(m => <MeetingCard key={m.id} meeting={m} />)}</div>
          )}
        </div>

        {/* ── Refer a Friend ── */}
        <Reveal>
          <ReferralSection
            referralCode={profile.referral_code as string | null}
            referralCount={(profile.referral_count as number) ?? 0}
            planBonusUntil={profile.plan_bonus_until as string | null}
            userId={user.id}
          />
        </Reveal>

        {/* ── Subscription ── */}
        <Reveal>
          <SubscriptionSection
            plan={profile.plan ?? 'free'}
            nextBillingDate={profile.next_billing_date as string | null}
            planBonusUntil={profile.plan_bonus_until as string | null}
            hasSubscription={!!profile.stripe_customer_id}
          />
        </Reveal>

        {/* ── Blocked Members ── */}
        <Reveal>
          <BlockedMembersList members={blockedProfileData.map(p => ({
            id: p.id,
            displayId: `AM-${p.id.slice(0, 8).toUpperCase()}`,
            maskedName: maskName(p.full_name ?? ''),
          }))} />
        </Reveal>

        {/* ── Account Settings (cancel subscription / delete profile) ── */}
        <Reveal>
          <ProfileActions
            plan={profile.plan ?? null}
            hasSubscription={!!profile.stripe_customer_id}
          />
        </Reveal>

      </main>
      <BottomNav />
    </div>
  )
}

function SubscriptionSection({ plan, nextBillingDate, planBonusUntil, hasSubscription }: {
  plan: string; nextBillingDate: string | null; planBonusUntil: string | null; hasSubscription: boolean
}) {
  const isFree     = !plan || plan === 'free'
  const isStarter  = plan === 'starter'
  const isStandard = plan === 'standard'

  const renewalStr = nextBillingDate
    ? new Date(nextBillingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })
    : null

  const bonusActive = planBonusUntil && new Date(planBonusUntil) > new Date()
  const bonusStr = planBonusUntil
    ? new Date(planBonusUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })
    : null

  const features = isFree
    ? [
        { text: 'Browse & discover all profiles', ok: true },
        { text: 'Full profile with voice introduction', ok: true },
        { text: 'Reveal face photos', ok: false },
        { text: 'Video meeting requests', ok: false },
      ]
    : isStarter
    ? [
        { text: 'Browse & discover all profiles', ok: true },
        { text: 'Reveal face photos (unlimited)', ok: true },
        { text: '2 video meeting requests per month', ok: true },
        { text: '4 video meetings/month (Premium only)', ok: false },
      ]
    : [
        { text: 'Browse & discover all profiles', ok: true },
        { text: 'Reveal face photos (unlimited)', ok: true },
        { text: '4 video meeting requests per month', ok: true },
        { text: 'Priority profile visibility', ok: true },
      ]

  return (
    <div className="prof-sub" style={{ background: 'rgba(13,31,60,0.3)', border: `1px solid rgba(201,168,76,0.18)`, borderRadius: '12px', marginBottom: '1.5rem' }}>
      <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: c.goldLight, margin: '0 0 1.25rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
        💳 Subscription
      </p>

      {/* Plan badge + price */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
        <div>
          <p style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.35rem', fontWeight: 600, color: c.ivory, margin: '0 0 0.2rem' }}>
            {isStandard ? '💎 Premium Plan' : isStarter ? '⭐ Starter Plan' : '🔓 Free Plan'}
          </p>
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1rem', color: c.sepia, margin: 0 }}>
            {isStandard ? '₹550/month' : isStarter ? '₹350/month' : 'No charge · browse freely'}
          </p>
        </div>
        {renewalStr && hasSubscription && (
          <div style={{ background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '8px', padding: '0.5rem 1rem', textAlign: 'right' }}>
            <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: c.sepia, margin: '0 0 0.15rem' }}>Next renewal</p>
            <p style={{ fontFamily: '"Playfair Display", serif', fontSize: '0.95rem', color: c.goldLight, margin: 0 }}>{renewalStr}</p>
          </div>
        )}
      </div>

      {/* Referral bonus banner */}
      {bonusActive && bonusStr && (
        <div style={{ background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: '8px', padding: '0.65rem 1rem', marginBottom: '1rem', fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.95rem', color: '#4ade80', lineHeight: 1.5 }}>
          🎁 Referral bonus active — extended access until {bonusStr}
        </div>
      )}

      {/* Features */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.25rem' }}>
        {features.map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>{f.ok ? '✓' : '✗'}</span>
            <span style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1rem', color: f.ok ? c.ivoryDim : 'rgba(90,110,130,0.6)', lineHeight: 1.4, textDecoration: f.ok ? 'none' : 'line-through' }}>{f.text}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      {(isFree || isStarter) && (
        <Link href="/pricing" className="prof-sub-cta" style={{ padding: '0.65rem 1.75rem', background: 'linear-gradient(135deg,#e8c876,#c9a84c)', color: '#0d1f3c', fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', borderRadius: '6px', textDecoration: 'none' }}>
          {isFree ? '✦ Upgrade to Starter →' : '✦ Upgrade to Premium →'}
        </Link>
      )}
    </div>
  )
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
      <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.88rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: c.goldLight, margin: 0 }}>✦ {title}</p>
      {count > 0 && (
        <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: c.goldLight, color: c.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Raleway, sans-serif', fontSize: '0.68rem', fontWeight: 700 }}>{count}</span>
      )}
    </div>
  )
}
