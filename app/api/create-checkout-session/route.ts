import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const PRICE_IDS: Record<string, string> = {
    starter:  process.env.STRIPE_STARTER_PRICE_ID ?? '',
    standard: process.env.STRIPE_STANDARD_PRICE_ID ?? '',
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { planKey } = await request.json()
  const priceId = PRICE_IDS[planKey]
  if (!priceId) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

  const origin = request.headers.get('origin') ?? 'https://soulmate.vercel.app'

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${origin}/pricing`,
    client_reference_id: user.id,
    customer_email: user.email,
    metadata: { userId: user.id, planKey },
    subscription_data: {
      metadata: { userId: user.id, planKey },
    },
  })

  return NextResponse.json({ url: session.url })
}
