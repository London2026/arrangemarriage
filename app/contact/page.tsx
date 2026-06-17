'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const c = {
  cream: '#FFF9F2', navy: '#0D2B2B', navyMid: '#1A3D3D',
  teal: '#1D5252', gold: '#9A7020', goldLight: '#D4A835',
  sepia: '#5A7870', border: 'rgba(29,82,82,0.15)', rose: '#C47820',
}

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Please fill in all required fields.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inp = {
    width: '100%', padding: '0.85rem 1rem',
    border: `1px solid ${c.border}`, borderRadius: '6px',
    background: 'rgba(255,249,242,0.6)', color: c.navy,
    fontSize: '1rem', fontFamily: '"Cormorant Garamond", Georgia, serif',
    outline: 'none', boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s',
  }

  const lbl = {
    display: 'block', fontFamily: 'Raleway, sans-serif',
    fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.18em',
    textTransform: 'uppercase' as const, color: c.teal, marginBottom: '0.4rem',
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: c.cream, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🙏</div>
        <h1 style={{ fontFamily: 'var(--font-playfair,"Playfair Display",serif)', fontSize: '2rem', color: c.navy, margin: '0 0 0.75rem' }}>Message Received</h1>
        <p style={{ fontFamily: '"Cormorant Garamond",serif', fontSize: '1.15rem', color: c.sepia, maxWidth: '420px', lineHeight: 1.75 }}>
          Thank you for reaching out. We will get back to you at <strong style={{ color: c.navy }}>{form.email}</strong> within 24 hours.
        </p>
        <Link href="/" style={{ marginTop: '2rem', display: 'inline-block', padding: '0.8rem 2.5rem', background: c.navy, color: c.goldLight, fontFamily: 'Raleway,sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', borderRadius: '6px', textDecoration: 'none' }}>
          Back to Home
        </Link>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: c.cream, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 1rem 3rem' }}>

      {/* Logo */}
      <Link href="/" style={{ marginBottom: '2rem', display: 'block' }}>
        <Image src="/arrangemarriage-logo.png" alt="Arrange Marriage" width={200} height={70} style={{ objectFit: 'contain' }} />
      </Link>

      {/* Card */}
      <div style={{ width: '100%', maxWidth: '540px', background: '#fff', borderRadius: '12px', boxShadow: '0 16px 60px rgba(13,31,60,0.10)', border: `1px solid ${c.border}`, overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ background: c.navy, padding: '1.75rem 2rem', textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'var(--font-playfair,"Playfair Display",serif)', fontSize: '1.6rem', fontWeight: 600, color: c.goldLight, margin: '0 0 0.2rem' }}>Get in Touch</h1>
          <p style={{ fontFamily: '"Cormorant Garamond",serif', fontSize: '1rem', color: 'rgba(255,249,242,0.7)', fontStyle: 'italic', margin: 0 }}>
            We typically respond within 24 hours
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={lbl}>Your Name *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Arjun Sharma" required style={inp}
                onFocus={e => (e.target.style.borderColor = c.teal)}
                onBlur={e => (e.target.style.borderColor = `rgba(29,82,82,0.15)`)} />
            </div>
            <div>
              <label style={lbl}>Email Address *</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" required style={inp}
                onFocus={e => (e.target.style.borderColor = c.teal)}
                onBlur={e => (e.target.style.borderColor = `rgba(29,82,82,0.15)`)} />
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={lbl}>Subject</label>
            <input value={form.subject} onChange={e => set('subject', e.target.value)} placeholder="How can we help?" style={inp}
              onFocus={e => (e.target.style.borderColor = c.teal)}
              onBlur={e => (e.target.style.borderColor = `rgba(29,82,82,0.15)`)} />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={lbl}>Message *</label>
            <textarea value={form.message} onChange={e => set('message', e.target.value)} placeholder="Tell us how we can help you..." required rows={5}
              style={{ ...inp, resize: 'vertical', minHeight: '120px', fontFamily: '"Cormorant Garamond",Georgia,serif' }}
              onFocus={e => (e.target.style.borderColor = c.teal)}
              onBlur={e => (e.target.style.borderColor = `rgba(29,82,82,0.15)`)} />
          </div>

          {error && (
            <div style={{ background: 'rgba(196,120,32,0.08)', border: '1px solid rgba(196,120,32,0.25)', borderRadius: '6px', padding: '0.65rem 1rem', marginBottom: '1rem', color: c.rose, fontSize: '0.9rem', fontFamily: '"Cormorant Garamond",serif' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '0.9rem', background: loading ? c.navyMid : c.navy, color: c.goldLight, border: 'none', borderRadius: '6px', fontFamily: 'Raleway,sans-serif', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: loading ? 'default' : 'pointer', transition: 'background 0.2s' }}>
            {loading ? 'Sending…' : 'Send Message →'}
          </button>
        </form>
      </div>

      <p style={{ marginTop: '1.5rem', fontFamily: 'Raleway,sans-serif', fontSize: '0.62rem', letterSpacing: '0.1em', color: c.sepia, textAlign: 'center' }}>
        Or email us directly at{' '}
        <a href="mailto:hello@arrangemarriage.org" style={{ color: c.teal }}>hello@arrangemarriage.org</a>
      </p>
    </div>
  )
}
