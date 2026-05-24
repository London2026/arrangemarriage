'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function selectPlan(plan: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase.from('profiles').upsert({
    id: user.id,
    plan,
    updated_at: new Date().toISOString(),
  })

  redirect('/onboarding')
}
