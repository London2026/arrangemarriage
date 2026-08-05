import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendViaMsg91Api } from '@/lib/sendSMS'

// Runs daily at 09:00 IST (03:30 UTC) via Vercel Cron (vercel.json).
// Dispatches every SMS queued because it was triggered outside the
// 9 AM–9 PM IST window TRAI's DLT scrubbing layer permits.
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const admin = createAdminClient()
  const { data: queued, error } = await admin
    .from('sms_queue')
    .select('id, phone, template_id, variables')
    .eq('status', 'pending')

  if (error) {
    console.error('send-queued-sms: query error', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let sent = 0, failed = 0
  for (const row of queued ?? []) {
    try {
      await sendViaMsg91Api(row.phone, row.template_id, row.variables as Record<string, string>)
      await admin.from('sms_queue').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', row.id)
      sent++
    } catch {
      await admin.from('sms_queue').update({ status: 'failed', sent_at: new Date().toISOString() }).eq('id', row.id)
      failed++
    }
  }

  return NextResponse.json({ sent, failed })
}
