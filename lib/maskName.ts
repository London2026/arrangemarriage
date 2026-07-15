export function maskName(fullName: string): string {
  if (!fullName) return 'Member'
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0]
  return parts[0] + ' ' + parts[parts.length - 1][0].toUpperCase() + '.'
}

export function firstNameOnly(fullName: string): string {
  if (!fullName) return 'Member'
  return fullName.trim().split(/\s+/)[0]
}

/** True if the value has at least two words, each containing a letter (i.e. a first name and a last name). */
export function hasFirstAndLastName(value: string): boolean {
  const words = value.trim().split(/\s+/).filter(Boolean)
  if (words.length < 2) return false
  return words.every((w) => /\p{L}/u.test(w))
}
