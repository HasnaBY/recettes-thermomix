'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function RelatedRecipesSelect({
  currentRecipeId,
  value,
  onChange,
}: {
  currentRecipeId: string | null
  value: string[]
  onChange: (ids: string[]) => void
}) {
  const [allRecipes, setAllRecipes] = useState<{ id: string; title: string }[]>([])
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('recipes')
      .select('id, title')
      .order('title')
      .then(({ data }) => setAllRecipes((data ?? []).filter((r) => r.id !== currentRecipeId)))
  }, [currentRecipeId])

  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id))
    } else {
      onChange([...value, id])
    }
  }

  return (
    <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto flex flex-col gap-1">
      {allRecipes.length === 0 ? (
        <p className="text-sm text-gray-400">Aucune autre recette disponible.</p>
      ) : (
        allRecipes.map((r) => (
          <label key={r.id} className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={value.includes(r.id)} onChange={() => toggle(r.id)} />
            {r.title}
          </label>
        ))
      )}
    </div>
  )
}