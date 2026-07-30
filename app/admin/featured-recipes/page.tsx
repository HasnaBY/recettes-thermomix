'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Recipe = { id: string; title: string; image_url: string | null; featured_position: number }

export default function AdminFeaturedRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const load = async () => {
    const { data } = await supabase
      .from('recipes')
      .select('id, title, image_url, featured_position')
      .eq('is_featured', true)
      .order('featured_position')
    setRecipes(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const moveRecipe = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= recipes.length) return

    const current = recipes[index]
    const target = recipes[targetIndex]

    await supabase.from('recipes').update({ featured_position: target.featured_position }).eq('id', current.id)
    await supabase.from('recipes').update({ featured_position: current.featured_position }).eq('id', target.id)

    load()
  }

  const removeFromFeatured = async (id: string) => {
    await supabase.from('recipes').update({ is_featured: false }).eq('id', id)
    load()
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement...</div>

  return (
    <div className="p-6 sm:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Recettes mises en avant</h1>
      <p className="text-gray-500 text-sm mb-6">
        Définis ici l'ordre d'affichage sur l'accueil du site. Pour ajouter une recette à cette liste, coche "Mettre en avant" depuis sa page d'édition.
      </p>

      {recipes.length === 0 ? (
        <p className="text-gray-500">Aucune recette mise en avant pour le moment.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {recipes.map((recipe, i) => (
            <div key={recipe.id} className="border border-gray-200 rounded-xl p-3 flex gap-3 items-center">
              {recipe.image_url ? (
                <img src={recipe.image_url} alt="" className="w-16 h-16 object-cover rounded-lg shrink-0" />
              ) : (
                <div className="w-16 h-16 bg-gray-100 rounded-lg shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{recipe.title}</p>
                <p className="text-xs text-gray-400">Position {i + 1}</p>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <button
                  onClick={() => moveRecipe(i, -1)}
                  disabled={i === 0}
                  className="px-2 py-1 border border-gray-300 rounded text-sm disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveRecipe(i, 1)}
                  disabled={i === recipes.length - 1}
                  className="px-2 py-1 border border-gray-300 rounded text-sm disabled:opacity-30"
                >
                  ↓
                </button>
              </div>
              <button onClick={() => removeFromFeatured(recipe.id)} className="text-xs text-red-600 shrink-0">
                Retirer
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}