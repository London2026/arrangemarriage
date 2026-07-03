'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ADMIN_EMAIL = 'london.anup@gmail.com'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) throw new Error('Not authorized')
}

export async function verifyMember(profileId: string): Promise<void> {
  await assertAdmin()
  const admin = createAdminClient()
  await admin.from('profiles').update({ id_verified: true }).eq('id', profileId)
}

export async function rejectMemberId(profileId: string): Promise<void> {
  await assertAdmin()
  const admin = createAdminClient()
  await admin.from('profiles').update({ id_document_path: null, id_country: null }).eq('id', profileId)
}

export async function saveCrmStatus(profileId: string, status: string): Promise<void> {
  await assertAdmin()
  const admin = createAdminClient()
  await admin.from('profiles').update({ crm_status: status }).eq('id', profileId)
}

export async function saveCrmNote(profileId: string, notes: string): Promise<void> {
  await assertAdmin()
  const admin = createAdminClient()
  await admin.from('profiles').update({ crm_notes: notes }).eq('id', profileId)
}
