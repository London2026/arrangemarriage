import { createHmac } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

const BASE = 'https://www.arrangemarriage.co.in'

function expectedToken(userId: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'fallback'
  return createHmac('sha256', secret).update(`unsub:${userId}`).digest('hex').slice(0, 32)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const uid   = searchParams.get('uid') ?? ''
  const token = searchParams.get('t')   ?? ''
  const undo  = searchParams.get('undo') === '1'

  if (!uid || token !== expectedToken(uid)) {
    return NextResponse.redirect(`${BASE}/unsubscribe?error=1`)
  }

  const admin = createAdminClient()
  await admin.from('profiles').update({ email_unsubscribed: !undo }).eq('id', uid)

  return NextResponse.redirect(`${BASE}/unsubscribe?${undo ? 'resubscribed=1' : 'done=1'}&uid=${uid}&t=${token}`)
}
