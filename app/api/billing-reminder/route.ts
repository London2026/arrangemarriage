import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { sendBillingReminderEmail } from '@/lib/sendEmail'
import { firstNameOnly } from '@/lib/maskName'
import { createAdminClient } from '@/lib/supabase/admin'

// Runs daily at 03:30 UTC (09:00 IST) via Vercel Cron (vercel.json)
// Sends a payment reminder email to every subscriber whose next billing date is 3 days away
export async function GET(req: NextRequest) {
  // Vercel Cron passes Authorization: Bearer <CRON_SECRET>
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const admin = createAdminClient()

  // Find all paid subscribers whose next billing date is exactly 3 days from today
  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() + 3)
  const dateStr = targetDate.toISOString().slice(0, 10) // YYYY-MM-DD

  const { data: profiles, error } = await admin
    .from('profiles')
    .select('id, full_name, plan, next_billing_date')
    .neq('plan', 'free')
    .not('next_billing_date', 'is', null)
    .gte('next_billing_date', `${dateStr}T00:00:00.000Z`)
    .lt('next_billing_date',  `${dateStr}T23:59:59.999Z`)

  if (error) {
    console.error('billing-reminder: query error', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let sent = 0
  for (const profile of profiles ?? []) {
    const { data: authUser } = await admin.auth.admin.getUserById(profile.id)
    const email = authUser?.user?.email
    if (!email) continue

    const firstName   = firstNameOnly(profile.full_name ?? '')
    const billingDate = new Date(profile.next_billing_date).toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
    const PLAN_PRICES: Record<string, string> = { starter: '₹350', standard: '₹550' }
    const amount = PLAN_PRICES[profile.plan] ?? ''

    await sendBillingReminderEmail(email, firstName, profile.plan, billingDate, amount)
    sent++
  }

  return NextResponse.json({ sent })
}
