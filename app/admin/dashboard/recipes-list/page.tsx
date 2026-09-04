'use client'

import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

type Recipe = {
  id: string
  title: string
  image_url: string | null
  category: string | null
  origin: string | null
  ingredients: string[] | null
}

const FILTER_LABELS: Record<string, string> = {
  no_image: 'Recettes sans photo',
  no_category: 'Recettes sans catégorie',
  no_origin: 'Recettes sans origine',
  no_ingredients: 'Recettes sans ingrédients',
  duplicates: 'Titres potentiellement en doublon',
  category: 'Recettes de la catégorie',
}

function RecipesListContent() {
  const searchParams = useSearchParams()
  const filter = searchParams.get('filter') ?? ''
  const categoryValue = searchParams.get('value') ?? ''

  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('recipes')
        .select('id, title, image_url, category, origin, ingredients')

      let filtered = data ?? []

      if (filter === 'no_image') {
        filtered = filtered.filter((r) => !r.image_url)
      } else if (filter === 'no_category') {
        filtered = filtered.filter((r) => !r.category)
      } else if (filter === 'no_origin') {
        filtered = filtered.filter((r) => !r.origin)
      } else if (filter === 'no_ingredients') {
        filtered = filtered.filter((r) => !r.ingredients || r.ingredients.length === 0)
      } else if (filter === 'category') {
        filtered = filtered.filter((r) => (r.category ?? 'Non classée') === categoryValue)
      } else if (filter === 'duplicates') {
        const counts: Record<string, number> = {}
        filtered.forEach((r) => {
          const key = r.title.trim().toLowerCase()
          counts[key] = (counts[key] ?? 0) + 1
        })
        filtered = filtered.filter((r) => counts[r.title.trim().toLowerCase()] > 1)
      }

      setRecipes(filtered)
      setLoading(false)
    }
    load()
  }, [filter, categoryValue])

  const title = filter === 'category' ? `${FILTER_LABELS.category} "${categoryValue}"` : FILTER_LABELS[filter] ?? 'Recettes'

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement...</div>

  return (
    <div className="p-6 sm:p-8 max-w-3xl mx-auto">
      <Link href="/admin/dashboard" className="inline-block mb-4 text-sm text-gray-500 hover:text-gray-900">
        ← Tableau de bord
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
      <p className="text-gray-500 text-sm mb-6">{recipes.length} recette(s)</p>

      {recipes.length === 0 ? (
        <p className="text-gray-500">Aucune recette ne correspond à ce critère.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {recipes.map((r) => (
            <Link
              key={r.id}
              href={`/admin/edit-recipe/${r.id}`}
              className="flex items-center gap-3 border border-gray-200 rounded-xl p-3 hover:bg-gray-50 no-underline"
            >
              {r.image_url ? (
                <img src={r.image_url} alt="" className="w-14 h-14 object-cover rounded-lg shrink-0" />
              ) : (
                <div className="w-14 h-14 bg-gray-100 rounded-lg shrink-0 flex items-center justify-center text-xs text-gray-400">
                  Pas de photo
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{r.title}</p>
                <p className="text-xs text-gray-400">
                  {r.category ?? 'Sans catégorie'}
                  {r.origin ? ` · ${r.origin}` : ''}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function RecipesListPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Chargement...</div>}>
      <RecipesListContent />
    </Suspense>
  )
}