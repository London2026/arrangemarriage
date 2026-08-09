import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { sendWelcomeEmail } from '@/lib/sendEmail'
import { getPriorTrialStart } from '@/lib/trialLedger'
import { isOldEnough } from '@/lib/age'

export async function GET(request: NextRequest) {
  const origin = new URL(request.url).origin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.redirect(`${origin}/login`)

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_complete, plan, admin_role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.admin_role) return NextResponse.redirect(`${origin}/admin`)
  if (profile?.onboarding_complete) return NextResponse.redirect(`${origin}/discover`)
  if (profile?.plan) return NextResponse.redirect(`${origin}/onboarding`)

  // Brand new user (no profile row yet)
  if (!profile) {
    // Server-side age gate — closes the gap if someone bypasses the signup
    // form's client-side check. Must run before the welcome email or any
    // profile row is created, and before they can ever reach /pricing.
    const dob = typeof user.user_metadata?.dob === 'string' ? user.user_metadata.dob : undefined
    if (!dob || !isOldEnough(dob)) {
      const admin = createAdminClient()
      await admin.auth.admin.deleteUser(user.id)
      await supabase.auth.signOut()
      return NextResponse.redirect(`${origin}/signup?error=underage`)
    }

    if (user.email) {
      const firstName = (user.user_metadata?.full_name ?? user.email).split(' ')[0]
      sendWelcomeEmail(user.email, firstName, user.id).catch(() => {})

      // If this email already consumed a free trial on a previous (deleted)
      // account, pre-create the profile row with the original trial start
      // date so they cannot get a brand new 30-day trial.
      const priorTrialStart = await getPriorTrialStart(user.email)
      await supabase.from('profiles').upsert({
        id: user.id,
        date_of_birth: dob,
        ...(priorTrialStart ? { trial_started_at: priorTrialStart } : {}),
      })
    }
  }

  return NextResponse.redirect(`${origin}/pricing`)
}
