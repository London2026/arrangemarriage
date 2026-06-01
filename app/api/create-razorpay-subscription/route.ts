import Razorpay from 'razorpay'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const keyId     = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keyId || !keySecret) {
    return NextResponse.json({ error: 'Razorpay not configured' }, { status: 503 })
  }

  const PLAN_IDS: Record<string, string> = {
    starter:  process.env.RAZORPAY_STARTER_PLAN_ID  ?? '',
    standard: process.env.RAZORPAY_PREMIUM_PLAN_ID  ?? '',
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { planKey } = await request.json()
  const planId = PLAN_IDS[planKey]
  if (!planId) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret })

  const subscription = await razorpay.subscriptions.create({
    plan_id: planId,
    customer_notify: 1,
    total_count: 120, // up to 10 years; user cancels when they want
    notes: { userId: user.id, planKey, userEmail: user.email ?? '' },
  })

  return NextResponse.json({ subscriptionId: subscription.id, keyId })
}
