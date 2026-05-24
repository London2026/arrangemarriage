'use client'

import { useState } from 'react'
import { requestVideoMeeting } from './actions'
import { maskName } from '@/lib/maskName'

export interface Viewer {
  id: string
  full_name: string
  age: number
  city: string
  religion: string
  thumbnail_url: string | null
  meeting_room_id: string | null
  revealed_at: string
}

const c = { navy: '#0d1f3c', navyMid: '#1a3a5c', gold: '#8b6914', goldLight: '#c9a84c', sepia: '#5a6e82', ivory: '#f5f0e6', ivoryDim: '#bdb5a6', border: 'rgba(201,168,76,0.18)' }

export default function RevealedByCard({ viewer }: { viewer: Viewer }) {
  const [roomId, setRoomId] = useState<string | null>(viewer.meeting_room_id)
  const [requesting, setRequesting] = useState(false)
  const [error, setError] = useState('')

  async function handleRequest() {
    setRequesting(true)
    setError('')
    try {
      await requestVideoMeeting(viewer.id, '', '', "I'd love to connect with you!")
      setRoomId('pending')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setRequesting(false)
    }
  }

  const meetingUrl = roomId && roomId !== 'pending' ? `https://meet.jit.si/SoulMate-${roomId}` : null

  return (
    <div style={{ background: 'rgba(14,26,53,0.6)', border: `1px solid ${c.border}`, borderRadius: '10px', overflow: 'hidden' }}>
      {/* Thumbnail */}
      <div style={{ aspectRatio: '4/3', backgroundColor: c.navyMid, position: 'relative', overflow: 'hidden' }}>
        {viewer.thumbnail_url ? (
          <img src={viewer.thumbnail_url} alt={viewer.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: c.goldLight }}>
            👤
          </div>
        )}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0.6rem 0.75rem', background: 'linear-gradient(to top, rgba(13,31,60,0.95), transparent)' }}>
          <p style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '0.9rem', fontWeight: 600, color: c.ivory, margin: '0 0 0.1rem' }}>
            {maskName(viewer.full_name)}
          </p>
          <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', color: c.ivoryDim, margin: 0 }}>
            {viewer.age} · {viewer.city}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '0.75rem' }}>
        <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.58rem', fontWeight: 600, letterSpacing: '0.1em', padding: '0.2rem 0.5rem', background: 'rgba(201,168,76,0.08)', border: `1px solid rgba(201,168,76,0.18)`, borderRadius: '20px', color: c.goldLight, display: 'inline-block', marginBottom: '0.6rem' }}>
          {viewer.religion}
        </span>

        {error && <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', color: '#f87171', marginBottom: '0.4rem' }}>{error}</p>}

        {roomId === 'pending' ? (
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.85rem', color: c.ivoryDim, textAlign: 'center', margin: 0 }}>
            Request sent — awaiting confirmation
          </p>
        ) : meetingUrl ? (
          <a href={meetingUrl} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', padding: '0.5rem', background: `linear-gradient(135deg, #e8c876, ${c.goldLight})`, color: c.navy, fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: '4px' }}>
            🎥 Join Meeting
          </a>
        ) : (
          <button onClick={handleRequest} disabled={requesting}
            style={{ width: '100%', padding: '0.5rem', background: 'transparent', border: `1px solid rgba(201,168,76,0.3)`, color: c.goldLight, fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: requesting ? 'default' : 'pointer', borderRadius: '4px', opacity: requesting ? 0.6 : 1 }}>
            {requesting ? 'Requesting…' : '📹 Request Meeting'}
          </button>
        )}
      </div>
    </div>
  )
}
