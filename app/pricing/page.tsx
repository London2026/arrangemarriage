'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { selectPlan } from './actions'

declare global {
  interface Window { Razorpay: new (options: Record<string, unknown>) => { open(): void } }
}

function loadRazorpay(): Promise<boolean> {
  return new Promise(resolve => {
    if (typeof window !== 'undefined' && window.Razorpay) { resolve(true); return }
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })
}

const c = {
  navy: '#0d1f3c', navyMid: '#152240', cream: '#f4f1eb',
  gold: '#8b6914', goldLight: '#c9a84c', ivory: '#f5f0e6',
  ivoryDim: '#bdb5a6', sepia: '#5a6e82', border: 'rgba(201,168,76,0.18)',
}

const plans = [
  {
    key: 'free',
    name: 'Free Trial',
    price: '₹0',
    period: '',
    billing: 'No credit card required · Valid for 1 month',
    tagline: 'Try One Month for Free · एक महीना मुफ़्त',
    cta: 'Start Free Trial · शुरू करें',
    highlighted: false,
    meetings: 2,
    likes: 5,
    features: [
      { text: 'Full profile with voice introduction', included: true },
      { text: 'Browse & discover all profiles', included: true },
      { text: '5 profile likes  ·  5 प्रोफ़ाइल लाइक', included: true },
      { text: '5 photo reveals  ·  5 फोटो रिवील', included: true },
      { text: '2 video meetings — request or accept  ·  2 वीडियो मीटिंग', included: true },
      { text: 'After 1 month, upgrade to continue your journey', included: true },
    ],
  },
  {
    key: 'starter',
    name: 'Starter',
    price: '₹350',
    period: '/month',
    billing: 'Billed ₹350 every month',
    tagline: 'Begin your journey',
    cta: 'Get Started',
    highlighted: false,
    meetings: 4,
    likes: 10,
    features: [
      { text: 'Full profile with voice introduction', included: true },
      { text: 'Back-side photo upload (2 photos)', included: true },
      { text: 'Browse & discover all profiles', included: true },
      { text: '10 profile likes per month', included: true },
      { text: 'Reveal face photos (unlimited)', included: true },
      { text: 'See who revealed your photo', included: true },
      { text: '4 video meetings/month (mutual like required)', included: true },
    ],
  },
  {
    key: 'standard',
    name: 'Premium',
    price: '₹550',
    period: '/month',
    billing: 'Billed ₹550 every month',
    tagline: 'Most popular',
    cta: 'Start Premium',
    highlighted: true,
    meetings: 8,
    likes: 15,
    features: [
      { text: 'Full profile with voice introduction', included: true },
      { text: 'Back-side photo upload (2 photos)', included: true },
      { text: 'Browse & discover all profiles', included: true },
      { text: '15 profile likes per month', included: true },
      { text: 'Reveal face photos (unlimited)', included: true },
      { text: 'See who revealed your photo', included: true },
      { text: '8 video meetings/month (mutual like required)', included: true },
    ],
  },
]

function PlanCard({ plan, onSelect, pending, stripeLoading }: {
  plan: typeof plans[0]
  onSelect: (key: string) => void
  pending: boolean
  stripeLoading: boolean
}) {
  const isFree = plan.key === 'free'
  return (
    <div style={{ position: 'relative', background: isFree ? 'rgba(8,40,20,0.45)' : c.navyMid, border: plan.highlighted ? `1px solid ${c.goldLight}` : isFree ? '1px solid rgba(80,200,100,0.22)' : `1px solid ${c.border}`, borderRadius: '12px', display: 'flex', flexDirection: 'column', boxShadow: plan.highlighted ? '0 0 40px rgba(201,168,76,0.12), 0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.4)' }}>

      {plan.highlighted && (
        <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: `linear-gradient(135deg, #e8c876, ${c.goldLight})`, color: c.navy, fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.25rem 1rem', borderRadius: '20px', whiteSpace: 'nowrap' }}>
          ✦ Most Popular
        </div>
      )}
      {isFree && (
        <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(8,50,20,0.95)', border: '1px solid rgba(80,200,100,0.35)', color: 'rgba(100,220,120,0.9)', fontFamily: 'Raleway, sans-serif', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.25rem 1rem', borderRadius: '20px', whiteSpace: 'nowrap' }}>
          ✦ 1 Month Free · एक महीना मुफ़्त
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '1.75rem 1.5rem 1.25rem', borderBottom: `1px solid rgba(201,168,76,0.1)` }}>
        <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.58rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: plan.highlighted ? c.goldLight : isFree ? 'rgba(100,210,120,0.85)' : c.ivoryDim, margin: '0 0 0.4rem' }}>{plan.tagline}</p>
        <h2 style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '1.6rem', fontWeight: 600, color: c.ivory, margin: '0 0 1rem' }}>{plan.name}</h2>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginBottom: '0.2rem' }}>
          <span style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '2.5rem', fontWeight: 700, color: plan.highlighted ? c.goldLight : c.ivory }}>{plan.price}</span>
          {plan.period && <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.7rem', color: c.ivoryDim }}>{plan.period}</span>}
        </div>
        <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', color: c.ivoryDim, margin: '0 0 1rem', letterSpacing: '0.05em' }}>{plan.billing}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.55rem 0.9rem', background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '8px' }}>
            <span style={{ fontSize: '1.1rem' }}>❤️</span>
            <div>
              <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', fontWeight: 600, color: c.ivory, margin: 0 }}>{(plan as typeof plan & { likes: number }).likes} profile likes/month</p>
              <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.55rem', color: c.ivoryDim, margin: 0 }}>like to unlock meetings</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.55rem 0.9rem', background: 'rgba(201,168,76,0.06)', border: `1px solid ${c.border}`, borderRadius: '8px' }}>
            <span style={{ fontSize: '1.1rem' }}>🎥</span>
            <div>
              <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', fontWeight: 600, color: c.ivory, margin: 0 }}>{plan.meetings} video meeting{plan.meetings !== 1 ? 's' : ''}/month</p>
              <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.55rem', color: c.ivoryDim, margin: 0 }}>mutual like required</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <ul style={{ padding: '1.25rem 1.5rem', flex: 1, margin: 0, listStyle: 'none' }}>
        {plan.features.map(f => (
          <li key={f.text} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', marginBottom: '0.65rem' }}>
            <span style={{ color: f.included ? c.goldLight : 'rgba(90,110,130,0.4)', fontSize: '0.8rem', flexShrink: 0, marginTop: '0.1rem' }}>
              {f.included ? '✓' : '✕'}
            </span>
            <span style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '0.95rem', color: f.included ? c.ivory : c.sepia, lineHeight: 1.4, opacity: f.included ? 1 : 0.6 }}>
              {f.text}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <div style={{ padding: '0 1.5rem 1.75rem' }}>
        <button
          onClick={() => onSelect(plan.key)}
          disabled={pending}
          style={{ display: 'block', width: '100%', padding: '0.85rem', minHeight: '44px', textAlign: 'center', borderRadius: '6px', fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: pending ? 'default' : 'pointer', transition: 'all 0.2s', border: 'none', opacity: pending ? 0.7 : 1, ...(plan.highlighted ? { background: `linear-gradient(135deg, #e8c876, ${c.goldLight})`, color: c.navy, boxShadow: '0 4px 16px rgba(201,168,76,0.25)' } : plan.key === 'free' ? { background: 'transparent', border: `1px solid rgba(201,168,76,0.25)`, color: c.ivoryDim } : { border: `1px solid rgba(201,168,76,0.35)`, color: c.goldLight, background: 'transparent' }) }}>
          {pending ? 'Please wait…' : stripeLoading && plan.key !== 'free' ? 'Redirecting…' : plan.cta}
        </button>
      </div>
    </div>
  )
}

export default function PricingPage() {
  const [pending, startTransition] = useTransition()
  const [stripeLoading, setStripeLoading] = useState(false)
  const [stripeError, setStripeError] = useState('')
  const router = useRouter()

  async function handleSelect(planKey: string) {
    setStripeError('')

    // Free plan — no payment needed
    if (planKey === 'free') {
      startTransition(async () => { await selectPlan('free') })
      return
    }

    // Paid plans — open Razorpay checkout
    setStripeLoading(true)
    try {
      const loaded = await loadRazorpay()
      if (!loaded) throw new Error('Could not load payment gateway. Please try again.')

      const res = await fetch('/api/create-razorpay-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planKey }),
      })
      if (!res.ok) {
        if (res.status === 503) {
          // Payment gateway not configured yet — activate the plan directly for testing
          setStripeLoading(false)
          startTransition(async () => { await selectPlan(planKey) })
          return
        }
        const err = await res.json()
        throw new Error(err.error || 'Could not start checkout')
      }
      const { subscriptionId, keyId } = await res.json()
      const planName = planKey === 'starter' ? 'Starter — ₹350/month' : 'Premium — ₹550/month'

      const rzp = new window.Razorpay({
        key: keyId,
        subscription_id: subscriptionId,
        name: 'Arrange Marriage',
        description: planName,
        image: '/arrangemarriage-logo.png',
        theme: { color: '#1D5252' },
        handler: async (response: Record<string, string>) => {
          try {
            const verify = await fetch('/api/verify-razorpay-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...response, planKey }),
            })
            if (!verify.ok) throw new Error('Payment verification failed')
            router.push('/pricing/success')
          } catch {
            setStripeError('Payment verification failed. Please contact support.')
          } finally {
            setStripeLoading(false)
          }
        },
        modal: { ondismiss: () => setStripeLoading(false) },
      })
      rzp.open()
    } catch (err) {
      setStripeError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setStripeLoading(false)
    }
  }

  const isBusy = pending || stripeLoading

  return (
    <div style={{ minHeight: '100vh', background: c.navy }}>
      <style>{`
        .pricing-plans-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; margin-bottom: 1.25rem; }
        .pricing-trust-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; }
        .pricing-h1 { font-size: 2.6rem; }
        @media (max-width: 700px) {
          .pricing-plans-grid { grid-template-columns: 1fr; }
          .pricing-trust-grid { grid-template-columns: 1fr; }
          .pricing-h1 { font-size: 2rem !important; }
        }
        @media (max-width: 480px) {
          .pricing-h1 { font-size: 1.7rem !important; }
        }
      `}</style>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(201,168,76,0.08) 0%, transparent 65%)' }} />
      <Navigation />

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '7rem 1rem 5rem' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span style={{ display: 'inline-block', fontFamily: 'Raleway, sans-serif', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '0.3rem 1rem', background: 'rgba(80,200,100,0.07)', border: '1px solid rgba(80,200,100,0.2)', color: 'rgba(100,210,120,0.85)', borderRadius: '20px', marginBottom: '1rem' }}>
            ✦ No credit card required · क्रेडिट कार्ड की ज़रूरत नहीं
          </span>
          <h1 className="pricing-h1" style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontWeight: 700, color: c.ivory, margin: '0 0 0.5rem', lineHeight: 1.2 }}>
            Try One Month for Free
          </h1>
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.25rem', fontStyle: 'italic', color: 'rgba(189,181,166,0.6)', margin: '0 0 0.5rem' }}>
            एक महीना मुफ़्त आज़माएं — देखें कि यह आपके लिए सही है या नहीं
          </p>
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.05rem', fontStyle: 'italic', color: c.ivoryDim, maxWidth: '460px', margin: '0 auto 1.5rem' }}>
            Explore Arrange Marriage with no commitment. If you enjoy the experience, upgrade to a paid plan after your free month.
          </p>
          <div style={{ height: '1px', width: '80px', background: `linear-gradient(to right, transparent, ${c.goldLight}, transparent)`, margin: '0 auto' }} />
        </div>

        {/* Stripe error */}
        {stripeError && (
          <div style={{ marginBottom: '1.25rem', padding: '0.75rem 1rem', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: '8px', color: '#f87171', fontFamily: '"Cormorant Garamond", serif', fontSize: '1rem', textAlign: 'center' }}>
            {stripeError}
          </div>
        )}

        {/* 3 plan cards */}
        <div className="pricing-plans-grid">
          {plans.map(plan => (
            <PlanCard key={plan.key} plan={plan} onSelect={handleSelect} pending={isBusy} stripeLoading={stripeLoading} />
          ))}
        </div>

        {/* Extra meetings */}
        <div style={{ background: c.navyMid, border: `1px solid ${c.border}`, borderRadius: '12px', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(201,168,76,0.08)', border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>➕</div>
            <div>
              <p style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '1rem', fontWeight: 600, color: c.ivory, margin: '0 0 0.2rem' }}>Need more meetings?</p>
              <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '0.9rem', fontStyle: 'italic', color: c.ivoryDim, margin: 0 }}>Buy additional video meeting requests anytime on Starter or Standard.</p>
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p style={{ fontFamily: 'var(--font-playfair, "Playfair Display", serif)', fontSize: '1.75rem', fontWeight: 700, color: c.goldLight, margin: '0 0 0.1rem' }}>₹150</p>
            <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.58rem', color: c.ivoryDim, letterSpacing: '0.08em', textTransform: 'uppercase' }}>per extra meeting</p>
          </div>
        </div>

        {/* Trust */}
        <div className="pricing-trust-grid" style={{ background: c.navyMid, border: `1px solid rgba(201,168,76,0.1)`, borderRadius: '12px', padding: '1.25rem 1.5rem' }}>
          {[
            { icon: '🔒', label: 'Privacy First', desc: 'Face photos hidden until mutual reveal' },
            { icon: '🎙️', label: 'Voice-Led', desc: 'Personality before appearance' },
            { icon: '↩️', label: 'Cancel Anytime', desc: 'No lock-in, no hidden fees' },
          ].map(t => (
            <div key={t.label} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
              <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>{t.icon}</span>
              <div>
                <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: c.ivory, margin: '0 0 0.2rem' }}>{t.label}</p>
                <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '0.85rem', fontStyle: 'italic', color: c.ivoryDim, margin: 0 }}>{t.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', fontFamily: 'Raleway, sans-serif', fontSize: '0.58rem', letterSpacing: '0.08em', color: 'rgba(189,181,166,0.35)', marginTop: '1.5rem' }}>
          Prices in INR · Monthly subscription · Cancel before next billing date
        </p>
      </main>
    </div>
  )
}
