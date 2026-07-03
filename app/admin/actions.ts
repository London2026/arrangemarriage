'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ADMIN_EMAIL = 'london.anup@gmail.com'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authorized')
  if (user.email === ADMIN_EMAIL) return
  const admin = createAdminClient()
  const { data } = await admin.from('profiles').select('admin_role').eq('id', user.id).single()
  if (data?.admin_role !== 'support') throw new Error('Not authorized')
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

export async function updateTicketStatus(id: string, status: string): Promise<void> {
  await assertAdmin()
  const admin = createAdminClient()
  await admin.from('contact_submissions').update({ status }).eq('id', id)
}

export async function saveTicketNote(id: string, admin_notes: string): Promise<void> {
  await assertAdmin()
  const admin = createAdminClient()
  await admin.from('contact_submissions').update({ admin_notes }).eq('id', id)
}

export async function updateReportStatus(id: string, status: string): Promise<void> {
  await assertAdmin()
  const admin = createAdminClient()
  await admin.from('profile_reports').update({ status }).eq('id', id)
}

export async function saveReportNote(id: string, admin_notes: string): Promise<void> {
  await assertAdmin()
  const admin = createAdminClient()
  await admin.from('profile_reports').update({ admin_notes }).eq('id', id)
}
