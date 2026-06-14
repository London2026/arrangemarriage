'use client'

import { useState } from 'react'
import { markNotificationRead } from './actions'
import { acceptMeeting, declineMeeting } from '@/app/profile/actions'
import { maskName } from '@/lib/maskName'

interface MeetingInfo {
  id: string
  room_id: string
  status: string
  preferred_date: string | null
  preferred_time: string | null
  message: string | null
  family_member: string | null
  other_name: string
}

export interface InboxItem {
  id: string
  message: string
  type: string
  read: boolean
  created_at: string
  meeting: MeetingInfo | null
}

const c = { navy: '#0d1f3c', navyMid: '#1e3358', goldLight: '#c9a84c', ivory: '#f5f0e6', ivoryDim: '#bdb5a6', border: 'rgba(201,168,76,0.18)' }

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function Inbox({ items }: { items: InboxItem[] }) {
  const [open, setOpen] = useState(false)
  const [list, setList] = useState(items)

  const unreadCount = list.filter((n) => !n.read).length

  async function dismiss(id: string) {
    await markNotificationRead(id)
    setList((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  if (list.length === 0) return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', background: 'rgba(201,168,76,0.08)', border: `1px solid ${c.border}`, color: c.goldLight, fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', borderRadius: '20px', cursor: 'pointer', flexShrink: 0 }}
      >
        ✦ Inbox
        {unreadCount > 0 && (
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '18px', height: '18px', padding: '0 0.3rem', borderRadius: '999px', background: c.goldLight, color: c.navy, fontFamily: 'Raleway, sans-serif', fontSize: '0.62rem', fontWeight: 800 }}>
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(7,17,31,0.7)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '5rem 1rem 2rem', overflowY: 'auto' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '480px', background: c.navy, border: `1px solid ${c.border}`, borderRadius: '14px', boxShadow: '0 16px 48px rgba(0,0,0,0.6)', overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: `1px solid ${c.border}` }}>
              <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: c.goldLight, margin: 0 }}>
                ✦ Inbox
              </p>
              <button onClick={() => setOpen(false)} aria-label="Close" style={{ background: 'none', border: 'none', color: c.ivoryDim, fontSize: '1.3rem', lineHeight: 1, cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ maxHeight: '70vh', overflowY: 'auto', padding: '0.75rem' }}>
              {list.map((item) => (
                <InboxRow key={item.id} item={item} onDismiss={dismiss} />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function InboxRow({ item, onDismiss }: { item: InboxItem; onDismiss: (id: string) => void }) {
  const [meeting, setMeeting] = useState(item.meeting)
  const [loading, setLoading] = useState<'accept' | 'decline' | null>(null)

  async function handleAccept() {
    if (!meeting) return
    setLoading('accept')
    try { await acceptMeeting(meeting.id); setMeeting({ ...meeting, status: 'accepted' }) }
    finally { setLoading(null) }
  }

  async function handleDecline() {
    if (!meeting) return
    setLoading('decline')
    try { await declineMeeting(meeting.id); setMeeting({ ...meeting, status: 'declined' }) }
    finally { setLoading(null) }
  }

  const dateStr = meeting?.preferred_date
    ? new Date(meeting.preferred_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    : null

  const meetingUrl = meeting ? `https://meet.jit.si/ArrangeMarriage-${meeting.room_id}` : ''

  return (
    <div style={{ position: 'relative', background: 'rgba(201,168,76,0.06)', border: `1px solid ${c.border}`, borderRadius: '10px', padding: '0.9rem 1rem', marginBottom: '0.6rem', opacity: item.read ? 0.6 : 1 }}>
      {!item.read && (
        <button onClick={() => onDismiss(item.id)} aria-label="Mark as read"
          style={{ position: 'absolute', top: '0.6rem', right: '0.75rem', background: 'none', border: 'none', color: c.ivoryDim, fontSize: '1.1rem', lineHeight: 1, cursor: 'pointer' }}>×</button>
      )}

      <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', color: c.ivoryDim, margin: '0 0 0.45rem', letterSpacing: '0.06em' }}>
        {formatTimestamp(item.created_at)}
      </p>

      {meeting && item.type === 'video_meeting_request' ? (
        <div style={{ paddingRight: '1rem' }}>
          <p style={{ fontFamily: '"Playfair Display", serif', fontSize: '0.95rem', fontWeight: 600, color: c.ivory, margin: '0 0 0.25rem' }}>
            <span style={{ fontStyle: 'italic' }}>{maskName(meeting.other_name)}</span> requested a video meeting
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
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.9rem', color: c.ivoryDim, margin: '0.3rem 0 0' }}>
              &ldquo;{meeting.message}&rdquo;
            </p>
          )}

          {meeting.status === 'pending' && (
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
              <button onClick={handleAccept} disabled={!!loading}
                style={{ flex: 1, padding: '0.55rem', background: `linear-gradient(135deg, #e8c876, ${c.goldLight})`, color: c.navy, border: 'none', fontFamily: 'Raleway, sans-serif', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: loading ? 'default' : 'pointer', borderRadius: '4px', opacity: loading ? 0.7 : 1 }}>
                {loading === 'accept' ? 'Accepting…' : '✓ Accept'}
              </button>
              <button onClick={handleDecline} disabled={!!loading}
                style={{ flex: 1, padding: '0.55rem', background: 'transparent', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', fontFamily: 'Raleway, sans-serif', fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: loading ? 'default' : 'pointer', borderRadius: '4px', opacity: loading ? 0.7 : 1 }}>
                {loading === 'decline' ? 'Declining…' : '✕ Decline'}
              </button>
            </div>
          )}

          {meeting.status === 'accepted' && (
            <a href={meetingUrl} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.75rem', padding: '0.6rem', background: `linear-gradient(135deg, #e8c876, ${c.goldLight})`, color: c.navy, fontFamily: 'Raleway, sans-serif', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: '4px' }}>
              🎥 Join Video Meeting
            </a>
          )}

          {meeting.status === 'declined' && (
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.85rem', color: '#f87171', margin: '0.5rem 0 0' }}>
              You declined this meeting.
            </p>
          )}
        </div>
      ) : meeting && item.type === 'meeting_accepted' ? (
        <div style={{ paddingRight: '1rem' }}>
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '0.95rem', color: c.ivory, lineHeight: 1.5, margin: '0 0 0.5rem' }}>
            {item.message}
          </p>
          {meeting.status === 'accepted' && (
            <a href={meetingUrl} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.6rem', background: `linear-gradient(135deg, #e8c876, ${c.goldLight})`, color: c.navy, fontFamily: 'Raleway, sans-serif', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: '4px' }}>
              🎥 Join Video Meeting
            </a>
          )}
        </div>
      ) : (
        <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '0.95rem', color: c.ivory, lineHeight: 1.5, margin: 0, paddingRight: '1rem' }}>
          {item.message}
        </p>
      )}
    </div>
  )
}
