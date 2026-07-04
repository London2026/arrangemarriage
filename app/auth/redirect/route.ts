import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { sendWelcomeEmail } from '@/lib/sendEmail'

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

  // Brand new user (no profile row yet) — send welcome email (fire and forget)
  if (!profile && user.email) {
    const firstName = (user.user_metadata?.full_name ?? user.email).split(' ')[0]
    sendWelcomeEmail(user.email, firstName, user.id).catch(() => {})
  }

  return NextResponse.redirect(`${origin}/pricing`)
}
