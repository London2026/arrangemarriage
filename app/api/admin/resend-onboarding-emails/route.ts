import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { sendWelcomeEmail, sendProfileCompleteEmail } from '@/lib/sendEmail'

// Temporary one-off admin utility to resend onboarding emails to an
// existing user — secret-gated, intended to be removed after use.
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-admin-secret')
  if (!secret || secret !== process.env.ADMIN_TASK_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const { email, firstName } = await request.json()
  if (!email || !firstName) {
    return NextResponse.json({ ok: false, error: 'email and firstName required' }, { status: 400 })
  }

  await sendWelcomeEmail(email, firstName)
  await sendProfileCompleteEmail(email, firstName)

  return NextResponse.json({ ok: true })
}
