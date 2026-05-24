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
