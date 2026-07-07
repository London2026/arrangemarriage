'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface MeetingStats {
  requested: number
  accepted: number
  declined: number
  waiting: number
}

interface AuthUser {
  id: string
  name: string
  plan: string
  stats: MeetingStats
}

const c = {
  nav: 'rgba(7,17,31,0.96)',
  border: 'rgba(201,168,76,0.12)',
  ivory: '#f5f0e6',
  ivoryDim: '#bdb5a6',
  gold: '#c9a84c',
  navy: '#0d1f3c',
  sepia: '#5a6e82',
}

export default function Navigation() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [open, setOpen] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    async function loadUser(userId: string, email?: string, fullName?: string) {
      const [profileRes, meetingsRes] = await Promise.all([
        supabase.from('profiles').select('full_name, plan').eq('id', userId).maybeSingle(),
        supabase.from('video_meetings')
          .select('status, requester_id')
          .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`),
      ])

      const profile = profileRes.data
      const meetings = meetingsRes.data ?? []

      const myRequests = meetings.filter(m => m.requester_id === userId)
      const stats: MeetingStats = {
        requested: myRequests.length,
        accepted:  meetings.filter(m => m.status === 'accepted').length,
        declined:  meetings.filter(m => m.status === 'declined').length,
        waiting:   myRequests.filter(m => m.status === 'pending').length,
      }

      setUser({
        id: userId,
        name: profile?.full_name || fullName || email?.split('@')[0] || 'Member',
        plan: profile?.plan || 'free',
        stats,
      })
    }

    // 1. Immediate check via getSession (reads local cookies — no server round-trip)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUser(session.user.id, session.user.email, session.user.user_metadata?.full_name)
      }
    })

    // 2. Subscribe for future changes (sign in / sign out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUser(session.user.id, session.user.email, session.user.user_metadata?.full_name)
      } else {
        setUser(null)
      }
    })

    // Close dropdown on outside click
    function handleClick(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)

    return () => {
      subscription.unsubscribe()
      document.removeEventListener('mousedown', handleClick)
    }
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
  }

  const planLabel = user?.plan === 'standard' ? 'Premium' : user?.plan === 'starter' ? 'Starter' : 'Free'

  const initials = user?.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? ''

  return (
    <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: c.nav, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: `1px solid ${c.border}` }}>
      <style>{`
        .nav-bar { height: 80px; }
        .nav-logo-box { background: #fff; border: 2px solid #111; border-radius: 10px; width: 72px; height: 72px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .nav-logo-box img { max-width: 66px; max-height: 66px; width: auto; height: auto; object-fit: contain; display: block; }
        @media (max-width: 600px) {
          .nav-bar { height: 64px; }
          .nav-logo-box { width: 54px; height: 54px; border-radius: 8px; }
          .nav-logo-box img { max-width: 48px; max-height: 48px; }
        }
      `}</style>
      <div className="nav-bar" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
          <div className="nav-logo-box">
            <img src="/arrangemarriage-logo.png" alt="Arrange Marriage" />
          </div>
        </Link>

        {user ? (
          /* ── Logged-in nav ── */
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <Link href="/discover" style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', color: c.ivoryDim, textDecoration: 'none', letterSpacing: '0.06em' }}>Discover</Link>
            <Link href="/profile"  style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', color: c.ivoryDim, textDecoration: 'none', letterSpacing: '0.06em' }}>My Profile</Link>

            {/* User dropdown */}
            <div ref={dropRef} style={{ position: 'relative' }}>
              <button onClick={() => setOpen(o => !o)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(201,168,76,0.08)', border: `1px solid ${c.border}`, borderRadius: '24px', padding: '0.3rem 0.75rem 0.3rem 0.3rem', cursor: 'pointer', transition: 'background 0.2s', minHeight: '44px' }}>
                {/* Avatar */}
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg, #1e3358, #253f6a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Playfair Display", serif', fontSize: '0.7rem', fontWeight: 700, color: c.gold, flexShrink: 0 }}>
                  {initials}
                </div>
                <span style={{ fontFamily: '"Playfair Display", Georgia, serif', fontStyle: 'italic', fontSize: '0.9rem', color: c.ivory }}>
                  {user.name.split(' ')[0]}
                </span>
                <span style={{ color: c.ivoryDim, fontSize: '0.65rem' }}>▾</span>
              </button>

              {/* Dropdown panel */}
              {open && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 'min(310px, calc(100vw - 1.5rem))', background: '#0d1f3c', border: `1px solid ${c.border}`, borderRadius: '12px', boxShadow: '0 16px 48px rgba(0,0,0,0.6)', overflow: 'hidden', zIndex: 200 }}>

                  {/* Profile header */}
                  <div style={{ padding: '1.25rem 1.4rem', borderBottom: `1px solid ${c.border}`, background: 'rgba(30,51,88,0.5)' }}>
                    <p style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.2rem', fontWeight: 600, color: c.ivory, margin: '0 0 0.35rem' }}>{user.name}</p>
                    <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '0.22rem 0.7rem', background: 'rgba(201,168,76,0.12)', border: `1px solid rgba(201,168,76,0.3)`, color: c.gold, borderRadius: '20px' }}>
                      {planLabel} Plan
                    </span>
                  </div>

                  {/* Meeting stats */}
                  <div style={{ padding: '1rem 1.4rem', borderBottom: `1px solid ${c.border}` }}>
                    <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: c.gold, margin: '0 0 0.75rem' }}>Meeting Activity</p>
                    {[
                      { label: 'Requests Sent',         value: user.stats.requested, color: '#93c5fd' },
                      { label: 'Accepted',              value: user.stats.accepted,  color: '#4ade80' },
                      { label: 'Declined',              value: user.stats.declined,  color: '#f87171' },
                      { label: 'Awaiting Confirmation', value: user.stats.waiting,   color: c.gold },
                    ].map(stat => (
                      <div key={stat.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.05rem', color: c.ivoryDim }}>{stat.label}</span>
                        <span style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.1rem', fontWeight: 600, color: stat.color, minWidth: '24px', textAlign: 'right' }}>{stat.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div style={{ padding: '0.85rem 1.4rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                    <Link href="/profile" onClick={() => setOpen(false)}
                      style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.78rem', letterSpacing: '0.06em', color: c.ivoryDim, textDecoration: 'none', padding: '0.55rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      👤 My Profile
                    </Link>
                    <Link href="/pricing" onClick={() => setOpen(false)}
                      style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.78rem', letterSpacing: '0.06em', color: c.ivoryDim, textDecoration: 'none', padding: '0.55rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      ⭐ Upgrade Plan
                    </Link>
                    {user.plan !== 'free' && (
                      <BillingButton onClose={() => setOpen(false)} />
                    )}
                    <a href="/contact" onClick={() => setOpen(false)}
                      style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.78rem', letterSpacing: '0.06em', color: c.ivoryDim, textDecoration: 'none', padding: '0.55rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      ❓ Help &amp; Support
                    </a>
                    <div style={{ height: '1px', background: `1px solid ${c.border}`, margin: '0.25rem 0', opacity: 0.3 }} />
                    <button onClick={handleSignOut}
                      style={{ textAlign: 'left', fontFamily: 'Raleway, sans-serif', fontSize: '0.78rem', letterSpacing: '0.06em', color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', padding: '0.55rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      → Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ── Guest nav ── */
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link href="/discover" style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', color: c.ivoryDim, textDecoration: 'none', letterSpacing: '0.06em' }}>Discover</Link>
            <Link href="/pricing"  style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', color: c.ivoryDim, textDecoration: 'none', letterSpacing: '0.06em' }}>Pricing</Link>
            <Link href="/login"    style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', color: c.ivoryDim, textDecoration: 'none', letterSpacing: '0.06em' }}>Sign In</Link>
            <Link href="/signup"
              style={{ padding: '0.5rem 1.25rem', background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', color: '#fff', fontFamily: 'Raleway, sans-serif', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', borderRadius: '4px', textDecoration: 'none' }}>
              Get Started
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}

function BillingButton({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  async function cancelPlan() {
    if (!confirmed) { setConfirmed(true); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/cancel-razorpay-subscription', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Could not cancel.'); setLoading(false); return }
      onClose()
      window.location.href = '/pricing'
    } catch {
      setError('Could not cancel subscription.')
      setLoading(false)
    }
  }

  return (
    <div>
      <button onClick={cancelPlan} disabled={loading}
        style={{ textAlign: 'left', width: '100%', fontFamily: 'Raleway, sans-serif', fontSize: '0.78rem', letterSpacing: '0.06em', color: confirmed ? '#f87171' : '#c9a84c', background: 'none', border: 'none', cursor: loading ? 'default' : 'pointer', padding: '0.55rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: loading ? 0.7 : 1 }}>
        💳 {loading ? 'Cancelling…' : confirmed ? '⚠️ Confirm Cancel?' : 'Cancel Plan'}
      </button>
      {error && <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', color: '#f87171', margin: '0 0 0.25rem' }}>{error}</p>}
    </div>
  )
}
