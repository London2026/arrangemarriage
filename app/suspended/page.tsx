import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Account Suspended — Arrange Marriage',
  robots: { index: false, follow: false },
}

const c = {
  navy: '#0d1f3c', gold: '#c9a84c', ivory: '#f5f0e6', ivoryDim: '#bdb5a6',
}

export default function SuspendedPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#07111f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '480px', width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '16px', padding: '2.5rem 2rem', textAlign: 'center' }}>
        <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: c.gold, margin: '0 0 1.25rem' }}>
          Arrange Marriage
        </p>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⛔</div>
        <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.6rem', color: c.ivory, margin: '0 0 0.75rem', fontWeight: 600 }}>
          Account Suspended
        </h1>
        <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.1rem', color: c.ivoryDim, lineHeight: 1.7, margin: '0 0 1.5rem' }}>
          Your account has been suspended by the Arrange Marriage team due to a violation of our community guidelines.
        </p>
        <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1rem', color: c.ivoryDim, lineHeight: 1.7, margin: '0 0 2rem' }}>
          If you believe this is an error, please contact us at{' '}
          <a href="mailto:support@arrangemarriage.co.in" style={{ color: c.gold, textDecoration: 'underline' }}>
            support@arrangemarriage.co.in
          </a>
        </p>
        <Link href="/contact" style={{ display: 'inline-block', padding: '0.75rem 2rem', background: 'linear-gradient(135deg, #e8c876, #c9a84c)', color: c.navy, fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: '6px' }}>
          Contact Support
        </Link>
      </div>
    </div>
  )
}
