import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Resend } from 'resend'

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

  const hasKey = !!process.env.RESEND_API_KEY
  if (!hasKey) return NextResponse.json({ ok: false, hasKey, error: 'RESEND_API_KEY not set' })

  const client = new Resend(process.env.RESEND_API_KEY)
  const result = await client.emails.send({
    from: 'Arrange Marriage <noreply@arrangemarriage.live>',
    to: email,
    subject: `Test email for ${firstName}`,
    html: `<p>Diagnostic test email for ${firstName}.</p>`,
  })

  return NextResponse.json({ ok: true, hasKey, result })
}
