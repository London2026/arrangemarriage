import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_complete, plan')
          .eq('id', user.id)
          .maybeSingle()

        if (profile?.onboarding_complete) {
          // Profile done → go straight to discover
          return NextResponse.redirect(`${origin}/discover`)
        } else if (profile?.plan) {
          // Has picked a plan but not finished onboarding
          return NextResponse.redirect(`${origin}/onboarding`)
        } else {
          // New user → pick a plan first
          return NextResponse.redirect(`${origin}/pricing`)
        }
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
