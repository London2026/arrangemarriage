'use client'

import { useState } from 'react'
import { revealPhoto, reportProfile, toggleSaveProfile, blockMember, toggleLikeProfile } from './actions'
import { requestVideoMeeting } from '@/app/profile/actions'
import { maskName, firstNameOnly } from '@/lib/maskName'

const REPORT_REASONS = ['Fake profile', 'Inappropriate content', 'Harassment or abuse', 'Spam', 'Other']

export interface ProfileData {
  id: string
  full_name: string
  age: number
  gender: string
  city: string
  country: string
  religion: string
  caste?: string | null
  mother_tongue: string
  education: string
  university_name?: string | null
  education_subject?: string | null
  other_qualifications?: string | null
  occupation: string
  occupation_city?: string | null
  annual_salary?: string | null
  marital_status?: string | null
  has_kids?: string | null
  id_verified?: boolean | null
  height?: string | null
  weight?: string | null
  rashi?: string | null
  brothers?: string | null
  sisters?: string | null
  father_occupation?: string | null
  mother_occupation?: string | null
  housing?: string | null
  disability?: string | null
  food_habits?: string | null
  smoking?: string | null
  alcohol?: string | null
  hobby?: string | null
  back_photo_1_url: string | null
  back_photo_2_url: string | null
  voice_url: string | null
  voice_en_url?: string | null
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
  pref_gender?: string | null
  pref_age_min?: number | null
  pref_age_max?: number | null
  pref_religion?: string | null
  pref_caste?: string | null
  pref_location?: string | null
  pref_education?: string | null
  pref_height?: string | null
  pref_cooking?: string | null
  pref_other?: string | null
  plan?: string | null
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

function splitChips(value: string): string[] {
  if (!value) return []
  if (value.includes(' | ')) return value.split(' | ').map(s => s.trim()).filter(Boolean)
  return value.split(',').map(s => s.trim()).filter(Boolean)
}

// Section heading
function SectionHead({ icon, title }: { icon: string; title: string }) {
  return (
    <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.95rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: c.goldLight, margin: '0 0 1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span style={{ fontSize: '1.2rem' }}>{icon}</span>{title}
    </p>
  )
}

// Key-value row
function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.9rem' }}>
      <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.95rem', fontWeight: 600, letterSpacing: '0.02em', color: c.ivoryDim, minWidth: '185px', flexShrink: 0 }}>{label}</span>
      <span style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.35rem', color: c.ivory, lineHeight: 1.5 }}>{value}</span>
    </div>
  )
}

export default function ProfileCard({ profile, canReveal = true, canMeet = true, meetingsLeft = 0, isOwnProfile = false, isSaved = false, isLiked = false, hasMutualLike = false, likesLeft = 0, onToggleSave, onToggleLike, onBlock }: {
  profile: ProfileData; canReveal?: boolean; canMeet?: boolean; meetingsLeft?: number; isOwnProfile?: boolean; isSaved?: boolean; isLiked?: boolean; hasMutualLike?: boolean; likesLeft?: number; onToggleSave?: (saved: boolean) => void; onToggleLike?: (liked: boolean) => void; onBlock?: () => void
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
  const [meetFamilyMember, setMeetFamilyMember] = useState('')
  const [meetMsg, setMeetMsg] = useState('')
  const [meetSent, setMeetSent] = useState(false)
  const [meetError, setMeetError] = useState('')
  const [buyingExtra, setBuyingExtra] = useState(false)
  const [saved, setSaved] = useState(isSaved)
  const [savingToggle, setSavingToggle] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDetails, setReportDetails] = useState('')
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const [reportDone, setReportDone] = useState(false)
  const [reportError, setReportError] = useState('')
  const [blockStep, setBlockStep] = useState<'idle' | 'confirm' | 'loading'>('idle')
  const [likingToggle, setLikingToggle] = useState(false)
  const [likeError, setLikeError] = useState('')

  async function handleToggleSave() {
    if (savingToggle) return
    setSavingToggle(true)
    const next = !saved
    setSaved(next)
    onToggleSave?.(next)
    try {
      await toggleSaveProfile(profile.id)
    } catch {
      setSaved(!next)
      onToggleSave?.(!next)
    } finally { setSavingToggle(false) }
  }

  async function handleReport(e: React.FormEvent) {
    e.preventDefault()
    if (!reportReason) return
    setReportSubmitting(true); setReportError('')
    try {
      await reportProfile(profile.id, reportReason, reportDetails)
      setReportDone(true); setShowReport(false)
    } catch (err) {
      setReportError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally { setReportSubmitting(false) }
  }

  async function handleToggleLike() {
    if (likingToggle || isOwnProfile) return
    if (!isLiked && likesLeft === 0) {
      setLikeError('You have no likes remaining this month. Upgrade your plan for more likes.')
      return
    }
    setLikingToggle(true)
    setLikeError('')
    const next = !isLiked
    onToggleLike?.(next)
    try {
      await toggleLikeProfile(profile.id)
    } catch (err) {
      onToggleLike?.(!next)
      setLikeError(err instanceof Error ? err.message : 'Could not like profile. Please try again.')
    } finally { setLikingToggle(false) }
  }

  async function handleBlock() {
    setBlockStep('loading')
    try {
      await blockMember(profile.id)
      onBlock?.()
    } catch {
      setBlockStep('idle')
    }
  }

  const initials = profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
  const firstName = firstNameOnly(profile.full_name)

  async function handleBuyExtra() {
    setBuyingExtra(true)
    try {
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
      setRevealMsg(`${firstName} has been notified that you viewed their photo.`)
    } catch (err) { setRevealError(err instanceof Error ? err.message : 'Something went wrong.') }
    finally { setRevealing(false) }
  }

  async function handleRequestMeeting(e: React.FormEvent) {
    e.preventDefault()
    if (!meetDate) { setMeetError('Please select a preferred date.'); return }
    setRequesting(true); setMeetError('')
    try {
      await requestVideoMeeting(profile.id, meetDate, meetTime, meetMsg || `I'd love to connect with you!`, meetFamilyMember)
      setMeetSent(true); setShowForm(false)
    } catch (err) {
      setMeetError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally { setRequesting(false) }
  }

  return (
    <article style={{ background: c.navyMid, border: `1px solid ${c.border}`, borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.6)', marginBottom: '2rem' }}>
      <style>{`
        .pc-header { padding: 2rem 2rem 1.5rem; }
        .pc-name { font-size: 2.3rem; }
        .pc-meta { font-size: 1.35rem; }
        .pc-tag { font-size: 1rem; padding: 0.45rem 1.1rem; }
        .pc-id { font-size: 1rem; }
        .pc-section { padding: 1.5rem 2rem; border-top: 1px solid rgba(201,168,76,0.07); }
        .pc-actions { padding: 1.5rem 2rem; }
        @media (max-width: 600px) {
          .pc-header { padding: 1.2rem 1.2rem 1rem; }
          .pc-name { font-size: 1.5rem !important; }
          .pc-meta { font-size: 1.05rem !important; }
          .pc-tag { font-size: 0.75rem !important; padding: 0.28rem 0.65rem !important; }
          .pc-id { font-size: 0.75rem !important; }
          .pc-section { padding: 1.1rem 1.2rem; }
          .pc-actions { padding: 1.1rem 1.2rem; }
        }
      `}</style>

      {/* ── Header ── */}
      <div className="pc-header" style={{ borderBottom: `1px solid rgba(201,168,76,0.08)` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
              <h2 className="pc-name" style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontWeight: 600, color: c.ivory, margin: 0 }}>
                {maskName(profile.full_name)}
              </h2>
              {profile.id_verified && <span title="ID Verified" style={{ fontSize: '1rem', flexShrink: 0, color: '#16a34a' }}>✅</span>}
              <span className="pc-id" style={{ fontFamily: '"Courier New", monospace', fontWeight: 700, color: c.goldLight, background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', padding: '0.18rem 0.5rem', borderRadius: '4px', letterSpacing: '0.08em', flexShrink: 0 }}>
                AM-{profile.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
            <p className="pc-meta" style={{ fontFamily: '"Cormorant Garamond", serif', color: c.ivoryDim, margin: 0 }}>
              {profile.age} yrs · {profile.gender} · {profile.city}, {profile.country}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'flex-start' }}>
            {[profile.religion, profile.caste].filter(Boolean).map(tag => (
              <span key={tag} className="pc-tag" style={{ fontFamily: 'Raleway, sans-serif', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', background: 'rgba(201,168,76,0.12)', border: `1px solid ${c.border}`, color: c.goldLight, borderRadius: '20px' }}>
                {tag}
              </span>
            ))}
            {!isOwnProfile && (
              <>
                {/* Like button — gateway to video meetings */}
                <button
                  onClick={handleToggleLike}
                  title={isLiked ? 'Unlike this profile' : likesLeft === 0 ? 'No likes remaining this month' : 'Like this profile to unlock video meetings'}
                  disabled={likingToggle}
                  style={{ background: isLiked ? 'rgba(248,113,113,0.12)' : 'none', border: `1px solid ${isLiked ? 'rgba(248,113,113,0.5)' : 'rgba(201,168,76,0.18)'}`, borderRadius: '8px', cursor: likingToggle ? 'default' : 'pointer', fontSize: '1.1rem', padding: '0.5rem 0.7rem', lineHeight: 1, minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', transition: 'all 0.15s', opacity: likingToggle ? 0.5 : 1 }}
                >
                  <span>{isLiked ? '❤️' : '🤍'}</span>
                  {isLiked && hasMutualLike && <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.06em', color: '#f87171', textTransform: 'uppercase' }}>Mutual</span>}
                </button>
                <button
                  onClick={handleToggleSave}
                  title={saved ? 'Remove from saved' : 'Save profile'}
                  style={{ background: saved ? 'rgba(201,168,76,0.12)' : 'none', border: `1px solid ${saved ? c.goldLight : 'rgba(201,168,76,0.4)'}`, borderRadius: '8px', cursor: savingToggle ? 'default' : 'pointer', fontSize: '1.2rem', padding: '0.5rem', lineHeight: 1, minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.15s, opacity 0.15s', opacity: savingToggle ? 0.5 : 1, color: saved ? c.goldLight : c.ivoryDim }}
                >
                  {saved ? '★' : '☆'}
                </button>
                {reportDone ? (
                  <span title="Reported" style={{ fontSize: '0.7rem', color: '#9ca3af', fontFamily: 'Raleway, sans-serif', padding: '0.3rem 0', letterSpacing: '0.05em' }}>Reported</span>
                ) : (
                  <button
                    onClick={() => setShowReport(v => !v)}
                    title="Report this profile"
                    style={{ background: showReport ? 'rgba(248,113,113,0.12)' : 'none', border: `1px solid ${showReport ? 'rgba(248,113,113,0.5)' : 'rgba(201,168,76,0.4)'}`, borderRadius: '8px', cursor: 'pointer', color: showReport ? '#f87171' : c.ivoryDim, fontSize: '1rem', padding: '0.5rem', lineHeight: 1, minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.15s' }}
                  >
                    ⚑
                  </button>
                )}
                <button
                  onClick={() => setBlockStep('confirm')}
                  title="Block this member"
                  disabled={blockStep === 'loading'}
                  style={{ background: blockStep !== 'idle' ? 'rgba(248,113,113,0.12)' : 'none', border: `1px solid ${blockStep !== 'idle' ? 'rgba(248,113,113,0.5)' : 'rgba(201,168,76,0.4)'}`, borderRadius: '8px', cursor: blockStep === 'loading' ? 'default' : 'pointer', color: blockStep !== 'idle' ? '#f87171' : c.ivoryDim, fontSize: '1rem', padding: '0.5rem', lineHeight: 1, minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.15s', opacity: blockStep === 'loading' ? 0.5 : 1 }}
                >
                  🚫
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Report panel ── */}
      {showReport && !isOwnProfile && (
        <div style={{ background: 'rgba(158,42,43,0.06)', border: '1px solid rgba(158,42,43,0.2)', borderTop: 'none', padding: '1rem 1.25rem' }}>
          <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#f87171', margin: '0 0 0.75rem' }}>
            Report Profile
          </p>
          <form onSubmit={handleReport}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
              {REPORT_REASONS.map(r => (
                <button key={r} type="button" onClick={() => setReportReason(r)}
                  style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.05em', padding: '0.5rem 0.85rem', borderRadius: '20px', border: '1px solid', cursor: 'pointer', minHeight: '36px',
                    background: reportReason === r ? 'rgba(248,113,113,0.15)' : 'transparent',
                    borderColor: reportReason === r ? '#f87171' : 'rgba(248,113,113,0.25)',
                    color: reportReason === r ? '#f87171' : '#9ca3af',
                  }}>
                  {r}
                </button>
              ))}
            </div>
            <textarea
              value={reportDetails}
              onChange={e => setReportDetails(e.target.value)}
              placeholder="Additional details (optional)"
              rows={2}
              style={{ width: '100%', background: 'rgba(14,26,53,0.6)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '6px', color: '#e8e3d8', fontFamily: '"Cormorant Garamond", serif', fontSize: '0.95rem', padding: '0.5rem 0.75rem', resize: 'none', outline: 'none', boxSizing: 'border-box', marginBottom: '0.65rem' }}
            />
            {reportError && <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', color: '#f87171', margin: '0 0 0.5rem' }}>{reportError}</p>}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" disabled={!reportReason || reportSubmitting}
                style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.45rem 1rem', borderRadius: '4px', border: 'none', cursor: !reportReason || reportSubmitting ? 'default' : 'pointer', background: !reportReason || reportSubmitting ? 'rgba(248,113,113,0.2)' : '#9e2a2b', color: '#fecaca' }}>
                {reportSubmitting ? 'Submitting…' : 'Submit Report'}
              </button>
              <button type="button" onClick={() => setShowReport(false)}
                style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.45rem 0.75rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', background: 'transparent', color: '#9ca3af' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Block confirm panel ── */}
      {blockStep === 'confirm' && !isOwnProfile && (
        <div style={{ background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.2)', borderTop: 'none', padding: '1rem 1.25rem' }}>
          <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#f87171', margin: '0 0 0.5rem' }}>
            Block Member
          </p>
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1rem', color: '#bdb5a6', margin: '0 0 0.85rem', lineHeight: 1.6 }}>
            This member will no longer appear in your Discover and cannot send you meeting requests. You can unblock them from your Profile page.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handleBlock}
              style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.45rem 1rem', borderRadius: '4px', border: 'none', cursor: 'pointer', background: '#9e2a2b', color: '#fecaca' }}>
              Confirm Block
            </button>
            <button type="button" onClick={() => setBlockStep('idle')}
              style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.45rem 0.75rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', background: 'transparent', color: '#9ca3af' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Like error ── */}
      {likeError && (
        <div style={{ background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.2)', borderTop: 'none', padding: '0.65rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '0.95rem', color: '#f87171', margin: 0 }}>{likeError}</p>
          <button onClick={() => setLikeError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', fontSize: '0.9rem', padding: '0.2rem', flexShrink: 0 }}>✕</button>
        </div>
      )}

      {/* ── Back Photos ── */}
      {profile.back_photo_1_url || profile.back_photo_2_url ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' }}>
          {[profile.back_photo_1_url, profile.back_photo_2_url].map((url, i) =>
            url ? (
              <div key={i} style={{ aspectRatio: '3/4', background: c.navy, overflow: 'hidden' }}>
                <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
            ) : null
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' }}>
          {[0, 1].map(i => (
            <div key={i} style={{ aspectRatio: '3/4', background: 'linear-gradient(135deg, #152d4e, #1e3d66)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: '"Playfair Display", serif', fontSize: '2rem', fontStyle: 'italic', color: 'rgba(201,168,76,0.3)' }}>{initials}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Voice Introduction ── */}
      {(profile.voice_url || profile.voice_en_url) && (
        <div className="pc-section" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <SectionHead icon="🎙" title="Voice Introduction" />
          {profile.voice_url && (
            <div>
              <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: c.ivoryDim, margin: '0 0 0.35rem' }}>🇮🇳 Mother Tongue</p>
              <audio controls src={profile.voice_url} preload="none" style={{ width: '100%', accentColor: c.goldLight }} />
            </div>
          )}
          {profile.voice_en_url && (
            <div>
              <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: c.ivoryDim, margin: '0 0 0.35rem' }}>🇬🇧 English</p>
              <audio controls src={profile.voice_en_url} preload="none" style={{ width: '100%', accentColor: c.goldLight }} />
            </div>
          )}
        </div>
      )}

      {/* ── Personal Details ── */}
      <div className="pc-section">
        <SectionHead icon="👤" title="Personal Details" />
        <Row label="Mother Tongue" value={profile.mother_tongue} />
        <Row label="Height" value={profile.height} />
        <Row label="Weight" value={profile.weight} />
        <Row label="Rashi / Zodiac Sign" value={profile.rashi} />
        <Row label="Marital Status" value={profile.marital_status} />
        <Row label="Children" value={profile.has_kids} />
        <Row label="Disability" value={profile.disability} />
      </div>

      {/* ── Education & Career ── */}
      <div className="pc-section">
        <SectionHead icon="🎓" title="Education & Career" />
        <Row label="Education Level" value={profile.education} />
        <Row label="University / College" value={profile.university_name} />
        <Row label="Subject / Specialisation" value={profile.education_subject} />
        <Row label="Other Qualifications" value={profile.other_qualifications} />
        <Row label="Occupation" value={profile.occupation} />
        <Row label="City of Work" value={profile.occupation_city} />
        <Row label="Annual Salary" value={profile.annual_salary} />
      </div>

      {/* ── Family Background ── */}
      <div className="pc-section">
        <SectionHead icon="🏠" title="Family Background" />
        <Row label="No. of Brothers" value={profile.brothers} />
        <Row label="No. of Sisters" value={profile.sisters} />
        <Row label="Father's Occupation" value={profile.father_occupation} />
        <Row label="Mother's Occupation" value={profile.mother_occupation} />
        <Row label="Housing" value={profile.housing} />
      </div>

      {/* ── Lifestyle ── */}
      <div className="pc-section">
        <SectionHead icon="🌿" title="Lifestyle" />
        <Row label="Food Habits" value={profile.food_habits} />
        <Row label="Smoking" value={profile.smoking} />
        <Row label="Alcohol" value={profile.alcohol} />
        <Row label="Hobbies & Interests" value={profile.hobby} />
      </div>

      {/* ── Looking For ── */}
      {(profile.pref_gender || profile.pref_age_min || profile.pref_religion || profile.pref_caste || profile.pref_location || profile.pref_education || profile.pref_height || profile.pref_cooking || profile.pref_other) && (
        <div className="pc-section">
          <SectionHead icon="💑" title="Looking For" />
          <Row label="Gender" value={profile.pref_gender} />
          <Row label="Age Range" value={
            (profile.pref_age_min || profile.pref_age_max)
              ? `${profile.pref_age_min ?? 18} – ${profile.pref_age_max ?? 60} years`
              : null
          } />
          <Row label="Religion" value={profile.pref_religion} />
          <Row label="Caste" value={profile.pref_caste} />
          <Row label="Location" value={profile.pref_location} />
          <Row label="Education" value={profile.pref_education} />
          <Row label="Preferred Height" value={profile.pref_height} />
          <Row label="Cooking" value={profile.pref_cooking} />
          {profile.pref_other && (
            <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: 'rgba(201,168,76,0.05)', border: `1px solid rgba(201,168,76,0.15)`, borderRadius: '6px' }}>
              <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: c.ivoryDim, margin: '0 0 0.4rem' }}>Other Preferences</p>
              <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1rem', color: c.ivory, margin: 0, lineHeight: 1.6 }}>{profile.pref_other}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Personality & Interests ── */}
      {[profile.fav_reels, profile.fav_youtube, profile.fav_web_series, profile.fav_travel, profile.fav_foods, profile.fav_ai_tools].some(Boolean) && (
        <div className="pc-section">
          <SectionHead icon="✦" title="Personality & Interests" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { icon: '🎬', label: 'My Favourite Reels',           value: profile.fav_reels },
              { icon: '▶️', label: 'My Favourite YouTube Channel',  value: profile.fav_youtube },
              { icon: '📺', label: 'My Favourite Web Series',       value: profile.fav_web_series },
              { icon: '✈️', label: 'My Favourite Travel',           value: profile.fav_travel },
              { icon: '🍽️', label: 'My Favourite Foods',            value: profile.fav_foods },
              { icon: '🤖', label: 'My Favourite AI Tools',         value: profile.fav_ai_tools },
            ].filter(p => p.value).map(p => (
              <div key={p.label} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                <span style={{ fontSize: '1.1rem', flexShrink: 0, marginTop: '0.1rem' }}>{p.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: c.goldLight, margin: '0 0 0.4rem' }}>{p.label}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    {splitChips(p.value!).map((tag, i) => (
                      isPersonalityUrl(tag) ? (
                        <a key={i} href={tag} target="_blank" rel="noopener noreferrer"
                          style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.15rem', color: '#7fb3f5', textDecoration: 'underline', padding: '0.25rem 0.75rem', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: '20px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                          {shortPersonalityLabel(tag)}
                        </a>
                      ) : (
                        <span key={i} style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.15rem', color: c.ivory, padding: '0.3rem 0.85rem', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: '20px', display: 'inline-block' }}>
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

      {/* ── Face Photo (blurred until revealed) ── */}
      <div className="pc-section">
        <SectionHead icon="📸" title="Face Photo" />

        {isOwnProfile && frontUrl ? (
          /* Own profile — show blurred with explanation */
          <div>
            <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', aspectRatio: '3/4' }}>
              <img src={frontUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'blur(22px)', transform: 'scale(1.1)' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(7,17,31,0.55)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '1.5rem' }}>
                <span style={{ fontSize: '2.5rem' }}>🔒</span>
                <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.1rem', color: c.ivory, textAlign: 'center', margin: 0, fontStyle: 'italic' }}>Your face photo — blurred as others see it</p>
              </div>
            </div>
            <div style={{ marginTop: '0.85rem', padding: '1rem 1.1rem', background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '8px' }}>
              <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.05rem', color: c.ivoryDim, margin: 0, lineHeight: 1.7 }}>
                This is exactly how other members see your face photo — blurred until they choose to reveal it. When they click &ldquo;Reveal Face Photo&rdquo;, you will be notified immediately.
              </p>
            </div>
          </div>
        ) : !frontUrl ? (
          /* No photo uploaded */
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(201,168,76,0.06)', border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', margin: '0 auto 0.75rem' }}>📷</div>
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1rem', color: c.ivoryDim, margin: 0 }}>
              {firstName} has not uploaded their face photo yet.
            </p>
          </div>
        ) : revealed ? (
          /* Revealed — show clearly */
          <div>
            <style>{`
              @keyframes pcUnblur { from { filter: blur(22px); transform: scale(1.08); } to { filter: blur(0); transform: scale(1); } }
              @media (prefers-reduced-motion: reduce) { .pc-reveal-img { animation: none !important; } }
            `}</style>
            <div style={{ borderRadius: '10px', overflow: 'hidden', aspectRatio: '3/4' }}>
              <img src={frontUrl} alt={profile.full_name} className="pc-reveal-img" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', animation: 'pcUnblur 1.1s ease-out' }} />
            </div>
            {revealMsg && (
              <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1rem', color: '#4ade80', textAlign: 'center', margin: '0.75rem 0 0', padding: '0.75rem', background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '6px' }}>
                ✓ {revealMsg}
              </p>
            )}
          </div>
        ) : (
          /* Always show blurred preview — reveal or upgrade button inside */
          <div>
            <div style={{ marginBottom: '1rem', padding: '1.25rem 1.5rem', background: 'linear-gradient(135deg, rgba(201,168,76,0.14), rgba(201,168,76,0.04))', border: `1px solid ${c.border}`, borderRadius: '10px', textAlign: 'center' }}>
              <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.3rem', fontStyle: 'italic', fontWeight: 600, color: c.goldLight, margin: 0, lineHeight: 1.6 }}>
                💛 Liked the profile so far? Click below to reveal {firstName}&rsquo;s face photo.
              </p>
              <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.15rem', fontStyle: 'italic', color: c.ivoryDim, margin: '0.5rem 0 0', lineHeight: 1.6 }}>
                अब तक प्रोफ़ाइल पसंद आई? नीचे क्लिक करके फोटो देखें।
              </p>
            </div>
            <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', aspectRatio: '3/4' }}>
              <img src={frontUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'blur(22px)', transform: 'scale(1.1)' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(7,17,31,0.55)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '1.5rem' }}>
                <span style={{ fontSize: '2.5rem' }}>🔒</span>
                <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.1rem', color: c.ivory, textAlign: 'center', margin: 0, fontStyle: 'italic' }}>
                  Face photo is blurred for privacy
                </p>
                {revealError && <p style={{ color: '#F87171', fontSize: '0.9rem', margin: 0, textAlign: 'center' }}>{revealError}</p>}
                {canReveal ? (
                  <button onClick={handleReveal} disabled={revealing}
                    style={{ padding: '0.85rem 2rem', background: revealing ? 'rgba(201,168,76,0.4)' : `linear-gradient(135deg, #e8c876, ${c.goldLight})`, color: c.navy, border: 'none', fontFamily: 'Raleway, sans-serif', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: revealing ? 'default' : 'pointer', borderRadius: '8px', transition: 'all 0.2s', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
                    {revealing ? 'Revealing…' : '🔓 Reveal Face Photo'}
                  </button>
                ) : (
                  <a href="/pricing"
                    style={{ padding: '0.85rem 2rem', background: `linear-gradient(135deg, #e8c876, ${c.goldLight})`, color: c.navy, fontFamily: 'Raleway, sans-serif', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', borderRadius: '8px', textDecoration: 'none', display: 'block', textAlign: 'center' }}>
                    Upgrade to Reveal →
                  </a>
                )}
              </div>
            </div>
            {/* Notification notice */}
            <div style={{ marginTop: '0.85rem', padding: '1rem 1.1rem', background: 'rgba(201,168,76,0.06)', border: `1px solid rgba(201,168,76,0.2)`, borderRadius: '8px' }}>
              <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.05rem', color: c.ivoryDim, margin: 0, lineHeight: 1.7 }}>
                <strong style={{ color: c.goldLight, fontStyle: 'normal' }}>Please note:</strong> Once you click <em>&ldquo;Reveal Face Photo&rdquo;</em>, {firstName} will be immediately notified that you have viewed their photo. They may then choose to send you a video call request or visit your profile in return.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Video Meeting ── */}
      <div className="pc-actions">
        {!canMeet ? (
          <a href="/pricing" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '0.75rem', borderRadius: '6px', fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: c.ivoryDim, border: '1px solid rgba(90,110,130,0.2)', textDecoration: 'none', background: 'rgba(90,110,130,0.05)', boxSizing: 'border-box' }}>
            🔒 Upgrade to request video meetings
          </a>
        ) : !hasMutualLike && !roomId && !meetPending && !meetSent ? (
          /* Mutual like required */
          <div style={{ padding: '1.1rem 1.25rem', background: isLiked ? 'rgba(201,168,76,0.05)' : 'rgba(248,113,113,0.04)', border: `1px solid ${isLiked ? 'rgba(201,168,76,0.2)' : 'rgba(248,113,113,0.15)'}`, borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{isLiked ? '💛' : '🤍'}</div>
            <p style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '1rem', fontWeight: 600, color: c.ivory, margin: '0 0 0.5rem', lineHeight: 1.5 }}>
              {isLiked ? 'Waiting for a Mutual Like' : 'Like This Profile to Unlock Video Meetings'}
            </p>
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.95rem', color: c.ivoryDim, margin: '0 0 0.85rem', lineHeight: 1.7 }}>
              {isLiked
                ? `You have liked ${firstName}'s profile. Once they like you back, video meeting requests will be activated between you both.`
                : `Like ${firstName}'s profile to express your interest. Once you both like each other, video meeting requests will be unlocked — so you can connect face to face with your family.`}
            </p>
            {!isLiked && (
              <button onClick={handleToggleLike} disabled={likingToggle || likesLeft === 0}
                style={{ padding: '0.65rem 1.5rem', background: likingToggle || likesLeft === 0 ? 'rgba(248,113,113,0.2)' : 'linear-gradient(135deg, rgba(248,113,113,0.3), rgba(248,113,113,0.5))', border: '1px solid rgba(248,113,113,0.4)', color: '#fecaca', fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: likingToggle || likesLeft === 0 ? 'default' : 'pointer', borderRadius: '6px', transition: 'all 0.2s' }}>
                {likingToggle ? 'Liking…' : likesLeft === 0 ? 'No Likes Remaining' : `❤️ Like ${firstName}'s Profile`}
              </button>
            )}
          </div>
        ) : canMeet && meetingsLeft === 0 && !roomId && !meetPending && !meetSent ? (
          <div style={{ textAlign: 'center', padding: '1rem 1.25rem', background: 'rgba(201,168,76,0.04)', border: `1px solid rgba(201,168,76,0.2)`, borderRadius: '8px' }}>
            <div style={{ fontSize: '1.4rem', marginBottom: '0.4rem' }}>📅</div>
            <p style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '1rem', fontWeight: 600, color: c.ivory, margin: '0 0 0.3rem' }}>No meeting requests left</p>
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.9rem', color: c.ivoryDim, margin: '0 0 0.9rem', lineHeight: 1.5 }}>
              You&apos;ve used all your meeting requests this month. Buy one extra to connect with {firstName}.
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
              ✓ Your meeting request has been sent to <strong style={{ color: c.goldLight, fontStyle: 'normal' }}>{maskName(profile.full_name)}</strong> and is awaiting their confirmation.
            </p>
          </div>
        ) : meetSent ? (
          <div style={{ textAlign: 'center', padding: '1rem 1.25rem', background: 'rgba(201,168,76,0.06)', border: `1px solid ${c.border}`, borderRadius: '8px' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>✅</div>
            <p style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '1rem', fontWeight: 600, color: c.ivory, margin: '0 0 0.35rem' }}>Request Sent!</p>
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.95rem', color: c.ivoryDim, margin: 0, lineHeight: 1.5 }}>
              Your meeting request has been sent to <strong style={{ color: c.goldLight, fontStyle: 'normal' }}>{maskName(profile.full_name)}</strong> and is awaiting their confirmation.
            </p>
          </div>
        ) : showForm ? (
          <form onSubmit={handleRequestMeeting} style={{ background: 'rgba(14,26,53,0.6)', border: `1px solid ${c.border}`, borderRadius: '8px', padding: '1rem' }}>
            <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: c.goldLight, margin: '0 0 0.75rem' }}>📅 Request Meeting with {firstName}</p>
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
              <label style={{ display: 'block', fontFamily: 'Raleway, sans-serif', fontSize: '0.55rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: c.ivoryDim, marginBottom: '0.3rem' }}>Family Member Joining (optional)</label>
              <input type="text" value={meetFamilyMember} onChange={e => setMeetFamilyMember(e.target.value)} placeholder="e.g. My Mom, My Dad, My Uncle"
                style={{ width: '100%', padding: '0.5rem', background: 'rgba(14,26,53,0.8)', border: `1px solid rgba(201,168,76,0.2)`, color: c.ivory, fontFamily: '"Cormorant Garamond", serif', fontSize: '0.9rem', borderRadius: '4px', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', fontFamily: 'Raleway, sans-serif', fontSize: '0.55rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: c.ivoryDim, marginBottom: '0.3rem' }}>Message</label>
              <textarea value={meetMsg} onChange={e => setMeetMsg(e.target.value)} placeholder={`Hi ${firstName}, I'd love to connect…`} rows={2}
                style={{ width: '100%', padding: '0.5rem', background: 'rgba(14,26,53,0.8)', border: `1px solid rgba(201,168,76,0.2)`, color: c.ivory, fontFamily: '"Cormorant Garamond", serif', fontSize: '0.95rem', fontStyle: 'italic', borderRadius: '4px', outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
            </div>
            {meetError && <div style={{ marginBottom: '0.65rem', padding: '0.5rem 0.75rem', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: '4px', color: '#f87171', fontFamily: '"Cormorant Garamond", serif', fontSize: '0.9rem' }}>{meetError}</div>}
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
    </article>
  )
}
