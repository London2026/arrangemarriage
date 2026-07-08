export const TRIAL_DURATION_DAYS = 30
export const TRIAL_LIMITS = { likes: 5, photoReveals: 5, meetings: 2 } as const

export function isTrialActive(trialStartedAt: string | null, plan: string): boolean {
  if (plan !== 'free') return false
  if (!trialStartedAt) return false
  const expiresAt = new Date(new Date(trialStartedAt).getTime() + TRIAL_DURATION_DAYS * 86_400_000)
  return Date.now() < expiresAt.getTime()
}

export function trialDaysLeft(trialStartedAt: string | null): number {
  if (!trialStartedAt) return 0
  const expiresAt = new Date(new Date(trialStartedAt).getTime() + TRIAL_DURATION_DAYS * 86_400_000)
  return Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 86_400_000))
}
