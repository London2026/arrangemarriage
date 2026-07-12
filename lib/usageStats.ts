import type { SupabaseClient } from '@supabase/supabase-js'
import { isTrialActive, trialDaysLeft as calcTrialDaysLeft, TRIAL_LIMITS } from './trial'

export interface UsageStats {
  trialActive: boolean
  trialDaysLeft: number
  likesLeft: number
  likesUsed: number
  likesTotal: number
  revealsLeft: number   // -1 = unlimited (paid), 0 = expired trial, >0 = trial count remaining
  revealsTotal: number  // -1 = unlimited (paid), 0 = expired trial, >0 = active trial limit
  meetingsLeft: number
  meetingsTotal: number
  meetingsUsed: number
  canReveal: boolean
  canMeet: boolean
}

/** Computes a user's plan/trial usage — same logic that gates likes, reveals, and meetings on Discover. */
export async function getUsageStats(supabase: SupabaseClient, userId: string): Promise<UsageStats> {
  const { data: me } = await supabase
    .from('profiles')
    .select('plan, plan_bonus_until, trial_started_at')
    .eq('id', userId)
    .maybeSingle()

  const bonusActive = me?.plan_bonus_until ? new Date(me.plan_bonus_until) > new Date() : false
  const userPlan = me?.plan ?? 'free'
  const trialActive = isTrialActive(me?.trial_started_at ?? null, userPlan)
  const daysLeft = trialActive ? calcTrialDaysLeft(me?.trial_started_at ?? null) : 0

  const monthStart = new Date()
  monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)

  // For free trial users, count from trial start; for paid users, count from month start
  const countSince = (userPlan === 'free' && me?.trial_started_at)
    ? me.trial_started_at
    : monthStart.toISOString()

  // Free trial: count meetings as requester OR recipient (2 total). Paid: requester only.
  const meetingsQ = userPlan === 'free'
    ? supabase.from('video_meetings').select('*', { count: 'exact', head: true })
        .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
        .gte('created_at', countSince)
        .in('status', ['pending', 'accepted'])
    : supabase.from('video_meetings').select('*', { count: 'exact', head: true })
        .eq('requester_id', userId)
        .gte('created_at', monthStart.toISOString())
        .in('status', ['pending', 'accepted'])

  // Count photo reveals during trial for free users
  const revealsQ = (userPlan === 'free' && me?.trial_started_at)
    ? supabase.from('photo_reveals').select('*', { count: 'exact', head: true })
        .eq('viewer_id', userId)
        .gte('revealed_at', me.trial_started_at)
    : Promise.resolve({ count: 0 as number | null, data: null, error: null })

  const [{ count: meetingsCount }, { count: extraPurchased }, { count: likesCount }, { count: revealsCount }] = await Promise.all([
    meetingsQ,
    supabase.from('extra_meeting_purchases').select('*', { count: 'exact', head: true })
      .eq('user_id', userId).gte('created_at', monthStart.toISOString()),
    supabase.from('profile_likes').select('*', { count: 'exact', head: true })
      .eq('liker_id', userId).gte('created_at', countSince),
    revealsQ,
  ])

  // Calculate limits based on plan
  const PAID_MEETING_LIMITS: Record<string, number> = { starter: 4, standard: 8 }
  const PAID_LIKE_LIMITS:    Record<string, number> = { starter: 10, standard: 15 }
  let planMeetingLimit: number
  let likesTotal: number
  let revealsTotal: number

  if (userPlan === 'free') {
    if (trialActive) {
      planMeetingLimit = TRIAL_LIMITS.meetings
      likesTotal       = TRIAL_LIMITS.likes
      revealsTotal     = TRIAL_LIMITS.photoReveals
    } else {
      planMeetingLimit = 0
      likesTotal       = 0
      revealsTotal     = 0
    }
  } else {
    planMeetingLimit = PAID_MEETING_LIMITS[bonusActive ? 'starter' : userPlan] ?? 4
    likesTotal       = PAID_LIKE_LIMITS[userPlan] ?? 10
    revealsTotal     = -1  // unlimited
  }

  const meetingsTotal = userPlan === 'free' ? planMeetingLimit : planMeetingLimit + (extraPurchased ?? 0)
  const meetingsUsed  = Math.min(meetingsCount ?? 0, meetingsTotal)
  const meetingsLeft  = Math.max(0, meetingsTotal - meetingsUsed)
  const likesUsed     = Math.min(likesCount ?? 0, likesTotal)
  const likesLeft     = Math.max(0, likesTotal - likesUsed)
  const revealsUsed   = revealsTotal > 0 ? Math.min(revealsCount ?? 0, revealsTotal) : 0
  const revealsLeft   = revealsTotal === -1 ? -1 : Math.max(0, revealsTotal - revealsUsed)

  const canReveal = userPlan !== 'free' || bonusActive || (trialActive && revealsLeft !== 0)
  const canMeet   = userPlan !== 'free' || bonusActive || (trialActive && meetingsLeft > 0)

  return {
    trialActive: trialActive && userPlan === 'free',
    trialDaysLeft: daysLeft,
    likesLeft, likesUsed, likesTotal,
    revealsLeft, revealsTotal,
    meetingsLeft, meetingsTotal, meetingsUsed,
    canReveal, canMeet,
  }
}
