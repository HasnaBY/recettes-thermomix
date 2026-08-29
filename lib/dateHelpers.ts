export function getNextMonday(from: Date = new Date()): Date {
  const d = new Date(from)
  const day = d.getDay()
  const diff = (8 - day) % 7 || 7
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function toDateInputValue(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function formatDayLabel(startDate: string, dayIndex: number): string {
  const d = new Date(startDate + 'T00:00:00')
  d.setDate(d.getDate() + dayIndex)
  const days = ['DIMANCHE', 'LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI']
  const dayName = days[d.getDay()]
  const dateStr = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  return `${dayName} ${dateStr}`
}

export function formatDateRange(startDate: string, numDays: number): string {
  const start = new Date(startDate + 'T00:00:00')
  const end = new Date(start)
  end.setDate(end.getDate() + Math.max(numDays - 1, 0))

  const startStr = start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
  const endStr = end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })

  return `Du ${startStr} au ${endStr}`
}