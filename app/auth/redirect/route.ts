import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const origin = new URL(request.url).origin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.redirect(`${origin}/login`)

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_complete, plan')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.onboarding_complete) return NextResponse.redirect(`${origin}/discover`)
  if (profile?.plan) return NextResponse.redirect(`${origin}/onboarding`)
  return NextResponse.redirect(`${origin}/pricing`)
}
