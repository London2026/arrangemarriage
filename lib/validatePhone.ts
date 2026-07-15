/** True if the value starts with a "+" country code and has 8-15 digits total (E.164-ish). */
export function hasCountryCode(phone: string): boolean {
  const trimmed = phone.trim()
  if (!trimmed.startsWith('+')) return false
  const digits = trimmed.slice(1).replace(/[\s-]/g, '')
  return /^\d{8,15}$/.test(digits)
}
