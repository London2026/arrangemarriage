'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const c = {
  cream: '#f4f1eb', navy: '#0d1f3c', navyMid: '#1a3a5c',
  burgundy: '#1b3a6b', gold: '#8b6914', goldLight: '#c9a84c',
  sepia: '#5a6e82', border: 'rgba(13,31,60,0.15)', rose: '#9e2a2b',
}

const STYLE = `
  .auth-page { min-height:100dvh; background:#f4f1eb; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:2rem 1rem; box-sizing:border-box; }
  .auth-logo { width:auto; height:140px; max-width:340px; object-fit:contain; display:block; margin:0 auto 0.5rem; mix-blend-mode:multiply; }
  .auth-card { width:100%; max-width:420px; background:#fff; border-radius:10px; box-shadow:0 16px 60px rgba(13,31,60,0.12); border:1px solid rgba(13,31,60,0.15); overflow:hidden; }
  .auth-card-head { padding:1.8rem 2rem 1.4rem; border-bottom:1px solid rgba(13,31,60,0.15); text-align:center; background:#f4f1eb; }
  .auth-card-body { padding:1.75rem 2rem; }
  .auth-lbl { display:block; font-family:Raleway,sans-serif; font-size:0.65rem; font-weight:600; letter-spacing:0.2em; text-transform:uppercase; color:#2c4a6e; margin-bottom:0.45rem; }
  .auth-inp { width:100%; padding:0.8rem 0.9rem; border:1px solid rgba(13,31,60,0.18); background:rgba(244,241,235,0.4); color:#0d1f3c; font-size:1rem; font-family:"Cormorant Garamond",Georgia,serif; outline:none; border-radius:4px; box-sizing:border-box; transition:border-color 0.2s; }
  .auth-code-inp { font-size:2rem; text-align:center; letter-spacing:0.4em; font-family:"Courier New",monospace; font-weight:700; padding:0.9rem; }
  .auth-btn { width:100%; padding:0.9rem; border:none; border-radius:4px; font-family:Raleway,sans-serif; font-size:0.7rem; font-weight:600; letter-spacing:0.15em; text-transform:uppercase; cursor:pointer; transition:background 0.2s; }
  .auth-footer { margin-top:1rem; font-family:Raleway,sans-serif; font-size:0.62rem; letter-spacing:0.1em; color:#5a6e82; text-align:center; }
  .auth-link-row { text-align:center; margin-top:1.25rem; }
  .auth-link-row p { font-family:"Cormorant Garamond",serif; font-size:1rem; color:#5a6e82; margin:0; }
  .auth-sub-btns { text-align:center; margin-top:1.25rem; display:flex; flex-direction:column; gap:0.5rem; }
  .auth-sub-btn { font-family:Raleway,sans-serif; font-size:0.65rem; letter-spacing:0.08em; background:none; border:none; cursor:pointer; text-decoration:underline; padding:0.25rem 0; }
  @media (max-width:600px) {
    .auth-page { justify-content:flex-start; padding-top:1.25rem; padding-bottom:1.5rem; }
    .auth-logo { width:auto !important; height:110px !important; margin-bottom:0.5rem; mix-blend-mode:multiply; }
    .auth-card-head { padding:1.25rem 1rem 1rem !important; }
    .auth-card-body { padding:1.25rem 1rem !important; }
    .auth-card-head h2 { font-size:1.4rem !important; }
    .auth-code-inp { font-size:1.6rem !important; letter-spacing:0.3em !important; }
    .auth-btn { font-size:0.75rem !important; padding:0.85rem !important; }
    .auth-sub-btn { font-size:0.7rem !important; padding:0.4rem 0 !important; }
  }
`

export default function SignupPage() {
  const [step, setStep] = useState<'details' | 'code'>('details')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function sendCode(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Please enter your name.'); return }
    if (!email.trim()) { setError('Please enter your email address.'); return }
    setLoading(true); setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true, data: { full_name: name.trim() } },
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    setStep('code')
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault()
    if (code.length !== 8) { setError('Please enter the full 8-digit code.'); return }
    setLoading(true); setError('')
    const supabase = createClient()
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim(), token: code, type: 'email',
    })
    if (error) { setLoading(false); setError('Invalid or expired code. Please check your email and try again.'); return }
    if (data.user) {
      await supabase.auth.updateUser({ data: { full_name: name.trim() } })
      router.push('/auth/redirect')
    }
  }

  const errBox = error ? (
    <div style={{ background: 'rgba(158,42,43,0.07)', border: '1px solid rgba(158,42,43,0.2)', borderRadius: '4px', padding: '0.65rem 0.9rem', marginBottom: '1rem', color: c.rose, fontSize: '0.9rem', fontFamily: '"Cormorant Garamond",serif', textAlign: 'center' }}>
      {error}
    </div>
  ) : null

  if (step === 'code') {
    return (
      <div className="auth-page">
        <style>{STYLE}</style>
        <img src="/arrangemarriage-logo.png" alt="Arrange Marriage" className="auth-logo" />
        <div className="auth-card">
          <div className="auth-card-head">
            <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>📬</div>
            <h2 style={{ fontFamily: 'var(--font-playfair,"Playfair Display",serif)', fontSize: '1.5rem', fontWeight: 600, color: c.navy, margin: '0 0 0.2rem' }}>Enter your code</h2>
            <p style={{ fontFamily: '"Cormorant Garamond",serif', fontSize: '0.95rem', fontStyle: 'italic', color: c.sepia, margin: 0 }}>
              We sent a 8-digit code to <strong style={{ color: c.navy, fontStyle: 'normal' }}>{email}</strong>
            </p>
          </div>
          <div className="auth-card-body">
            <form onSubmit={verifyCode}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="auth-lbl">Verification Code</label>
                <input type="text" inputMode="numeric" maxLength={8} value={code} autoFocus
                  onChange={e => { setCode(e.target.value.replace(/\D/g, '').slice(0, 8)); setError('') }}
                  placeholder="00000000"
                  className="auth-inp auth-code-inp"
                  onFocus={e => (e.target.style.borderColor = '#1b3a6b')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(13,31,60,0.18)')} />
              </div>
              {errBox}
              <button type="submit" disabled={loading || code.length !== 8} className="auth-btn"
                style={{ background: (loading || code.length !== 8) ? c.navyMid : c.navy, color: c.goldLight, cursor: (loading || code.length !== 8) ? 'default' : 'pointer' }}>
                {loading ? 'Verifying…' : 'Verify & Continue →'}
              </button>
            </form>
            <div className="auth-sub-btns">
              <button className="auth-sub-btn" style={{ color: c.burgundy }} onClick={async () => {
                setError(''); setCode('')
                const supabase = createClient()
                await supabase.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true, data: { full_name: name.trim() } } })
                setError('A new code has been sent to your email.')
              }}>Resend code</button>
              <button className="auth-sub-btn" style={{ color: c.sepia }}
                onClick={() => { setStep('details'); setCode(''); setError('') }}>
                ← Go back
              </button>
            </div>
          </div>
        </div>
        <p className="auth-footer">Check your spam folder if you don&apos;t see the email</p>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <style>{STYLE}</style>
      <img src="/arrangemarriage-logo.png" alt="Arrange Marriage" className="auth-logo" />
      <div className="auth-card">
        <div className="auth-card-head">
          <h2 style={{ fontFamily: 'var(--font-playfair,"Playfair Display",serif)', fontSize: '1.6rem', fontWeight: 600, color: c.navy, margin: '0 0 0.2rem' }}>Begin Your Journey</h2>
          <p style={{ fontFamily: '"Cormorant Garamond",serif', fontSize: '1rem', color: c.sepia, margin: 0, fontStyle: 'italic' }}>Create your profile in minutes</p>
        </div>
        <div className="auth-card-body">
          <form onSubmit={sendCode}>
            <div style={{ marginBottom: '1.1rem' }}>
              <label className="auth-lbl">Your Name</label>
              <input type="text" value={name} required placeholder="First and last name" autoFocus
                onChange={e => { setName(e.target.value); setError('') }}
                className="auth-inp"
                onFocus={e => (e.target.style.borderColor = '#1b3a6b')}
                onBlur={e => (e.target.style.borderColor = 'rgba(13,31,60,0.18)')} />
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="auth-lbl">Email Address</label>
              <input type="email" value={email} required placeholder="you@example.com"
                onChange={e => { setEmail(e.target.value); setError('') }}
                className="auth-inp"
                onFocus={e => (e.target.style.borderColor = '#1b3a6b')}
                onBlur={e => (e.target.style.borderColor = 'rgba(13,31,60,0.18)')} />
            </div>
            {errBox}
            <button type="submit" disabled={loading} className="auth-btn"
              style={{ background: loading ? c.navyMid : c.navy, color: c.goldLight, cursor: loading ? 'default' : 'pointer' }}>
              {loading ? 'Sending…' : 'Send Verification Code →'}
            </button>
          </form>
          <div className="auth-link-row">
            <p>Already have an account?{' '}
              <Link href="/login" style={{ color: c.burgundy, fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
            </p>
          </div>
        </div>
      </div>
      <p className="auth-footer">By continuing you agree to our Terms &amp; Privacy Policy</p>
    </div>
  )
}
