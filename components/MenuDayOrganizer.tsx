'use client'

type MenuItem = { recipe_id: string; recipe_title: string }

const DAY_LABELS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']

function move<T>(arr: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction
  if (target < 0 || target >= arr.length) return arr
  const copy = [...arr]
  ;[copy[index], copy[target]] = [copy[target], copy[index]]
  return copy
}

function ReorderList({
  title,
  items,
  onChange,
}: {
  title: string
  items: MenuItem[]
  onChange: (items: MenuItem[]) => void
}) {
  return (
    <div className="flex-1">
      <p className="text-sm font-semibold text-gray-900 mb-2">{title}</p>
      <div className="flex flex-col gap-1.5">
        {items.map((item, i) => (
          <div key={item.recipe_id} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5">
            <span className="text-xs font-medium text-gray-500 w-14 shrink-0">{DAY_LABELS[i] ?? `#${i + 1}`}</span>
            <span className="text-xs text-gray-800 flex-1 truncate">{item.recipe_title}</span>
            <button
              type="button"
              onClick={() => onChange(move(items, i, -1))}
              disabled={i === 0}
              className="text-xs px-1.5 py-0.5 border border-gray-300 rounded disabled:opacity-30"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => onChange(move(items, i, 1))}
              disabled={i === items.length - 1}
              className="text-xs px-1.5 py-0.5 border border-gray-300 rounded disabled:opacity-30"
            >
              ↓
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function MenuDayOrganizer({
  plats,
  accompaniments,
  onPlatsChange,
  onAccompanimentsChange,
}: {
  plats: MenuItem[]
  accompaniments: MenuItem[]
  onPlatsChange: (items: MenuItem[]) => void
  onAccompanimentsChange: (items: MenuItem[]) => void
}) {
  return (
    <div className="border border-[#C9A44C] bg-[#F6DEE1]/10 rounded-xl p-4 mb-4">
      <p className="text-sm font-bold text-gray-900 mb-1">📅 Organiser les jours</p>
      <p className="text-xs text-gray-500 mb-3">
        Choisis quel plat et quel accompagnement vont ensemble, jour par jour, avec les flèches.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <ReorderList title="Plats" items={plats} onChange={onPlatsChange} />
        <ReorderList title="Accompagnements" items={accompaniments} onChange={onAccompanimentsChange} />
      </div>
    </div>
  )
}