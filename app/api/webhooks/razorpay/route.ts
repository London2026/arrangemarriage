import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendAdminAlert } from '@/lib/sendEmail'

export async function POST(request: Request) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
  const serviceKey    = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!webhookSecret || !serviceKey) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  }

  const body      = await request.text()
  const signature = request.headers.get('x-razorpay-signature') ?? ''

  const expectedSig = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex')

  if (expectedSig !== signature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const event = JSON.parse(body)
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey)

  switch (event.event) {

    // ── Subscription activated / charged → set plan active ────────
    case 'subscription.activated':
    case 'subscription.charged': {
      const sub    = event.payload.subscription.entity
      const userId = sub.notes?.userId
      const planKey = sub.notes?.planKey
      if (userId && planKey) {
        const nextBillingDate = sub.current_end
          ? new Date(sub.current_end * 1000).toISOString()
          : null
        await supabase.from('profiles').update({
          plan: planKey,
          stripe_customer_id: sub.id,
          next_billing_date: nextBillingDate,
          updated_at: new Date().toISOString(),
        }).eq('id', userId)

        const { data: profile } = await supabase.from('profiles').select('full_name, phone').eq('id', userId).single()
        const planLabel = planKey === 'standard' ? 'Premium (₹550/mo)' : 'Starter (₹350/mo)'
        const eventLabel = event.event === 'subscription.activated' ? 'New subscription' : 'Subscription renewed'
        await sendAdminAlert(eventLabel, {
          Plan:    planLabel,
          Member:  profile?.full_name ?? userId,
          Phone:   profile?.phone ?? '—',
          'Next billing': nextBillingDate ? new Date(nextBillingDate).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' }) : '—',
        })
      }
      break
    }

    // ── Subscription cancelled / completed → revert to free ───────
    case 'subscription.cancelled':
    case 'subscription.completed':
    case 'subscription.halted': {
      const sub = event.payload.subscription.entity
      await supabase.from('profiles').update({
        plan: 'free',
        updated_at: new Date().toISOString(),
      }).eq('stripe_customer_id', sub.id)
      break
    }

    // ── One-time payment captured (extra meeting) ─────────────────
    case 'payment.captured': {
      const payment = event.payload.payment.entity
      if (payment.notes?.type === 'extra_meeting' && payment.notes?.user_id) {
        await supabase.from('extra_meeting_purchases').insert({
          user_id: payment.notes.user_id,
          stripe_session_id: payment.id,
        })
        const { data: profile } = await supabase.from('profiles').select('full_name, phone').eq('id', payment.notes.user_id).single()
        await sendAdminAlert('Extra meeting purchased', {
          Member:  profile?.full_name ?? payment.notes.user_id,
          Phone:   profile?.phone ?? '—',
          Amount:  payment.amount ? `₹${(payment.amount / 100).toFixed(0)}` : '—',
          'Payment ID': payment.id,
        })
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
