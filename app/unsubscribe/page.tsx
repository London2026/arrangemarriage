import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Email Preferences',
  robots: { index: false, follow: false },
}

const c = {
  navy: '#0d1f3c', gold: '#c9a84c', ivory: '#f5f0e6', ivoryDim: '#bdb5a6',
}

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string; resubscribed?: string; error?: string; uid?: string; t?: string }>
}) {
  const params = await searchParams
  const isDone         = params.done === '1'
  const isResubscribed = params.resubscribed === '1'
  const isError        = params.error === '1'
  const uid            = params.uid ?? ''
  const t              = params.t  ?? ''

  const resubUrl = uid && t ? `/api/unsubscribe?uid=${uid}&t=${t}&undo=1` : null

  return (
    <div style={{ minHeight: '100vh', background: '#07111f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '480px', width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '16px', padding: '2.5rem 2rem', textAlign: 'center' }}>

        <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: c.gold, margin: '0 0 1.25rem' }}>
          Arrange Marriage · Email Preferences
        </p>

        {isError ? (
          <>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
            <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.6rem', color: c.ivory, margin: '0 0 0.75rem', fontWeight: 600 }}>
              Invalid Link
            </h1>
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.1rem', color: c.ivoryDim, lineHeight: 1.7, margin: '0 0 2rem' }}>
              This unsubscribe link is invalid or has expired. Please use the link from your most recent email.
            </p>
          </>
        ) : isResubscribed ? (
          <>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✅</div>
            <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.6rem', color: c.ivory, margin: '0 0 0.75rem', fontWeight: 600 }}>
              You&apos;re back!
            </h1>
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.1rem', color: c.ivoryDim, lineHeight: 1.7, margin: '0 0 2rem' }}>
              You have re-subscribed to Arrange Marriage email notifications. We&apos;re glad to have you back.
            </p>
          </>
        ) : isDone ? (
          <>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📭</div>
            <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.6rem', color: c.ivory, margin: '0 0 0.75rem', fontWeight: 600 }}>
              You&apos;re unsubscribed
            </h1>
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.1rem', color: c.ivoryDim, lineHeight: 1.7, margin: '0 0 1.5rem' }}>
              You will no longer receive marketing and notification emails from Arrange Marriage. Meeting confirmations and essential account emails may still be sent.
            </p>
            {resubUrl && (
              <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.78rem', color: c.ivoryDim, margin: '0 0 2rem' }}>
                Changed your mind?{' '}
                <a href={resubUrl} style={{ color: c.gold, textDecoration: 'underline' }}>Re-subscribe</a>
              </p>
            )}
          </>
        ) : (
          <>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📬</div>
            <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.6rem', color: c.ivory, margin: '0 0 0.75rem', fontWeight: 600 }}>
              Email Preferences
            </h1>
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.1rem', color: c.ivoryDim, lineHeight: 1.7, margin: '0 0 2rem' }}>
              Use the unsubscribe link in any email we send you to manage your email preferences.
            </p>
          </>
        )}

        <Link href="/discover" style={{ display: 'inline-block', padding: '0.75rem 2rem', background: 'linear-gradient(135deg, #e8c876, #c9a84c)', color: c.navy, fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: '6px' }}>
          Back to Arrange Marriage
        </Link>
      </div>
    </div>
  )
}
