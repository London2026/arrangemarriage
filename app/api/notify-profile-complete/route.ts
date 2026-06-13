import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendProfileCompleteEmail } from '@/lib/sendEmail'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const firstName = (profile?.full_name ?? user.email ?? 'there').split(' ')[0]

    const admin = createAdminClient()
    const { data: authUser } = await admin.auth.admin.getUserById(user.id)
    const email = authUser?.user?.email ?? user.email

    if (email) {
      await sendProfileCompleteEmail(email, firstName)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('notify-profile-complete error:', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
