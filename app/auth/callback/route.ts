import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { sendWelcomeEmail } from '@/lib/sendEmail'

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
          .select('onboarding_complete, plan, full_name')
          .eq('id', user.id)
          .maybeSingle()

        if (profile?.onboarding_complete) {
          return NextResponse.redirect(`${origin}/discover`)
        } else if (profile?.plan) {
          return NextResponse.redirect(`${origin}/onboarding`)
        } else {
          // Brand new user — send welcome email (fire and forget)
          if (user.email) {
            const firstName = (user.user_metadata?.full_name ?? user.email).split(' ')[0]
            sendWelcomeEmail(user.email, firstName, user.id).catch(() => {})
          }
          return NextResponse.redirect(`${origin}/pricing`)
        }
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
