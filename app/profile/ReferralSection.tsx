'use client'

const c = {
  gold: '#8b6914', goldLight: '#c9a84c',
  ivory: '#f5f0e6', ivoryDim: '#bdb5a6',
  border: 'rgba(201,168,76,0.18)', borderSub: 'rgba(201,168,76,0.08)',
}

export default function ReferralSection({ referralCode, referralCount, planBonusUntil, userId, variant = 'inline' }: {
  referralCode: string | null
  referralCount: number
  planBonusUntil: string | null
  userId: string
  /** 'inline' sits within a larger card (Profile page). 'card' renders as its own bordered, rounded card (Discover page). */
  variant?: 'inline' | 'card'
}) {
  const code = referralCode ?? userId.replace(/-/g, '').slice(0, 10).toUpperCase()
  const referralUrl = `https://www.arrangemarriage.co.in/signup?ref=${code}`
  const bonusActive = planBonusUntil && new Date(planBonusUntil) > new Date()
  const bonusDate = planBonusUntil
    ? new Date(planBonusUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  const wrapperStyle = variant === 'card'
    ? { padding: 'clamp(1.1rem, 4vw, 1.5rem) clamp(1.2rem, 5vw, 1.75rem)', background: 'linear-gradient(135deg, rgba(201,168,76,0.05), transparent)', border: `1px solid ${c.border}`, borderRadius: '14px' }
    : { padding: 'clamp(1rem, 4vw, 1.4rem) clamp(1rem, 5vw, 1.75rem)', borderTop: `1px solid ${c.borderSub}` }

  return (
    <div style={wrapperStyle}>
      <p style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: variant === 'card' ? '1.3rem' : '0.78rem', fontWeight: variant === 'card' ? 600 : 700, letterSpacing: variant === 'card' ? 0 : '0.16em', textTransform: variant === 'card' ? 'none' : 'uppercase', color: variant === 'card' ? c.ivory : c.goldLight, margin: '0 0 0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span>🎁</span> {variant === 'card' ? 'Invite & Earn' : 'Refer a Friend — Earn Free Months'}
      </p>

      <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: variant === 'card' ? 'italic' : 'normal', fontSize: '1.05rem', color: c.ivoryDim, lineHeight: 1.7, margin: '0 0 1rem' }}>
        {variant === 'card'
          ? <>Share your link — earn <strong style={{ color: c.ivory, fontStyle: 'normal' }}>1 free month of Starter</strong> per friend who joins</>
          : <>Share your link. Every friend who subscribes earns you <strong style={{ color: c.ivory }}>one free month</strong> on your plan — no limit on how many you can earn.</>}
      </p>

      <div style={{ background: 'rgba(201,168,76,0.06)', border: `1px solid ${c.border}`, borderRadius: 8, padding: '0.9rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <span style={{ fontFamily: '"Courier New", monospace', fontSize: '0.82rem', color: c.goldLight, flex: 1, wordBreak: 'break-all' }}>{referralUrl}</span>
        <button
          onClick={() => { navigator.clipboard.writeText(referralUrl) }}
          style={{ background: 'rgba(201,168,76,0.15)', border: `1px solid ${c.border}`, borderRadius: 4, color: c.goldLight, fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.4rem 0.9rem', cursor: 'pointer', flexShrink: 0 }}>
          Copy Link
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${c.borderSub}`, borderRadius: 6, padding: '0.75rem 1.25rem', textAlign: 'center' }}>
          <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.8rem', fontWeight: 700, color: c.goldLight, lineHeight: 1 }}>{referralCount}</div>
          <div style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: c.ivoryDim, marginTop: '0.3rem' }}>Successful Referrals</div>
        </div>
        {bonusActive && bonusDate && (
          <div style={{ background: 'rgba(46,125,82,0.08)', border: '1px solid rgba(46,125,82,0.3)', borderRadius: 6, padding: '0.75rem 1.25rem' }}>
            <div style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#4ade80', marginBottom: '0.25rem' }}>Free Bonus Active Until</div>
            <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '1rem', color: '#4ade80', fontWeight: 600 }}>{bonusDate}</div>
          </div>
        )}
      </div>
    </div>
  )
}
