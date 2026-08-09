export const MINIMUM_AGE = 18

export function calculateAge(dob: string): number {
  const birth = new Date(dob)
  if (Number.isNaN(birth.getTime())) return 0
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export function isOldEnough(dob: string): boolean {
  return calculateAge(dob) >= MINIMUM_AGE
}
