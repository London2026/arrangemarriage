'use client'

import { useState } from 'react'
import { deleteProfile } from './actions'

const c = {
  gold: '#c9a84c', ivory: '#f5f0e6', ivoryDim: '#bdb5a6',
  border: 'rgba(201,168,76,0.18)', navy: '#0d1f3c',
}

interface Props {
  plan: string | null
  hasSubscription: boolean
}

export default function ProfileActions({ plan, hasSubscription }: Props) {
  const [cancelStep, setCancelStep]   = useState<'idle' | 'confirm' | 'loading' | 'done'>('idle')
  const [deleteStep, setDeleteStep]   = useState<'idle' | 'confirm' | 'loading'>('idle')
  const [cancelError, setCancelError] = useState('')
  const [deleteError, setDeleteError] = useState('')

  const planLabel = plan === 'standard' ? 'Standard' : plan === 'starter' ? 'Starter' : 'Free'

  async function handleCancelSubscription() {
    setCancelStep('loading')
    setCancelError('')
    try {
      const res = await fetch('/api/cancel-razorpay-subscription', { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Something went wrong')
      }
      setCancelStep('done')
    } catch (err: unknown) {
      setCancelError(err instanceof Error ? err.message : 'Something went wrong')
      setCancelStep('confirm')
    }
  }

  async function handleDeleteProfile() {
    setDeleteStep('loading')
    setDeleteError('')
    try {
      await deleteProfile()
      // deleteProfile calls redirect('/') — the above line should not return
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Something went wrong')
      setDeleteStep('confirm')
    }
  }

  const divider = <div style={{ height: '1px', background: 'rgba(201,168,76,0.08)', margin: '1.25rem 0' }} />

  return (
    <div style={{ background: 'rgba(13,31,60,0.3)', border: `1px solid ${c.border}`, borderRadius: '12px', padding: '1.5rem 1.75rem', marginBottom: '2.5rem' }}>

      <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: c.gold, margin: '0 0 1.25rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
        ⚙ Account Settings
      </p>

      {/* Cancel Subscription */}
      {hasSubscription && plan !== 'free' && (
        <>
          {cancelStep === 'idle' && (
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.1rem', color: c.ivory, margin: '0 0 0.3rem' }}>Cancel Subscription</p>
                <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1rem', color: c.ivoryDim, margin: 0, lineHeight: 1.6 }}>
                  Your {planLabel} Plan will remain active until the end of the current billing period, after which your account will revert to the free plan.
                </p>
              </div>
              <button
                onClick={() => setCancelStep('confirm')}
                style={{ flexShrink: 0, padding: '0.6rem 1.25rem', background: 'rgba(201,168,76,0.08)', border: `1px solid rgba(201,168,76,0.35)`, color: c.gold, fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Cancel Plan
              </button>
            </div>
          )}

          {cancelStep === 'confirm' && (
            <div style={{ background: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '8px', padding: '1.1rem 1.25rem' }}>
              <p style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.1rem', color: c.ivory, margin: '0 0 0.4rem' }}>Are you sure you wish to cancel?</p>
              <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1rem', color: c.ivoryDim, margin: '0 0 1rem', lineHeight: 1.6 }}>
                Your {planLabel} Plan will continue until the end of your current billing period. After that, your account will move to our free membership. You are always welcome to resubscribe at any time.
              </p>
              {cancelError && <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.78rem', color: '#f87171', margin: '0 0 0.75rem' }}>{cancelError}</p>}
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                <button
                  onClick={handleCancelSubscription}
                  style={{ padding: '0.6rem 1.25rem', background: 'rgba(201,168,76,0.12)', border: `1px solid rgba(201,168,76,0.4)`, color: c.gold, fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: '6px', cursor: 'pointer' }}>
                  Yes, Cancel Subscription
                </button>
                <button
                  onClick={() => setCancelStep('idle')}
                  style={{ padding: '0.6rem 1.25rem', background: 'transparent', border: `1px solid ${c.border}`, color: c.ivoryDim, fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: '6px', cursor: 'pointer' }}>
                  Keep My Plan
                </button>
              </div>
            </div>
          )}

          {cancelStep === 'loading' && (
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1rem', color: c.ivoryDim }}>Cancelling your subscription…</p>
          )}

          {cancelStep === 'done' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ color: '#4ade80', fontSize: '1.2rem' }}>✓</span>
              <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1rem', color: '#4ade80', margin: 0, lineHeight: 1.6 }}>
                Your subscription has been cancelled. You will retain access to your {planLabel} Plan until the end of your current billing period. We wish you all the very best on your journey.
              </p>
            </div>
          )}

          {divider}
        </>
      )}

      {/* Delete Profile */}
      {deleteStep === 'idle' && (
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.1rem', color: c.ivory, margin: '0 0 0.3rem' }}>Delete My Profile</p>
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1rem', color: c.ivoryDim, margin: 0, lineHeight: 1.6 }}>
              Permanently remove your profile, all photos, voice recordings, and personal data from Arrange Marriage. This action cannot be undone.
            </p>
          </div>
          <button
            onClick={() => setDeleteStep('confirm')}
            style={{ flexShrink: 0, padding: '0.6rem 1.25rem', background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Delete Profile
          </button>
        </div>
      )}

      {deleteStep === 'confirm' && (
        <div style={{ background: 'rgba(248,113,113,0.04)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '8px', padding: '1.1rem 1.25rem' }}>
          <p style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.1rem', color: c.ivory, margin: '0 0 0.4rem' }}>
            We are sorry to see you go
          </p>
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1rem', color: c.ivoryDim, margin: '0 0 0.5rem', lineHeight: 1.7 }}>
            If you have found your life partner — congratulations from the entire Arrange Marriage family! We wish you a lifetime of joy and togetherness.
          </p>
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1rem', color: '#f87171', margin: '0 0 1rem', lineHeight: 1.6 }}>
            Deleting your profile is permanent. All your photos, voice recordings, meeting history, and personal data will be removed immediately and cannot be recovered.
          </p>
          {deleteError && <p style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.78rem', color: '#f87171', margin: '0 0 0.75rem' }}>{deleteError}</p>}
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleDeleteProfile}
              style={{ padding: '0.6rem 1.25rem', background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.4)', color: '#f87171', fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: '6px', cursor: 'pointer' }}>
              Yes, Delete My Profile
            </button>
            <button
              onClick={() => setDeleteStep('idle')}
              style={{ padding: '0.6rem 1.25rem', background: 'transparent', border: `1px solid ${c.border}`, color: c.ivoryDim, fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: '6px', cursor: 'pointer' }}>
              Keep My Profile
            </button>
          </div>
        </div>
      )}

      {deleteStep === 'loading' && (
        <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '1rem', color: c.ivoryDim }}>
          Deleting your profile… please wait.
        </p>
      )}
    </div>
  )
}
