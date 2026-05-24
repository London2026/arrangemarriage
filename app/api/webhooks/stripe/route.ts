import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  const body = await request.text()
  const sig  = request.headers.get('stripe-signature')

  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {

    // ── Payment succeeded → activate plan ──────────────────────────
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId  = session.metadata?.userId ?? session.client_reference_id
      const planKey = session.metadata?.planKey

      if (userId && planKey) {
        await supabaseAdmin.from('profiles').update({
          plan: planKey,
          stripe_customer_id: session.customer as string,
          updated_at: new Date().toISOString(),
        }).eq('id', userId)
      } else if (session.metadata?.type === 'extra_meeting' && session.metadata?.user_id) {
        await supabaseAdmin.from('extra_meeting_purchases').insert({
          user_id: session.metadata.user_id,
          stripe_session_id: session.id,
        })
      }
      break
    }

    // ── Subscription renewed → keep plan active ──────────────────────
    case 'invoice.payment_succeeded': {
      const invoice      = event.data.object as Stripe.Invoice
      const customerId   = invoice.customer as string
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, plan')
        .eq('stripe_customer_id', customerId)
        .limit(1)

      if (profiles?.length) {
        await supabaseAdmin.from('profiles').update({
          updated_at: new Date().toISOString(),
        }).eq('id', profiles[0].id)
      }
      break
    }

    // ── Subscription cancelled → revert to free ─────────────────────
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId   = subscription.customer as string

      await supabaseAdmin.from('profiles').update({
        plan: 'free',
        updated_at: new Date().toISOString(),
      }).eq('stripe_customer_id', customerId)
      break
    }

    // ── Payment failed → notify but don't downgrade immediately ─────
    case 'invoice.payment_failed': {
      // Stripe will retry automatically; downgrade happens on subscription.deleted
      console.warn('Payment failed for customer:', (event.data.object as Stripe.Invoice).customer)
      break
    }
  }

  return NextResponse.json({ received: true })
}

// Stripe requires raw body — disable Next.js body parsing
export const config = { api: { bodyParser: false } }
