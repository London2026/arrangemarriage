'use client'

import { useState } from 'react'
import { blockMember } from '@/app/discover/actions'

interface BlockedMember { id: string; displayId: string; maskedName: string }

const c = { gold: '#c9a84c', ivory: '#f5f0e6', ivoryDim: '#bdb5a6', border: 'rgba(201,168,76,0.18)' }

export default function BlockedMembersList({ members }: { members: BlockedMember[] }) {
  const [list, setList] = useState(members)
  const [unblocking, setUnblocking] = useState<string | null>(null)

  if (list.length === 0) return null

  async function handleUnblock(id: string) {
    setUnblocking(id)
    try {
      await blockMember(id)
      setList(prev => prev.filter(m => m.id !== id))
    } catch {
      // silently fail — member stays in list
    } finally {
      setUnblocking(null)
    }
  }

  return (
    <div style={{ background: 'rgba(13,31,60,0.3)', border: `1px solid ${c.border}`, borderRadius: '12px', padding: '1.5rem 1.75rem', marginBottom: '1.5rem' }}>
      <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: c.gold, margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
        🚫 Blocked Members ({list.length})
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {list.map(m => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', padding: '0.65rem 0.85rem', background: 'rgba(248,113,113,0.04)', border: '1px solid rgba(248,113,113,0.15)', borderRadius: '8px' }}>
            <div>
              <span style={{ fontFamily: '"Courier New", monospace', fontSize: '0.85rem', fontWeight: 700, color: c.gold, letterSpacing: '0.06em' }}>{m.displayId}</span>
              <span style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.95rem', color: c.ivoryDim, marginLeft: '0.6rem' }}>{m.maskedName}</span>
            </div>
            <button
              onClick={() => handleUnblock(m.id)}
              disabled={unblocking === m.id}
              style={{ flexShrink: 0, padding: '0.4rem 0.85rem', background: 'transparent', border: '1px solid rgba(248,113,113,0.35)', color: '#f87171', fontFamily: 'Raleway, sans-serif', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: '4px', cursor: unblocking === m.id ? 'default' : 'pointer', opacity: unblocking === m.id ? 0.5 : 1 }}
            >
              {unblocking === m.id ? 'Unblocking…' : 'Unblock'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
