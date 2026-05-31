import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const stripeKey = process.env.STRIPE_SECRET_KEY
  const priceId   = process.env.STRIPE_EXTRA_MEETING_PRICE_ID
  if (!stripeKey || !priceId) return NextResponse.json({ error: 'Not configured' }, { status: 500 })

  const stripe  = new Stripe(stripeKey)
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { type: 'extra_meeting', user_id: user.id },
    success_url: 'https://arrangemarriage.live/discover?extra=1',
    cancel_url:  'https://arrangemarriage.live/discover',
  })

  return NextResponse.json({ url: session.url })
}
