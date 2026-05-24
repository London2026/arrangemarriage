'use client'

import { useRef, useState, ClipboardEvent, KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Props { email?: string; phone?: string; name?: string; type: string }

const c = {
  cream: '#f4f1eb',
  navy: '#0d1f3c',
  navyMid: '#1a3a5c',
  burgundy: '#1b3a6b',
  gold: '#8b6914',
  goldLight: '#c9a84c',
  sepia: '#5a6e82',
  border: 'rgba(13,31,60,0.15)',
}

export default function VerifyForm({ email, phone, name, type }: Props) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resent, setResent] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const router = useRouter()

  const destination = email ?? phone ?? ''
  const masked = email
    ? email.replace(/(.{2}).*(@.*)/, '$1•••$2')
    : phone ? phone.replace(/(\+\d{2})\d+(\d{4})/, '$1•••••$2') : ''

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return
    const next = [...digits]
    next[index] = value.slice(-1)
    setDigits(next)
    setError('')
    if (value && index < 5) inputRefs.current[index + 1]?.focus()
    if (next.every((d) => d !== '')) handleVerify(next.join(''))
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) inputRefs.current[index - 1]?.focus()
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    const next = [...digits]
    pasted.split('').forEach((ch, i) => { next[i] = ch })
    setDigits(next)
    inputRefs.current[Math.min(pasted.length, 5)]?.focus()
    if (pasted.length === 6) handleVerify(pasted)
  }

  async function handleVerify(code: string) {
    setLoading(true)
    setError('')
    const supabase = createClient()
    try {
      let result
      if (email) result = await supabase.auth.verifyOtp({ email, token: code, type: 'email' })
      else if (phone) result = await supabase.auth.verifyOtp({ phone, token: code, type: 'sms' })
      else throw new Error('No contact provided')
      if (result?.error) throw result.error
      router.push(type === 'signup' ? '/pricing' : '/discover')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid code. Please try again.')
      setDigits(Array(6).fill(''))
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    const supabase = createClient()
    if (email) await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: type === 'signup' } })
    else if (phone) await supabase.auth.signInWithOtp({ phone })
    setResent(true)
    setDigits(Array(6).fill(''))
    inputRefs.current[0]?.focus()
    setTimeout(() => setResent(false), 4000)
  }

  return (
    <div style={{ minHeight: '100vh', background: c.cream, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>

      {/* Brand */}
      <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.4rem' }}>💘</div>
          <h1 style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '2.4rem', fontWeight: 700, color: c.navy, margin: '0 0 0.3rem', letterSpacing: '0.02em' }}>
            Soul Mate
          </h1>
        </Link>
        <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.62rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: c.gold, margin: 0 }}>
          ✦ Find Your Forever ✦
        </p>
      </div>

      {/* Card */}
      <div style={{ width: '100%', maxWidth: '440px', background: '#fff', borderRadius: '10px', boxShadow: '0 16px 60px rgba(13,31,60,0.12)', border: `1px solid ${c.border}`, overflow: 'hidden' }}>

        {/* Card header */}
        <div style={{ padding: '1.8rem 2rem 1.4rem', borderBottom: `1px solid ${c.border}`, textAlign: 'center', background: c.cream }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✉️</div>
          <h2 style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '1.6rem', fontWeight: 600, color: c.navy, margin: '0 0 0.2rem' }}>
            Check Your {email ? 'Inbox' : 'Messages'}
          </h2>
          <p style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: '1rem', color: c.sepia, margin: '0 0 0.25rem', fontStyle: 'italic' }}>
            We sent a 6-digit code to
          </p>
          <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.8rem', fontWeight: 600, color: c.burgundy, margin: 0 }}>
            {masked || destination}
          </p>
        </div>

        {/* OTP input */}
        <div style={{ padding: '1.75rem 2rem' }}>
          <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', marginBottom: '1.25rem' }}>
            {digits.map((digit, i) => (
              <input key={i}
                ref={(el) => { inputRefs.current[i] = el }}
                type="text" inputMode="numeric" maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={handlePaste}
                disabled={loading}
                style={{ width: '46px', height: '54px', textAlign: 'center', fontSize: '1.4rem', fontWeight: 600, fontFamily: '"Playfair Display", serif', border: `1px solid ${digit ? c.burgundy : 'rgba(13,31,60,0.18)'}`, background: 'rgba(244,241,235,0.4)', color: c.navy, borderRadius: '6px', outline: 'none', transition: 'border-color 0.2s' }}
                onFocus={(e) => (e.target.style.borderColor = c.burgundy)}
                onBlur={(e) => (e.target.style.borderColor = digit ? c.burgundy : 'rgba(13,31,60,0.18)')} />
            ))}
          </div>

          {loading && <p style={{ textAlign: 'center', color: c.sepia, fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', marginBottom: '0.75rem' }}>Verifying…</p>}

          {error && (
            <div style={{ background: 'rgba(158,42,43,0.07)', border: '1px solid rgba(158,42,43,0.2)', borderRadius: '4px', padding: '0.65rem 0.9rem', marginBottom: '1rem', color: '#9e2a2b', fontSize: '0.85rem', textAlign: 'center', fontFamily: '"Cormorant Garamond", serif' }}>
              {error}
            </div>
          )}

          {resent && (
            <p style={{ textAlign: 'center', color: '#2e7d32', fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', marginBottom: '0.75rem' }}>
              ✓ A new code has been sent
            </p>
          )}

          <div style={{ borderTop: `1px solid ${c.border}`, paddingTop: '1.25rem', textAlign: 'center' }}>
            <p style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: '1rem', color: c.sepia, margin: '0 0 0.5rem' }}>
              Didn&apos;t receive it?{' '}
              <button onClick={handleResend} style={{ background: 'none', border: 'none', color: c.burgundy, fontWeight: 600, cursor: 'pointer', fontFamily: '"Cormorant Garamond", serif', fontSize: '1rem' }}>
                Resend code
              </button>
            </p>
            <Link href={type === 'signup' ? '/signup' : '/login'} style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', letterSpacing: '0.1em', color: c.sepia, textDecoration: 'none' }}>
              ← Go back
            </Link>
          </div>
        </div>
      </div>

      <p style={{ marginTop: '1.25rem', fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', letterSpacing: '0.1em', color: c.sepia, textAlign: 'center' }}>
        By continuing you agree to our Terms &amp; Privacy Policy
      </p>
    </div>
  )
}
