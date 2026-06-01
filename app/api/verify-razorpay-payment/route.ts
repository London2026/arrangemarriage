import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature, planKey } = await request.json()

  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keySecret) return NextResponse.json({ error: 'Not configured' }, { status: 503 })

  // Verify Razorpay signature
  const expectedSig = crypto
    .createHmac('sha256', keySecret)
    .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
    .digest('hex')

  if (expectedSig !== razorpay_signature) {
    return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  await supabase.from('profiles').update({
    plan: planKey,
    stripe_customer_id: razorpay_subscription_id, // reusing existing column
    updated_at: new Date().toISOString(),
  }).eq('id', user.id)

  return NextResponse.json({ success: true })
}
