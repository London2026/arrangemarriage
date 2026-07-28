/** True if the value starts with a "+" country code and has 8-15 digits total (E.164-ish). */
export function hasCountryCode(phone: string): boolean {
  const trimmed = phone.trim()
  if (!trimmed.startsWith('+')) return false
  const digits = trimmed.slice(1).replace(/[\s-]/g, '')
  return /^\d{8,15}$/.test(digits)
}

export interface CountryCodeOption { code: string; label: string }

/**
 * Country codes offered in onboarding's Country Code dropdown — India first (primary market), then
 * common NRI/diaspora destinations. Labels are kept short (code + 2-letter abbreviation) rather than
 * full country names — the dropdown box is only ~128px wide, and full names like "+966 Saudi Arabia"
 * or "+27 South Africa" overflow that width on narrow mobile screens (verified: 8 of 14 would clip on
 * the app's smallest supported breakpoint). UK/UAE are kept as-is since they're already short and are
 * more widely recognized in that form than their ISO codes (GB/AE).
 */
export const COUNTRY_CODES: CountryCodeOption[] = [
  { code: '+91',  label: '+91 IN' },
  { code: '+1',   label: '+1 US/CA' },
  { code: '+44',  label: '+44 UK' },
  { code: '+971', label: '+971 UAE' },
  { code: '+966', label: '+966 SA' },
  { code: '+974', label: '+974 QA' },
  { code: '+968', label: '+968 OM' },
  { code: '+973', label: '+973 BH' },
  { code: '+965', label: '+965 KW' },
  { code: '+61',  label: '+61 AU' },
  { code: '+65',  label: '+65 SG' },
  { code: '+60',  label: '+60 MY' },
  { code: '+27',  label: '+27 ZA' },
  { code: '+64',  label: '+64 NZ' },
]

/** Splits a stored phone value like "+91 98765 43210" into its country code and local number. Defaults to +91 if the value doesn't start with a known code. */
export function splitPhone(full: string): { countryCode: string; localNumber: string } {
  const trimmed = full.trim()
  const match = [...COUNTRY_CODES]
    .sort((a, b) => b.code.length - a.code.length)
    .find(c => trimmed.startsWith(c.code))
  if (match) return { countryCode: match.code, localNumber: trimmed.slice(match.code.length).trim() }
  return { countryCode: '+91', localNumber: trimmed.replace(/^\+/, '') }
}

/** Combines a country code + local number back into the single stored phone string. Returns '' if the local number is empty. */
export function joinPhone(countryCode: string, localNumber: string): string {
  const digits = localNumber.trim()
  return digits ? `${countryCode} ${digits}` : ''
}
