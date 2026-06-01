'use client'

import { useState } from 'react'
import { revealPhoto } from './actions'
import { requestVideoMeeting } from '@/app/profile/actions'
import { maskName, firstNameOnly } from '@/lib/maskName'

export interface ProfileData {
  id: string
  full_name: string
  age: number
  gender: string
  city: string
  country: string
  religion: string
  mother_tongue: string
  education: string
  occupation: string
  marital_status?: string | null
  has_kids?: string | null
  id_verified?: boolean | null
  back_photo_1_url: string | null
  back_photo_2_url: string | null
  voice_url: string | null
  front_photo_url: string | null
  already_revealed: boolean
  meeting_room_id: string | null
  meeting_status: string | null
  fav_reels?: string | null
  fav_youtube?: string | null
  fav_web_series?: string | null
  fav_travel?: string | null
  fav_foods?: string | null
  fav_ai_tools?: string | null
}

const c = {
  navy: '#0d1f3c', navyMid: '#1e3358', navyLight: '#253f6a',
  ivory: '#f5f0e6', ivoryDim: '#bdb5a6',
  gold: '#8b6914', goldLight: '#c9a84c',
  border: 'rgba(201,168,76,0.28)',
}

function isPersonalityUrl(s: string): boolean {
  return /^https?:\/\//i.test(s.trim())
}

function shortPersonalityLabel(url: string): string {
  try {
    const u = new URL(url)
    const path = u.pathname.length > 22 ? u.pathname.slice(0, 22) + '…' : u.pathname
    return (u.hostname.replace('www.', '') + path).replace(/\/$/, '')
  } catch {
    return url.length > 34 ? url.slice(0, 34) + '…' : url
  }
}

function splitPersonalityChips(value: string): string[] {
  if (!value) return []
  if (value.includes(' | ')) return value.split(' | ').map(s => s.trim()).filter(Boolean)
  return value.split(',').map(s => s.trim()).filter(Boolean)
}

export default function ProfileCard({ profile, canReveal = true, canMeet = true, meetingsLeft = 0 }: {
  profile: ProfileData; canReveal?: boolean; canMeet?: boolean; meetingsLeft?: number
}) {
  const [revealed, setRevealed] = useState(profile.already_revealed)
  const [frontUrl, setFrontUrl] = useState<string | null>(profile.front_photo_url)
  const [revealing, setRevealing] = useState(false)
  const [revealMsg, setRevealMsg] = useState('')
  const [revealError, setRevealError] = useState('')
  const [roomId, setRoomId] = useState<string | null>(
    profile.meeting_status === 'accepted' ? profile.meeting_room_id : null
  )
  const [meetPending] = useState(profile.meeting_status === 'pending')
  const [requesting, setRequesting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [meetDate, setMeetDate] = useState('')
  const [meetTime, setMeetTime] = useState('18:00')
  const [meetMsg, setMeetMsg] = useState('')
  const [meetSent, setMeetSent] = useState(false)
  const [meetError, setMeetError] = useState('')
  const [buyingExtra, setBuyingExtra] = useState(false)

  const initials = profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()

  async function handleBuyExtra() {
    setBuyingExtra(true)
    try {
      // Load Razorpay script
      await new Promise<void>(resolve => {
        if ((window as Window & { Razorpay?: unknown }).Razorpay) { resolve(); return }
        const s = document.createElement('script')
        s.src = 'https://checkout.razorpay.com/v1/checkout.js'
        s.onload = () => resolve(); s.onerror = () => resolve()
        document.body.appendChild(s)
      })

      const res = await fetch('/api/create-razorpay-order', { method: 'POST' })
      const { orderId, amount, keyId } = await res.json()
      if (!orderId) throw new Error('Could not create order')

      const RazorpayClass = (window as Window & { Razorpay: new (o: Record<string, unknown>) => { open(): void } }).Razorpay
      const rzp = new RazorpayClass({
        key: keyId, order_id: orderId, amount,
        currency: 'INR', name: 'Arrange Marriage',
        description: 'Extra Video Meeting Request — ₹150',
        image: '/arrangemarriage-logo.png',
        theme: { color: '#1D5252' },
        handler: () => { window.location.reload() },
        modal: { ondismiss: () => setBuyingExtra(false) },
      })
      rzp.open()
    } catch { setBuyingExtra(false) }
  }

  async function handleReveal() {
    if (revealed || revealing) return
    setRevealing(true); setRevealError('')
    try {
      const { signedUrl } = await revealPhoto(profile.id)
      setFrontUrl(signedUrl); setRevealed(true)
      setRevealMsg(`${firstNameOnly(profile.full_name)} has been notified.`)
    } catch (err) { setRevealError(err instanceof Error ? err.message : 'Something went wrong.') }
    finally { setRevealing(false) }
  }

  async function handleRequestMeeting(e: React.FormEvent) {
    e.preventDefault()
    if (!meetDate) { setMeetError('Please select a preferred date.'); return }
    setRequesting(true)
    setMeetError('')
    try {
      await requestVideoMeeting(profile.id, meetDate, meetTime, meetMsg || `I'd love to connect with you!`)
      setMeetSent(true)
      setShowForm(false)
    } catch (err) {
      setMeetError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setRequesting(false)
    }
  }

  const tags = [profile.occupation, profile.education, profile.mother_tongue, profile.marital_status, profile.has_kids].filter(Boolean)

  return (
    <article style={{ background: c.navyMid, border: `1px solid ${c.border}`, borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,168,76,0.1)', marginBottom: '2rem' }}>
      <style>{`
        .pc-header { padding: 1.5rem 1.5rem 1.25rem; }
        .pc-name { font-size: 1.6rem; }
        .pc-meta { font-size: 1.1rem; }
        .pc-tag { font-size: 0.7rem; padding: 0.3rem 0.75rem; }
        .pc-id { font-size: 0.78rem; }
        .pc-actions { padding: 1.25rem 1.5rem; }
        @media (max-width: 500px) {
          .pc-header { padding: 1rem 1rem 0.9rem; }
          .pc-name { font-size: 1.2rem !important; }
          .pc-meta { font-size: 0.95rem !important; }
          .pc-tag { font-size: 0.62rem !important; padding: 0.2rem 0.5rem !important; }
          .pc-id { font-size: 0.65rem !important; }
          .pc-actions { padding: 0.85rem 1rem; }
        }
      `}</style>

      {/* Header */}
      <div className="pc-header" style={{ borderBottom: `1px solid rgba(201,168,76,0.08)` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
              <h2 className="pc-name" style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontWeight: 600, color: c.ivory, margin: 0 }}>
                {maskName(profile.full_name)}
              </h2>
              {profile.id_verified && (
                <span title="ID Verified" style={{ fontSize: '1rem', flexShrink: 0, lineHeight: 1, color: '#16a34a' }}>✅</span>
              )}
              <span className="pc-id" style={{ fontFamily: '"Courier New", monospace', fontWeight: 700, color: c.goldLight, background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', padding: '0.18rem 0.5rem', borderRadius: '4px', letterSpacing: '0.08em', flexShrink: 0 }}>
                #{profile.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
            <p className="pc-meta" style={{ fontFamily: '"Cormorant Garamond", serif', color: c.ivoryDim, margin: 0 }}>
              {profile.age} yrs · {profile.city}, {profile.country}
            </p>
          </div>
          <span className="pc-tag" style={{ fontFamily: 'Raleway, sans-serif', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', background: 'rgba(201,168,76,0.08)', border: `1px solid ${c.border}`, color: c.goldLight, borderRadius: '20px', flexShrink: 0, whiteSpace: 'nowrap' }}>
            {profile.religion}
          </span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {tags.map(tag => (
            <span key={tag} className="pc-tag" style={{ fontFamily: 'Raleway, sans-serif', letterSpacing: '0.06em', background: 'rgba(14,26,53,0.7)', border: '1px solid rgba(201,168,76,0.15)', color: c.ivoryDim, borderRadius: '4px' }}>
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Back Photos */}
      {profile.back_photo_1_url || profile.back_photo_2_url ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' }}>
          {[profile.back_photo_1_url, profile.back_photo_2_url].map((url, i) =>
            url ? (
              <div key={i} style={{ aspectRatio: '4/3', background: c.navy, overflow: 'hidden' }}>
                <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
            ) : null
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' }}>
          {[0, 1].map(i => (
            <div key={i} style={{ aspectRatio: '4/3', background: `linear-gradient(135deg, #152d4e 0%, #1e3d66 100%)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
              <span style={{ fontFamily: '"Playfair Display", serif', fontSize: '2rem', fontStyle: 'italic', color: 'rgba(201,168,76,0.3)' }}>{initials}</span>
              <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.2)' }}>Photo coming soon</span>
            </div>
          ))}
        </div>
      )}

      {/* Voice */}
      {profile.voice_url && (
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(201,168,76,0.07)' }}>
          <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: c.goldLight, margin: '0 0 0.5rem' }}>🎙 Voice Introduction</p>
          <audio controls src={profile.voice_url} preload="none" style={{ width: '100%', accentColor: c.goldLight }} />
        </div>
      )}

      {/* Personality section */}
      {[
        { icon: '🎬', label: 'Favourite Reels',    value: profile.fav_reels },
        { icon: '▶️', label: 'YouTube Channels',    value: profile.fav_youtube },
        { icon: '📺', label: 'Web Series',          value: profile.fav_web_series },
        { icon: '✈️', label: 'Travel',              value: profile.fav_travel },
        { icon: '🍽️', label: 'Favourite Foods',     value: profile.fav_foods },
        { icon: '🤖', label: 'AI Tools',            value: profile.fav_ai_tools },
      ].some(p => p.value) && (
        <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid rgba(201,168,76,0.07)' }}>
          <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: c.goldLight, margin: '0 0 1rem' }}>✦ Personality &amp; Interests</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { icon: '🎬', label: 'Favourite Reels',       value: profile.fav_reels },
              { icon: '▶️', label: 'Favourite YouTube',      value: profile.fav_youtube },
              { icon: '📺', label: 'Favourite Web Series',   value: profile.fav_web_series },
              { icon: '✈️', label: 'Favourite Travel',       value: profile.fav_travel },
              { icon: '🍽️', label: 'Favourite Foods',        value: profile.fav_foods },
              { icon: '🤖', label: 'Favourite AI Tools',     value: profile.fav_ai_tools },
            ].filter(p => p.value).map(p => (
              <div key={p.label} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                <span style={{ fontSize: '1.1rem', flexShrink: 0, marginTop: '0.1rem' }}>{p.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: c.goldLight, margin: '0 0 0.35rem' }}>{p.label}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    {splitPersonalityChips(p.value!).map((tag, i) => (
                      isPersonalityUrl(tag) ? (
                        <a key={i} href={tag} target="_blank" rel="noopener noreferrer" title={tag}
                          style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1rem', color: '#7fb3f5', textDecoration: 'underline', padding: '0.25rem 0.75rem', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: '20px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                          {shortPersonalityLabel(tag)}
                        </a>
                      ) : (
                        <span key={i} style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1rem', color: c.ivory, padding: '0.25rem 0.75rem', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: '20px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }}>
                          {tag}
                        </span>
                      )
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gold divider */}
      <div style={{ height: '1px', margin: '0 1.5rem', background: `linear-gradient(to right, transparent, ${c.border}, transparent)` }} />

      {/* Reveal section */}
      <div style={{ padding: '1.25rem 1.5rem' }}>
        {!canReveal && !revealed ? (
          <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(90,110,130,0.1)', border: '1px solid rgba(90,110,130,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', margin: '0 auto 0.5rem' }}>🔒</div>
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.9rem', color: c.ivoryDim, margin: '0 0 0.75rem' }}>Face reveal requires a paid plan</p>
            <a href="/pricing" style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: c.goldLight, textDecoration: 'none', border: `1px solid ${c.border}`, padding: '0.5rem 1.25rem', borderRadius: '4px' }}>
              Upgrade Plan →
            </a>
          </div>
        ) : !profile.front_photo_url && !revealed && canReveal ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(201,168,76,0.06)', border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', margin: '0 auto 0.5rem' }}>🔒</div>
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.9rem', color: c.ivoryDim, margin: 0 }}>
              {firstNameOnly(profile.full_name)} hasn&apos;t uploaded their reveal photo yet
            </p>
          </div>
        ) : revealed && frontUrl ? (
          <div>
            <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: c.goldLight, textAlign: 'center', margin: '0 0 0.75rem' }}>✦ Reveal Photo</p>
            <div style={{ borderRadius: '10px', overflow: 'hidden', aspectRatio: '3/4' }}>
              <img src={frontUrl} alt={profile.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
            {revealMsg && (
              <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.9rem', color: c.ivoryDim, textAlign: 'center', margin: '0.75rem 0 0', padding: '0.65rem', background: 'rgba(201,168,76,0.06)', borderRadius: '4px' }}>
                ✓ {revealMsg}
              </p>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(201,168,76,0.06)', border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', margin: '0 auto 0.75rem' }}>🔒</div>
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.9rem', color: c.ivoryDim, margin: '0 0 0.75rem' }}>
              Face photo is hidden. Revealing notifies {firstNameOnly(profile.full_name)} instantly.
            </p>
            {revealError && <p style={{ color: '#F87171', fontSize: '0.85rem', margin: '0 0 0.5rem' }}>{revealError}</p>}
            <button onClick={handleReveal} disabled={revealing}
              style={{ width: '100%', padding: '0.75rem', background: 'transparent', border: `1px solid ${c.goldLight}`, color: c.goldLight, fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: revealing ? 'default' : 'pointer', borderRadius: '6px', transition: 'all 0.2s', opacity: revealing ? 0.6 : 1 }}>
              {revealing ? 'Revealing…' : '🔓 Reveal Photo'}
            </button>
          </div>
        )}

        {/* Meeting section */}
        <div style={{ marginTop: '0.75rem' }}>
          {!canMeet ? (
            <a href="/pricing" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '0.75rem', borderRadius: '6px', fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: c.ivoryDim, border: '1px solid rgba(90,110,130,0.2)', textDecoration: 'none', background: 'rgba(90,110,130,0.05)', boxSizing: 'border-box' }}>
              🔒 Upgrade to request meetings
            </a>
          ) : canMeet && meetingsLeft === 0 && !roomId && !meetPending && !meetSent ? (
            <div style={{ textAlign: 'center', padding: '1rem 1.25rem', background: 'rgba(201,168,76,0.04)', border: `1px solid rgba(201,168,76,0.2)`, borderRadius: '8px' }}>
              <div style={{ fontSize: '1.4rem', marginBottom: '0.4rem' }}>📅</div>
              <p style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '1rem', fontWeight: 600, color: c.ivory, margin: '0 0 0.3rem' }}>
                No meeting requests left
              </p>
              <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.9rem', color: c.ivoryDim, margin: '0 0 0.9rem', lineHeight: 1.5 }}>
                You&apos;ve used all your meeting requests this month. Buy one extra request to connect with {firstNameOnly(profile.full_name)}.
              </p>
              <button onClick={handleBuyExtra} disabled={buyingExtra}
                style={{ width: '100%', padding: '0.75rem', background: buyingExtra ? 'rgba(201,168,76,0.3)' : `linear-gradient(135deg, #e8c876, ${c.goldLight})`, color: c.navy, fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', border: 'none', borderRadius: '6px', cursor: buyingExtra ? 'default' : 'pointer' }}>
                {buyingExtra ? 'Redirecting…' : '✦ Buy Extra Request — ₹150'}
              </button>
            </div>
          ) : roomId ? (
            <a href={`https://meet.jit.si/ArrangeMarriage-${roomId}`} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '0.75rem', borderRadius: '6px', fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: c.navy, background: `linear-gradient(135deg, #e8c876, ${c.goldLight})`, textDecoration: 'none', boxSizing: 'border-box', boxShadow: '0 4px 16px rgba(201,168,76,0.25)' }}>
              🎥 Join Meeting
            </a>
          ) : meetPending && !meetSent ? (
            <div style={{ textAlign: 'center', padding: '0.75rem', background: 'rgba(201,168,76,0.06)', border: `1px solid ${c.border}`, borderRadius: '6px' }}>
              <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.95rem', color: c.ivoryDim, margin: 0 }}>
                ✓ Your meeting request has been successfully sent to <strong style={{ color: c.goldLight, fontStyle: 'normal' }}>{maskName(profile.full_name)}</strong> and is waiting for their confirmation.
              </p>
            </div>
          ) : meetSent ? (
            <div style={{ textAlign: 'center', padding: '1rem 1.25rem', background: 'rgba(201,168,76,0.06)', border: `1px solid ${c.border}`, borderRadius: '8px' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>✅</div>
              <p style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '1rem', fontWeight: 600, color: c.ivory, margin: '0 0 0.35rem' }}>
                Request Sent!
              </p>
              <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.95rem', color: c.ivoryDim, margin: 0, lineHeight: 1.5 }}>
                Your meeting request has been successfully sent to <strong style={{ color: c.goldLight, fontStyle: 'normal' }}>{maskName(profile.full_name)}</strong> and is waiting for their confirmation.
              </p>
            </div>
          ) : showForm ? (
            <form onSubmit={handleRequestMeeting} style={{ background: 'rgba(14,26,53,0.6)', border: `1px solid ${c.border}`, borderRadius: '8px', padding: '1rem' }}>
              <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: c.goldLight, margin: '0 0 0.75rem' }}>📅 Request Meeting with {firstNameOnly(profile.full_name)}</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.65rem' }}>
                <div>
                  <label style={{ display: 'block', fontFamily: 'Raleway, sans-serif', fontSize: '0.55rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: c.ivoryDim, marginBottom: '0.3rem' }}>Date</label>
                  <input type="date" required value={meetDate} onChange={e => setMeetDate(e.target.value)} min={new Date().toISOString().split('T')[0]}
                    style={{ width: '100%', padding: '0.5rem', background: 'rgba(14,26,53,0.8)', border: `1px solid rgba(201,168,76,0.2)`, color: c.ivory, fontFamily: '"Cormorant Garamond", serif', fontSize: '0.9rem', borderRadius: '4px', outline: 'none', boxSizing: 'border-box', colorScheme: 'dark' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontFamily: 'Raleway, sans-serif', fontSize: '0.55rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: c.ivoryDim, marginBottom: '0.3rem' }}>Time</label>
                  <input type="time" required value={meetTime} onChange={e => setMeetTime(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', background: 'rgba(14,26,53,0.8)', border: `1px solid rgba(201,168,76,0.2)`, color: c.ivory, fontFamily: '"Cormorant Garamond", serif', fontSize: '0.9rem', borderRadius: '4px', outline: 'none', boxSizing: 'border-box', colorScheme: 'dark' }} />
                </div>
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', fontFamily: 'Raleway, sans-serif', fontSize: '0.55rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: c.ivoryDim, marginBottom: '0.3rem' }}>Message</label>
                <textarea value={meetMsg} onChange={e => setMeetMsg(e.target.value)} placeholder={`Hi ${firstNameOnly(profile.full_name)}, I'd love to connect…`} rows={2}
                  style={{ width: '100%', padding: '0.5rem', background: 'rgba(14,26,53,0.8)', border: `1px solid rgba(201,168,76,0.2)`, color: c.ivory, fontFamily: '"Cormorant Garamond", serif', fontSize: '0.95rem', fontStyle: 'italic', borderRadius: '4px', outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
              </div>

              {meetError && (
                <div style={{ marginBottom: '0.65rem', padding: '0.5rem 0.75rem', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: '4px', color: '#f87171', fontFamily: '"Cormorant Garamond", serif', fontSize: '0.9rem' }}>
                  {meetError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" disabled={requesting || !meetDate}
                  style={{ flex: 1, padding: '0.65rem', background: `linear-gradient(135deg, #e8c876, ${c.goldLight})`, color: c.navy, border: 'none', fontFamily: 'Raleway, sans-serif', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: requesting ? 'default' : 'pointer', borderRadius: '4px', opacity: (requesting || !meetDate) ? 0.7 : 1 }}>
                  {requesting ? 'Sending…' : 'Send Request'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ padding: '0.65rem 1rem', background: 'transparent', border: `1px solid rgba(201,168,76,0.2)`, color: c.ivoryDim, fontFamily: 'Raleway, sans-serif', fontSize: '0.62rem', cursor: 'pointer', borderRadius: '4px' }}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div>
              <button onClick={() => setShowForm(true)}
                style={{ width: '100%', padding: '0.75rem', background: 'transparent', border: `1px solid rgba(201,168,76,0.3)`, color: c.goldLight, fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: '6px' }}>
                📅 Request Video Meeting
              </button>
              <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.55rem', color: c.ivoryDim, textAlign: 'center', margin: '0.4rem 0 0', letterSpacing: '0.06em' }}>
                {meetingsLeft} meeting request{meetingsLeft !== 1 ? 's' : ''} remaining this month
              </p>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
