export function normalizeLabel(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  return trimmed
    .toLowerCase()
    .split(' ')
    .map((word) => (word.length > 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(' ')
}