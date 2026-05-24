'use client'

import { useState } from 'react'
import { markNotificationRead } from './actions'

interface Notification {
  id: string
  message: string
  read: boolean
  created_at: string
}

export default function NotificationBanner({ notifications }: { notifications: Notification[] }) {
  const [visible, setVisible] = useState(notifications)

  async function dismiss(id: string) {
    await markNotificationRead(id)
    setVisible((prev) => prev.filter((n) => n.id !== id))
  }

  if (visible.length === 0) return null

  return (
    <div className="mb-6 space-y-3">
      <p
        className="text-xs tracking-widest uppercase"
        style={{ color: 'var(--antique-gold)' }}
      >
        ✦ Notifications
      </p>

      {visible.map((n) => (
        <div
          key={n.id}
          className="relative rounded-xl px-5 py-4 pr-10"
          style={{
            backgroundColor: 'rgba(201,168,76,0.06)',
            border: '1px solid rgba(201,168,76,0.2)',
          }}
        >
          <p className="text-sm leading-relaxed" style={{ color: 'var(--ivory)' }}>
            {n.message}
          </p>
          <p className="text-xs mt-1.5" style={{ color: 'var(--ivory-dim)' }}>
            {new Date(n.created_at).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
            })}
          </p>
          <button
            onClick={() => dismiss(n.id)}
            className="absolute top-3 right-4 text-lg leading-none transition-opacity hover:opacity-60"
            style={{ color: 'var(--ivory-dim)' }}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
