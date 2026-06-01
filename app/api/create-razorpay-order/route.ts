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

  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret })

  const order = await razorpay.orders.create({
    amount: 15000, // ₹150 in paise
    currency: 'INR',
    receipt: `extra_${user.id.slice(0, 8)}_${Date.now()}`,
    notes: { type: 'extra_meeting', user_id: user.id },
  })

  return NextResponse.json({ orderId: order.id, amount: order.amount, keyId })
}
