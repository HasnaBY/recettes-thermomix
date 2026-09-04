export function getNextMonday(from: Date = new Date()): Date {
  const d = new Date(from)
  const day = d.getDay()
  const diff = (8 - day) % 7 || 7
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function getMondayOfWeek(from: Date = new Date()): Date {
  const d = new Date(from)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

// Utilise les composants locaux (année/mois/jour) au lieu de toISOString(),
// pour éviter que le passage en UTC ne fasse reculer la date d'un jour
// selon le fuseau horaire (ex: en France, minuit local peut devenir
// la veille en UTC).
export function toDateInputValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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

export function formatWeekLabel(weekStart: string): string {
  return formatDateRange(weekStart, 5)
}