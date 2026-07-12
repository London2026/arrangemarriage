import { createClient } from '@/lib/supabase/server'
import { getUsageStats } from '@/lib/usageStats'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })

  const stats = await getUsageStats(supabase, user.id)
  return NextResponse.json({ ok: true, stats })
}
