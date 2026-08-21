'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type Recipe = {
  id: string
  title: string
  description: string
  category: string
  time_minutes: number
  image_url: string | null
}

export default function Favorites() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const [recommendations, setRecommendations] = useState<Recipe[]>([])
  
  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser()
      const uid = userData.user?.id

      if (!uid) {
        window.location.href = '/login'
        return
      }

      const { data, error } = await supabase
        .from('favorites')
        .select('recipe_id, recipes(*)')
        .eq('user_id', uid)

      const {
        data: { session },
        } = await supabase.auth.getSession()
        const recRes = await fetch('/api/recommendations', {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        })
        const recData = await recRes.json()
        setRecommendations(recData.recipes ?? [])

      if (!error && data) {
        const favRecipes = data.map((f: any) => f.recipes).filter(Boolean) as Recipe[]
        setRecipes(favRecipes)
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="p-8 text-center text-[#3A3532]/60">Chargement...</div>

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto">
      <h1 className="font-display text-3xl text-[#3A3532] mb-6">Mes favoris</h1>



      {recipes.length === 0 ? (
        <p className="text-[#3A3532]/60">Tu n'as pas encore de recette en favori.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {recipes.map((recipe) => (
            <Link
              key={recipe.id}
              href={`/recipes/${recipe.id}`}
              className="block rounded-2xl border border-[#F0EAE0] bg-white overflow-hidden hover:shadow-md transition-shadow no-underline text-inherit"
            >
              {recipe.image_url ? (
                <img src={recipe.image_url} alt={recipe.title} className="w-full h-40 object-cover" />
              ) : (
                <div className="w-full h-40 bg-[#F6DEE1]/30 flex items-center justify-center text-[#3A3532]/40 text-sm">
                  Pas de photo
                </div>
              )}
              <div className="p-4">
                <h2 className="font-display text-lg text-[#3A3532] mb-1">{recipe.title}</h2>
                <p className="text-[#3A3532]/70 text-sm mb-2 line-clamp-2">{recipe.description}</p>
                <p className="text-xs text-[#3A3532]/50">
                  {recipe.category} · {recipe.time_minutes} min
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

            {recommendations.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-xl text-[#3A3532] mb-4">Elle pourrait aussi te plaire</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {recommendations.map((recipe) => (
              <Link
                key={recipe.id}
                href={`/recipes/${recipe.id}`}
                className="block rounded-2xl border border-[#F0EAE0] bg-white overflow-hidden hover:shadow-md transition-shadow no-underline text-inherit"
              >
                {recipe.image_url ? (
                  <img src={recipe.image_url} alt={recipe.title} className="w-full h-32 object-cover" />
                ) : (
                  <div className="w-full h-32 bg-[#F6DEE1]/30" />
                )}
                <div className="p-3">
                  <p className="font-display text-sm text-[#3A3532]">{recipe.title}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
