import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import BottomNav from '@/components/BottomNav'
import { createClient } from '@/lib/supabase/server'
import RevealedByCard, { type Viewer } from './RevealedByCard'
import MeetingCard from './MeetingCard'

const c = {
  bg: '#07111f',
  navy: '#0d1f3c',
  navyMid: '#1a3a5c',
  gold: '#8b6914',
  goldLight: '#c9a84c',
  sepia: '#5a6e82',
  ivory: '#f5f0e6',
  ivoryDim: '#bdb5a6',
  border: 'rgba(201,168,76,0.18)',
  borderSub: 'rgba(201,168,76,0.08)',
}

function isProfileUrl(s: string): boolean {
  return /^https?:\/\//i.test(s.trim())
}

function shortProfileLabel(url: string): string {
  try {
    const u = new URL(url)
    const path = u.pathname.length > 22 ? u.pathname.slice(0, 22) + '…' : u.pathname
    return (u.hostname.replace('www.', '') + path).replace(/\/$/, '')
  } catch {
    return url.length > 34 ? url.slice(0, 34) + '…' : url
  }
}

function splitChips(value: string): string[] {
  if (!value) return []
  // Support both " | " (new format) and "," (legacy format)
  if (value.includes(' | ')) return value.split(' | ').map(s => s.trim()).filter(Boolean)
  return value.split(',').map(s => s.trim()).filter(Boolean)
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile?.onboarding_complete) redirect('/onboarding')

  // Own media signed URLs
  const ownPaths = [
    profile.back_photo_1_path,
    profile.back_photo_2_path,
    profile.voice_path,
  ].filter((p): p is string => !!p)

  const ownUrlMap: Record<string, string> = {}
  if (ownPaths.length) {
    const { data: signed } = await supabase.storage
      .from('profile-media')
      .createSignedUrls(ownPaths, 3600)
    for (const s of signed ?? []) {
      if (s.path && s.signedUrl) ownUrlMap[s.path] = s.signedUrl
    }
  }

  // Who revealed YOUR photo
  const { data: revealRows } = await supabase
    .from('photo_reveals')
    .select('viewer_id, revealed_at')
    .eq('viewed_id', user.id)
    .order('revealed_at', { ascending: false })

  const viewerIds = (revealRows ?? []).map((r) => r.viewer_id as string)

  const viewerProfiles =
    viewerIds.length > 0
      ? (
          await supabase
            .from('profiles')
            .select('id, full_name, age, city, religion, back_photo_1_path')
            .in('id', viewerIds)
        ).data ?? []
      : []

  const thumbPaths = viewerProfiles
    .map((v) => v.back_photo_1_path)
    .filter((p): p is string => !!p)

  const thumbUrlMap: Record<string, string> = {}
  if (thumbPaths.length) {
    const { data: signed } = await supabase.storage
      .from('profile-media')
      .createSignedUrls(thumbPaths, 3600)
    for (const s of signed ?? []) {
      if (s.path && s.signedUrl) thumbUrlMap[s.path] = s.signedUrl
    }
  }

  // Video meetings
  const { data: meetingRows } = await supabase
    .from('video_meetings')
    .select('id, room_id, requester_id, recipient_id, status, created_at, preferred_date, preferred_time, message')
    .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  const meetingByOther: Record<string, string> = {}
  for (const m of meetingRows ?? []) {
    const other = m.requester_id === user.id ? m.recipient_id : m.requester_id
    meetingByOther[other] = m.room_id
  }

  const meetingOtherIds = (meetingRows ?? []).map((m) =>
    m.requester_id === user.id ? m.recipient_id : m.requester_id
  )
  const { data: meetingProfiles } =
    meetingOtherIds.length > 0
      ? await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', meetingOtherIds)
      : { data: [] }

  const nameById = Object.fromEntries(
    (meetingProfiles ?? []).map((p) => [p.id, p.full_name])
  )

  const viewers: Viewer[] = viewerProfiles.map((v) => ({
    id: v.id,
    full_name: v.full_name,
    age: v.age,
    city: v.city,
    religion: v.religion,
    thumbnail_url: v.back_photo_1_path ? (thumbUrlMap[v.back_photo_1_path] ?? null) : null,
    meeting_room_id: meetingByOther[v.id] ?? null,
    revealed_at: revealRows?.find((r) => r.viewer_id === v.id)?.revealed_at ?? '',
  }))

  const meetings = (meetingRows ?? []).map((m) => ({
    id: m.id,
    room_id: m.room_id,
    status: m.status,
    created_at: m.created_at,
    i_requested: m.requester_id === user.id,
    other_name: nameById[m.requester_id === user.id ? m.recipient_id : m.requester_id] ?? 'Member',
    preferred_date: m.preferred_date ?? null,
    preferred_time: m.preferred_time ?? null,
    message: m.message ?? null,
  }))

  const back1Url = profile.back_photo_1_path ? ownUrlMap[profile.back_photo_1_path] ?? null : null
  const back2Url = profile.back_photo_2_path ? ownUrlMap[profile.back_photo_2_path] ?? null : null
  const voiceUrl = profile.voice_path ? ownUrlMap[profile.voice_path] ?? null : null

  const personalityFields = [
    { label: 'Favourite Reels', value: profile.fav_reels },
    { label: 'YouTube Channels', value: profile.fav_youtube },
    { label: 'Web Series', value: profile.fav_web_series },
    { label: 'Travel', value: profile.fav_travel },
    { label: 'Foods', value: profile.fav_foods },
    { label: 'AI Tools', value: profile.fav_ai_tools },
  ].filter((f) => f.value)

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0d0a1a 0%, #07111f 45%, #0f0a18 100%)' }}>
      <style>{`
        @keyframes petalFall {
          0%   { transform: translateY(-40px) translateX(0px) rotate(0deg); opacity: 0; }
          5%   { opacity: 1; }
          85%  { opacity: 0.7; }
          100% { transform: translateY(105vh) translateX(var(--sway)) rotate(var(--spin)); opacity: 0; }
        }
        .petal { position:fixed; top:-40px; pointer-events:none; z-index:1; border-radius:150% 0 150% 0; animation:petalFall var(--dur) var(--delay) infinite ease-in; will-change:transform; }
        .prof-main { max-width: 860px; margin: 0 auto; padding: 5.5rem 1.5rem 5rem; }
        .prof-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 0.5rem; }
        .prof-h1 { font-size: 2rem; }
        .prof-id-badge { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.45rem 1rem; background: rgba(201,168,76,0.1); border: 1px solid rgba(201,168,76,0.35); border-radius: 8px; }
        .prof-id-code { font-size: 1.25rem; }
        .prof-personality-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .prof-revealed-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .prof-card-info { padding: 1.5rem 1.5rem 1.25rem; }
        @media (max-width: 600px) {
          .prof-main { padding: 5rem 0.75rem 7rem; }
          .prof-h1 { font-size: 1.5rem !important; }
          .prof-header { flex-direction: column; gap: 0.75rem; }
          .prof-id-badge { padding: 0.4rem 0.75rem; }
          .prof-id-code { font-size: 1rem !important; }
          .prof-personality-grid { grid-template-columns: 1fr; }
          .prof-revealed-grid { grid-template-columns: 1fr 1fr; gap: 0.6rem; }
          .prof-card-info { padding: 1rem 1rem 0.9rem; }
        }
        @media (max-width: 400px) {
          .prof-revealed-grid { grid-template-columns: 1fr; }
          .prof-main { padding: 4.5rem 0.5rem 7rem; }
        }
      `}</style>

      {/* Rose petals */}
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1, overflow: 'hidden' }}>
        {([
          { l:'3%',  w:10, h:14, col:'#ff8fab', dur:'9s',  delay:'0s',   sway:'40px',  spin:'600deg' },
          { l:'8%',  w:8,  h:12, col:'#ffb3c6', dur:'12s', delay:'1.5s', sway:'-35px', spin:'480deg' },
          { l:'15%', w:13, h:18, col:'#ff4d6d', dur:'8s',  delay:'3s',   sway:'50px',  spin:'720deg' },
          { l:'22%', w:9,  h:13, col:'#ff8fab', dur:'14s', delay:'0.5s', sway:'-45px', spin:'540deg' },
          { l:'30%', w:11, h:16, col:'#ffb3c6', dur:'10s', delay:'5s',   sway:'30px',  spin:'660deg' },
          { l:'38%', w:7,  h:11, col:'#ff6b8b', dur:'11s', delay:'2s',   sway:'-50px', spin:'420deg' },
          { l:'45%', w:14, h:19, col:'#ff4d6d', dur:'9s',  delay:'7s',   sway:'55px',  spin:'780deg' },
          { l:'52%', w:9,  h:13, col:'#ffb3c6', dur:'13s', delay:'1s',   sway:'-30px', spin:'500deg' },
          { l:'60%', w:11, h:15, col:'#ff8fab', dur:'8s',  delay:'4s',   sway:'45px',  spin:'640deg' },
          { l:'67%', w:8,  h:12, col:'#ff6b8b', dur:'15s', delay:'0s',   sway:'-55px', spin:'460deg' },
          { l:'74%', w:12, h:17, col:'#ff4d6d', dur:'10s', delay:'6s',   sway:'35px',  spin:'700deg' },
          { l:'81%', w:10, h:14, col:'#ffb3c6', dur:'11s', delay:'2.5s', sway:'-40px', spin:'560deg' },
          { l:'88%', w:8,  h:12, col:'#ff8fab', dur:'9s',  delay:'8s',   sway:'50px',  spin:'480deg' },
          { l:'94%', w:13, h:18, col:'#ff6b8b', dur:'13s', delay:'3.5s', sway:'-35px', spin:'620deg' },
          { l:'12%', w:9,  h:13, col:'#ff4d6d', dur:'11s', delay:'9s',   sway:'40px',  spin:'540deg' },
          { l:'35%', w:7,  h:11, col:'#ffb3c6', dur:'14s', delay:'4.5s', sway:'-50px', spin:'660deg' },
          { l:'57%', w:12, h:16, col:'#ff8fab', dur:'8s',  delay:'6.5s', sway:'30px',  spin:'720deg' },
          { l:'78%', w:10, h:14, col:'#ff6b8b', dur:'12s', delay:'1.8s', sway:'-45px', spin:'500deg' },
          { l:'92%', w:8,  h:12, col:'#ff4d6d', dur:'10s', delay:'7.5s', sway:'55px',  spin:'580deg' },
          { l:'48%', w:11, h:15, col:'#ffb3c6', dur:'9s',  delay:'10s',  sway:'-30px', spin:'640deg' },
        ] as const).map((p, i) => (
          <span key={i} className="petal" style={{
            left: p.l, width: `${p.w}px`, height: `${p.h}px`,
            background: `radial-gradient(ellipse at 40% 35%, ${p.col}cc, ${p.col}66)`,
            boxShadow: `0 0 4px ${p.col}44`,
            ['--dur' as string]: p.dur, ['--delay' as string]: p.delay,
            ['--sway' as string]: p.sway, ['--spin' as string]: p.spin,
          }} />
        ))}
      </div>

      {/* Ambient glow */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(201,168,76,0.06) 0%, transparent 65%), radial-gradient(ellipse 40% 30% at 20% 80%, rgba(180,40,80,0.06) 0%, transparent 60%)' }} />

      <Navigation />

      <main className="prof-main">

        {/* Header */}
        <div className="prof-header">
          <div>
            <h1 className="prof-h1" style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontWeight: 600, color: c.ivory, margin: '0 0 0.5rem' }}>
              My Profile
            </h1>
            {/* Profile ID */}
            <div className="prof-id-badge">
              <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: c.sepia }}>Profile ID</span>
              <span className="prof-id-code" style={{ fontFamily: '"Courier New", monospace', fontWeight: 900, color: c.goldLight, letterSpacing: '0.12em' }}>
                #{user.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
          </div>
          <Link href="/onboarding?edit=true"
            style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: c.goldLight, textDecoration: 'none', padding: '0.5rem 1rem', border: `1px solid rgba(201,168,76,0.35)`, borderRadius: '6px', whiteSpace: 'nowrap' }}>
            ✏ Edit Profile
          </Link>
        </div>
        <div style={{ height: '1px', background: `linear-gradient(to right, ${c.goldLight}, transparent)`, marginBottom: '1.5rem' }} />

        {/* Profile card */}
        <div style={{ background: 'rgba(26,58,92,0.25)', border: `1px solid ${c.border}`, borderRadius: '12px', overflow: 'hidden', marginBottom: '2rem', boxShadow: '0 8px 40px rgba(0,0,0,0.4)' }}>

          {/* Info section */}
          <div className="prof-card-info" style={{ borderBottom: `1px solid ${c.borderSub}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '1.8rem', fontWeight: 600, color: c.ivory, margin: 0 }}>
                {profile.full_name}
              </h2>
              {profile.id_verified ? (
                <span title="ID Verified" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#16a34a', background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.3)', borderRadius: '20px', padding: '0.25rem 0.65rem' }}>
                  ✅ ID Verified
                </span>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#f59e0b', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '20px', padding: '0.25rem 0.65rem' }}>
                  ⏳ Verification Pending
                </span>
              )}
            </div>
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.2rem', color: c.ivoryDim, margin: '0 0 0.85rem' }}>
              {profile.age} yrs · {profile.gender} · {profile.city}, {profile.country}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {[profile.religion, profile.mother_tongue, profile.education, profile.occupation, profile.marital_status, profile.has_kids]
                .filter(Boolean)
                .map((tag) => (
                  <span key={tag} style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.08em', padding: '0.3rem 0.85rem', background: 'rgba(201,168,76,0.08)', border: `1px solid rgba(201,168,76,0.18)`, borderRadius: '20px', color: c.goldLight }}>
                    {tag}
                  </span>
                ))}
            </div>
          </div>

          {/* Back photos */}
          {(back1Url || back2Url) && (
            <div style={{ display: 'grid', gridTemplateColumns: back1Url && back2Url ? '1fr 1fr' : '1fr', gap: '2px' }}>
              {[back1Url, back2Url].filter(Boolean).map((url, i) => (
                <div key={i} style={{ aspectRatio: '4/3', backgroundColor: c.navy, overflow: 'hidden' }}>
                  <img src={url!} alt={`Photo ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
              ))}
            </div>
          )}

          {/* Voice intro */}
          {voiceUrl && (
            <div style={{ padding: '1.25rem 1.5rem', borderTop: `1px solid ${c.borderSub}` }}>
              <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: c.goldLight, margin: '0 0 0.6rem' }}>
                🎙 Voice Introduction
              </p>
              <audio controls src={voiceUrl} preload="none" style={{ width: '100%', accentColor: c.goldLight }} />
            </div>
          )}
        </div>

        {/* Personality section */}
        {personalityFields.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <SectionHeader title="My Personality" count={0} />
            <div className="prof-personality-grid">
              {personalityFields.map((f) => (
                <div key={f.label} style={{ background: 'rgba(26,58,92,0.2)', border: `1px solid ${c.borderSub}`, borderRadius: '8px', padding: '0.75rem' }}>
                  <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: c.sepia, margin: '0 0 0.4rem' }}>
                    {f.label}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    {splitChips(f.value!).map((chip) => (
                      <div key={chip} style={{ display: 'flex', alignItems: 'center', padding: '0.2rem 0.55rem', background: 'rgba(201,168,76,0.08)', border: `1px solid rgba(201,168,76,0.15)`, borderRadius: '20px', minWidth: 0, overflow: 'hidden' }}>
                        {isProfileUrl(chip) ? (
                          <a href={chip} target="_blank" rel="noopener noreferrer" title={chip}
                            style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '0.85rem', color: c.goldLight, textDecoration: 'underline', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                            {shortProfileLabel(chip)}
                          </a>
                        ) : (
                          <span style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '0.85rem', color: c.ivory, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {chip}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Who revealed your photo */}
        <div style={{ marginBottom: '2rem' }}>
          <SectionHeader title="Who Revealed Your Photo" count={viewers.length} />
          {viewers.length === 0 ? (
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.95rem', color: c.sepia }}>
              No one has revealed your photo yet.
            </p>
          ) : (
            <div className="prof-revealed-grid">
              {viewers.map((v) => (
                <RevealedByCard key={v.id} viewer={v} />
              ))}
            </div>
          )}
        </div>

        {/* Video meetings */}
        <div style={{ marginBottom: '2rem' }}>
          <SectionHeader title="Video Meetings" count={meetings.length} />
          {meetings.length === 0 ? (
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.95rem', color: c.sepia }}>
              No video meeting requests yet.
            </p>
          ) : (
            <div>
              {meetings.map((m) => (
                <MeetingCard key={m.id} meeting={m} />
              ))}
            </div>
          )}
        </div>

      </main>

      <BottomNav />
    </div>
  )
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
      <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#c9a84c', margin: 0 }}>
        ✦ {title}
      </p>
      {count > 0 && (
        <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#c9a84c', color: '#0d1f3c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', fontWeight: 700 }}>
          {count}
        </span>
      )}
    </div>
  )
}
