'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navigation from '@/components/Navigation'

const c = {
  navy: '#0d1f3c', navyMid: '#152240', ivory: '#f5f0e6',
  ivoryDim: '#bdb5a6', gold: '#8b6914', goldLight: '#c9a84c',
  border: 'rgba(201,168,76,0.18)',
}

const REDIRECT_SECS = 5

export default function PaymentSuccessPage() {
  const router = useRouter()
  const [secs, setSecs] = useState(REDIRECT_SECS)

  useEffect(() => {
    const interval = setInterval(() => {
      setSecs(s => {
        if (s <= 1) {
          clearInterval(interval)
          router.push('/discover')
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [router])

  return (
    <div style={{ minHeight: '100vh', background: c.navy }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(201,168,76,0.08) 0%, transparent 65%)' }} />
      <Navigation />

      <main style={{ maxWidth: '520px', margin: '0 auto', padding: '8rem 1.5rem 4rem', textAlign: 'center' }}>

        {/* Logo */}
        <div style={{ background: '#fff', border: '2px solid #111', borderRadius: '10px', padding: '8px 20px', display: 'inline-flex', alignItems: 'center', margin: '0 auto 2rem' }}>
          <img src="/arrangemarriage-logo.png" alt="Arrange Marriage" style={{ width: 'auto', height: '90px', maxWidth: '320px', objectFit: 'contain', display: 'block' }} />
        </div>

        {/* Heading */}
        <h1 style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '2.6rem', fontWeight: 600, color: c.ivory, margin: '0 0 0.75rem' }}>
          Welcome to Arrange Marriage
        </h1>
        <div style={{ height: '1px', width: '60px', background: `linear-gradient(to right, transparent, ${c.goldLight}, transparent)`, margin: '0 auto 1.5rem' }} />
        <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1.25rem', color: c.ivoryDim, margin: '0 0 2.25rem', lineHeight: 1.75 }}>
          Your subscription is active. You now have full access to photo reveals and video meeting requests. Your journey to finding your forever begins now.
        </p>

        {/* What's unlocked */}
        <div style={{ background: c.navyMid, border: `1px solid ${c.border}`, borderRadius: '12px', padding: '1.5rem 1.75rem', marginBottom: '2.25rem', textAlign: 'left' }}>
          <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: c.goldLight, margin: '0 0 1rem' }}>
            ✦ Now unlocked for you
          </p>
          {[
            '✓  Reveal face photos of members you like',
            '✓  See who has revealed your photo',
            '✓  Request video meetings with preferred date & time',
            '✓  Unlimited profile discovery',
          ].map(item => (
            <p key={item} style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.15rem', color: c.ivory, margin: '0 0 0.65rem', lineHeight: 1.55 }}>
              {item}
            </p>
          ))}
        </div>

        {/* CTA + countdown */}
        <Link href="/discover"
          style={{ display: 'inline-block', padding: '1rem 3rem', background: `linear-gradient(135deg, #e8c876, ${c.goldLight})`, color: c.navy, fontFamily: 'Raleway, sans-serif', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', borderRadius: '6px', textDecoration: 'none', boxShadow: '0 4px 20px rgba(201,168,76,0.3)' }}>
          Start Discovering →
        </Link>

        <p style={{ marginTop: '1rem', fontFamily: 'Raleway, sans-serif', fontSize: '0.68rem', color: 'rgba(189,181,166,0.5)', letterSpacing: '0.06em' }}>
          Redirecting in {secs}s…
        </p>
        <p style={{ marginTop: '0.25rem', fontFamily: 'Raleway, sans-serif', fontSize: '0.68rem', color: 'rgba(189,181,166,0.4)', letterSpacing: '0.08em' }}>
          Monthly subscription · Cancel anytime before next billing date
        </p>
      </main>
    </div>
  )
}
