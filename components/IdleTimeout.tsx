'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const IDLE_MS = 30 * 60 * 1000   // no activity for 30 minutes triggers the warning
const GRACE_MS = 60 * 1000       // 60 seconds to respond before actually signing out
const THROTTLE_MS = 5 * 1000     // activity events only reset the timer once per 5s

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel'] as const

const c = {
  navy: '#0d1f3c', ivory: '#f5f0e6', ivoryDim: '#bdb5a6', gold: '#c9a84c',
  border: 'rgba(201,168,76,0.3)',
}

export default function IdleTimeout() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [warning, setWarning] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(GRACE_MS / 1000)
  const router = useRouter()

  const supabaseRef = useRef(createClient())
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const graceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tickTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastActivity = useRef(0)

  const clearAllTimers = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current)
    if (graceTimer.current) clearTimeout(graceTimer.current)
    if (tickTimer.current) clearInterval(tickTimer.current)
  }, [])

  const handleSignOut = useCallback(async () => {
    clearAllTimers()
    setWarning(false)
    await supabaseRef.current.auth.signOut()
    router.push('/login?reason=idle')
  }, [clearAllTimers, router])

  const startWarning = useCallback(() => {
    setWarning(true)
    setSecondsLeft(GRACE_MS / 1000)
    tickTimer.current = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1))
    }, 1000)
    graceTimer.current = setTimeout(handleSignOut, GRACE_MS)
  }, [handleSignOut])

  const resetIdleTimer = useCallback(() => {
    clearAllTimers()
    setWarning(false)
    idleTimer.current = setTimeout(startWarning, IDLE_MS)
  }, [clearAllTimers, startWarning])

  // Track login state
  useEffect(() => {
    const supabase = supabaseRef.current

    supabase.auth.getSession().then(({ data: { session } }) => {
      setLoggedIn(!!session?.user)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session?.user)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Wire up activity tracking only while logged in
  useEffect(() => {
    if (!loggedIn) {
      clearAllTimers()
      setWarning(false)
      return
    }

    resetIdleTimer()

    function handleActivity() {
      const now = Date.now()
      if (now - lastActivity.current < THROTTLE_MS) return
      lastActivity.current = now
      resetIdleTimer()
    }

    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, handleActivity, { passive: true }))
    return () => {
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, handleActivity))
      clearAllTimers()
    }
  }, [loggedIn, resetIdleTimer, clearAllTimers])

  if (!warning) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(7,17,31,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: c.navy, border: `1px solid ${c.border}`, borderRadius: '14px', padding: 'clamp(1.25rem, 5vw, 2rem)', maxWidth: '380px', width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⏳</div>
        <h2 style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '1.3rem', fontWeight: 600, color: c.ivory, margin: '0 0 0.5rem' }}>
          Still there?
        </h2>
        <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.05rem', color: c.ivoryDim, margin: '0 0 1.5rem', lineHeight: 1.6 }}>
          You&apos;ve been inactive for a while. For your security, you&apos;ll be signed out in{' '}
          <strong style={{ color: c.gold }}>{secondsLeft}s</strong> unless you stay logged in.
        </p>
        <button onClick={resetIdleTimer}
          style={{ width: '100%', padding: '0.85rem', marginBottom: '0.6rem', background: `linear-gradient(135deg, #e8c876, ${c.gold})`, color: c.navy, border: 'none', borderRadius: '6px', fontFamily: 'Raleway, sans-serif', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer' }}>
          Stay Logged In
        </button>
        <button onClick={handleSignOut}
          style={{ width: '100%', padding: '0.7rem', background: 'none', border: 'none', color: c.ivoryDim, fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', textDecoration: 'underline' }}>
          Log Out Now
        </button>
      </div>
    </div>
  )
}
