'use server'

import Razorpay from 'razorpay'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { recordTrialEmail } from '@/lib/trialLedger'

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

// Deleting a member is irreversible — restricted to the owner, unlike
// everything else in this file which support staff can also do.
async function assertOwner() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) throw new Error('Not authorized — owner only')
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

export async function suspendMember(profileId: string): Promise<void> {
  await assertAdmin()
  const admin = createAdminClient()
  await admin.from('profiles').update({ suspended: true }).eq('id', profileId)
}

export async function unsuspendMember(profileId: string): Promise<void> {
  await assertAdmin()
  const admin = createAdminClient()
  await admin.from('profiles').update({ suspended: false }).eq('id', profileId)
}

const EDITABLE_PROFILE_FIELDS = [
  'full_name', 'age', 'gender', 'city', 'country', 'religion', 'caste',
  'mother_tongue', 'education', 'occupation', 'phone', 'marital_status',
] as const

export async function updateMemberProfile(
  profileId: string,
  updates: Partial<Record<(typeof EDITABLE_PROFILE_FIELDS)[number], string | number | null>>
): Promise<void> {
  await assertAdmin()
  const safeUpdates: Record<string, string | number | null> = {}
  for (const key of EDITABLE_PROFILE_FIELDS) {
    if (key in updates) safeUpdates[key] = updates[key] ?? null
  }
  const admin = createAdminClient()
  await admin.from('profiles').update(safeUpdates).eq('id', profileId)
}

export async function deleteMemberProfile(profileId: string): Promise<void> {
  await assertOwner()
  const admin = createAdminClient()

  const { data: profile } = await admin.from('profiles').select('*').eq('id', profileId).single()
  const { data: authUser } = await admin.auth.admin.getUserById(profileId)
  const email = authUser?.user?.email

  // Cancel Razorpay subscription immediately so no future charge occurs
  if (profile?.stripe_customer_id && profile?.plan && profile.plan !== 'free') {
    const keyId     = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET
    if (keyId && keySecret) {
      try {
        const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret })
        await razorpay.subscriptions.cancel(profile.stripe_customer_id, false)
      } catch (_) { /* already cancelled or not found — safe to ignore */ }
    }
  }

  // Remove all uploaded files from storage
  const storagePaths = [
    profile?.back_photo_1_path, profile?.back_photo_2_path,
    profile?.voice_path, profile?.voice_en_path,
    profile?.front_photo_path, profile?.id_document_path,
  ].filter((p): p is string => !!p)
  if (storagePaths.length) {
    await admin.storage.from('profile-media').remove(storagePaths)
  }

  // Same trial-abuse ledger as self-deletion — this email shouldn't get a
  // fresh free trial just because an admin removed the account instead
  if (email && profile?.trial_started_at) {
    await recordTrialEmail(email, profile.trial_started_at)
  }

  await admin.from('profiles').delete().eq('id', profileId)
  await admin.auth.admin.deleteUser(profileId)
}
