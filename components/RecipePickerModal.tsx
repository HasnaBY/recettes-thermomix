'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Recipe = { id: string; title: string; image_url: string | null; category: string | null }

export default function RecipePickerModal({
  excludeIds,
  onSelect,
  onClose,
}: {
  excludeIds: string[]
  onSelect: (recipe: Recipe) => void
  onClose: () => void
}) {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('recipes')
      .select('id, title, image_url, category')
      .eq('status', 'published')
      .order('title')
      .then(({ data }) => {
        setRecipes((data ?? []).filter((r) => !excludeIds.includes(r.id)))
        setLoading(false)
      })
  }, [])

  const filtered = recipes.filter((r) => r.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <p className="font-medium text-gray-900">Choisir une recette</p>
          <button onClick={onClose} className="text-xl text-gray-500">
            ✕
          </button>
        </div>

        <div className="p-4 border-b border-gray-200">
          <input
            placeholder="Rechercher une recette..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        <div className="overflow-y-auto flex-1">
          {loading ? (
            <p className="p-4 text-sm text-gray-500">Chargement...</p>
          ) : filtered.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">Aucune recette trouvée.</p>
          ) : (
            filtered.map((r) => (
              <button
                key={r.id}
                onClick={() => onSelect(r)}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 border-b border-gray-100 text-left"
              >
                {r.image_url ? (
                  <img src={r.image_url} alt="" className="w-12 h-12 object-cover rounded-lg shrink-0" />
                ) : (
                  <div className="w-12 h-12 bg-gray-100 rounded-lg shrink-0" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">{r.title}</p>
                  {r.category && <p className="text-xs text-gray-400">{r.category}</p>}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
