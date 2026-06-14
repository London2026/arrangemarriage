'use client'

import { useState } from 'react'
import { acceptMeeting, declineMeeting } from './actions'
import { maskName, firstNameOnly } from '@/lib/maskName'

interface Props {
  meeting: {
    id: string
    room_id: string
    other_name: string
    status: string
    created_at: string
    i_requested: boolean
    preferred_date?: string | null
    preferred_time?: string | null
    message?: string | null
    family_member?: string | null
    acceptor_family_member?: string | null
    acceptor_message?: string | null
  }
}

const c = { navy: '#0d1f3c', gold: '#8b6914', goldLight: '#c9a84c', sepia: '#5a6e82', ivory: '#f5f0e6', ivoryDim: '#bdb5a6', border: 'rgba(201,168,76,0.18)' }

export default function MeetingCard({ meeting }: Props) {
  const [status, setStatus] = useState(meeting.status)
  const [loading, setLoading] = useState<'accept' | 'decline' | null>(null)
  const [myFamilyMember, setMyFamilyMember] = useState('')
  const [myMessage, setMyMessage] = useState('')
  const [acceptorFamilyMember, setAcceptorFamilyMember] = useState(meeting.acceptor_family_member ?? '')
  const [acceptorMessage, setAcceptorMessage] = useState(meeting.acceptor_message ?? '')

  const meetingUrl = `https://meet.jit.si/ArrangeMarriage-${meeting.room_id}`

  const dateStr = meeting.preferred_date
    ? new Date(meeting.preferred_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    : null

  const timeAgo = (() => {
    const diff = Date.now() - new Date(meeting.created_at).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  })()

  async function handleAccept() {
    setLoading('accept')
    try {
      await acceptMeeting(meeting.id, myFamilyMember, myMessage)
      setStatus('accepted')
      setAcceptorFamilyMember(myFamilyMember)
      setAcceptorMessage(myMessage)
    }
    finally { setLoading(null) }
  }

  async function handleDecline() {
    setLoading('decline')
    try { await declineMeeting(meeting.id); setStatus('declined') }
    finally { setLoading(null) }
  }

  const statusColor = status === 'accepted' ? '#4ade80' : status === 'declined' ? '#f87171' : c.goldLight

  return (
    <div style={{ background: 'rgba(14,26,53,0.5)', border: `1px solid ${c.border}`, borderRadius: '10px', padding: '1.1rem 1.25rem', marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.5rem' }}>
        <div>
          <p style={{ fontFamily: '"Playfair Display", serif', fontSize: '1rem', fontWeight: 600, color: c.ivory, margin: '0 0 0.15rem' }}>
            {meeting.i_requested ? `You invited ` : `Invited by `}
            <span style={{ fontStyle: 'italic' }}>{maskName(meeting.other_name)}</span>
          </p>
          {dateStr && (
            <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', color: c.goldLight, margin: '0 0 0.15rem', letterSpacing: '0.06em' }}>
              📅 {dateStr}{meeting.preferred_time ? ` at ${meeting.preferred_time}` : ''}
            </p>
          )}
          {meeting.family_member && (
            <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', color: c.ivoryDim, margin: '0 0 0.15rem', letterSpacing: '0.04em' }}>
              👥 Joining: {meeting.family_member}
            </p>
          )}
          {meeting.message && (
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.9rem', color: c.ivoryDim, margin: '0.15rem 0 0' }}>
              &ldquo;{meeting.message}&rdquo;
            </p>
          )}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: statusColor }}>
            {status}
          </span>
          <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', color: c.sepia, margin: '0.15rem 0 0' }}>{timeAgo}</p>
        </div>
      </div>

      {/* Actions */}
      {status === 'pending' && !meeting.i_requested && (
        <div style={{ marginTop: '0.75rem' }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <label style={{ display: 'block', fontFamily: 'Raleway, sans-serif', fontSize: '0.55rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: c.ivoryDim, marginBottom: '0.3rem' }}>My Family Member Joining (optional)</label>
            <input type="text" value={myFamilyMember} onChange={e => setMyFamilyMember(e.target.value)} placeholder="e.g. My Mom, My Dad, My Sister"
              style={{ width: '100%', padding: '0.5rem', background: 'rgba(14,26,53,0.8)', border: `1px solid rgba(201,168,76,0.2)`, color: c.ivory, fontFamily: '"Cormorant Garamond", serif', fontSize: '0.9rem', borderRadius: '4px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            <label style={{ display: 'block', fontFamily: 'Raleway, sans-serif', fontSize: '0.55rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: c.ivoryDim, marginBottom: '0.3rem' }}>Message (optional)</label>
            <textarea value={myMessage} onChange={e => setMyMessage(e.target.value)} placeholder="A note for them…" rows={2}
              style={{ width: '100%', padding: '0.5rem', background: 'rgba(14,26,53,0.8)', border: `1px solid rgba(201,168,76,0.2)`, color: c.ivory, fontFamily: '"Cormorant Garamond", serif', fontSize: '0.95rem', fontStyle: 'italic', borderRadius: '4px', outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handleAccept} disabled={!!loading}
              style={{ flex: 1, padding: '0.6rem', background: `linear-gradient(135deg, #e8c876, ${c.goldLight})`, color: c.navy, border: 'none', fontFamily: 'Raleway, sans-serif', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: loading ? 'default' : 'pointer', borderRadius: '4px', opacity: loading ? 0.7 : 1 }}>
              {loading === 'accept' ? 'Accepting…' : '✓ Accept'}
            </button>
            <button onClick={handleDecline} disabled={!!loading}
              style={{ flex: 1, padding: '0.6rem', background: 'transparent', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', fontFamily: 'Raleway, sans-serif', fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: loading ? 'default' : 'pointer', borderRadius: '4px', opacity: loading ? 0.7 : 1 }}>
              {loading === 'decline' ? 'Declining…' : '✕ Decline'}
            </button>
          </div>
        </div>
      )}

      {status === 'pending' && meeting.i_requested && (
        <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.9rem', color: c.ivoryDim, margin: '0.5rem 0 0', textAlign: 'center' }}>
          Awaiting response from {firstNameOnly(meeting.other_name)}…
        </p>
      )}

      {status === 'accepted' && (acceptorFamilyMember || acceptorMessage) && (
        <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.75rem', background: 'rgba(201,168,76,0.05)', border: `1px solid ${c.border}`, borderRadius: '6px' }}>
          {acceptorFamilyMember && (
            <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', color: c.ivoryDim, margin: '0 0 0.15rem', letterSpacing: '0.04em' }}>
              👥 {meeting.i_requested ? `${firstNameOnly(meeting.other_name)} is bringing` : 'You added'}: {acceptorFamilyMember}
            </p>
          )}
          {acceptorMessage && (
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.9rem', color: c.ivoryDim, margin: 0 }}>
              &ldquo;{acceptorMessage}&rdquo;
            </p>
          )}
        </div>
      )}

      {status === 'accepted' && (
        <a href={meetingUrl} target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.75rem', padding: '0.65rem', background: `linear-gradient(135deg, #e8c876, ${c.goldLight})`, color: c.navy, fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: '4px', boxShadow: '0 4px 16px rgba(201,168,76,0.25)' }}>
          🎥 Join Video Meeting
        </a>
      )}

      {status === 'declined' && (
        <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.9rem', color: '#f87171', margin: '0.5rem 0 0', textAlign: 'center' }}>
          This meeting was declined.
        </p>
      )}
    </div>
  )
}
