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
}

export default function Favorites() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

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

      if (!error && data) {
        const favRecipes = data
          .map((f: any) => f.recipes)
          .filter(Boolean) as Recipe[]
        setRecipes(favRecipes)
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div style={{ padding: '2rem' }}>Chargement...</div>

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Mes favoris</h1>

      {recipes.length === 0 ? (
        <p>Tu n'as pas encore de recette en favori.</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {recipes.map((recipe) => (
            <Link
              key={recipe.id}
              href={`/recipes/${recipe.id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '1rem' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{recipe.title}</h2>
                <p style={{ color: '#666', marginBottom: '0.5rem' }}>{recipe.description}</p>
                <p style={{ fontSize: '0.9rem' }}>
                  {recipe.category} · {recipe.time_minutes} min
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
