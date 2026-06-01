import Razorpay from 'razorpay'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const keyId     = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keyId || !keySecret) {
    return NextResponse.json({ error: 'Razorpay not configured' }, { status: 503 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('stripe_customer_id').eq('id', user.id).single()

  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
  }

  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret })
  // cancel_at_cycle_end = true → cancels at next billing date, not immediately
  await razorpay.subscriptions.cancel(profile.stripe_customer_id, true)

  return NextResponse.json({ success: true })
}
