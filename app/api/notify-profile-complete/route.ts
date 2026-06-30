import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendProfileCompleteEmail, sendAdminAlert } from '@/lib/sendEmail'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, age, gender, city, country, religion, plan, phone, id_document_path')
      .eq('id', user.id)
      .single()

    const firstName = (profile?.full_name ?? user.email ?? 'there').split(' ')[0]

    const admin = createAdminClient()
    const { data: authUser } = await admin.auth.admin.getUserById(user.id)
    const email = authUser?.user?.email ?? user.email

    await Promise.all([
      email ? sendProfileCompleteEmail(email, firstName, user.id) : Promise.resolve(),
      sendAdminAlert('New member joined', {
        Name:     profile?.full_name ?? '—',
        Email:    email ?? '—',
        Age:      profile?.age ? String(profile.age) : '—',
        Gender:   profile?.gender ?? '—',
        Location: [profile?.city, profile?.country].filter(Boolean).join(', ') || '—',
        Religion: profile?.religion ?? '—',
        Plan:     profile?.plan ?? 'free',
        Phone:    profile?.phone ?? '—',
        ID:       profile?.id_document_path ? 'Uploaded' : 'Not uploaded',
      }),
    ])

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('notify-profile-complete error:', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
