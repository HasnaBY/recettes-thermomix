'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { normalizeLabel } from '@/lib/normalizeTag'

export default function TagSelect({
  table,
  value,
  onChange,
  placeholder,
}: {
  table: 'recipe_categories' | 'recipe_origins'
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  const [options, setOptions] = useState<string[]>([])
  const [adding, setAdding] = useState(false)
  const [newValue, setNewValue] = useState('')
  const supabase = createClient()

  const load = async () => {
    const { data } = await supabase.from(table).select('label').order('label')
    setOptions((data ?? []).map((d: any) => d.label))
  }

  useEffect(() => {
    load()
  }, [])

  const handleAdd = async () => {
    const normalized = normalizeLabel(newValue)
    if (!normalized) return
    await supabase.from(table).upsert({ label: normalized }, { onConflict: 'label' })
    await load()
    onChange(normalized)
    setNewValue('')
    setAdding(false)
  }

  return (
    <div>
      <select
        value={options.includes(value) ? value : ''}
        onChange={(e) => {
          if (e.target.value === '__add__') {
            setAdding(true)
            return
          }
          onChange(e.target.value)
        }}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
        <option value="__add__">+ Ajouter une nouvelle valeur...</option>
      </select>
      {adding && (
        <div className="flex gap-2 mt-2">
          <input
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="Nouvelle valeur"
            className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
          />
          <button
            type="button"
            onClick={handleAdd}
            className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-sm"
          >
            Ajouter
          </button>
        </div>
      )}
    </div>
  )
}