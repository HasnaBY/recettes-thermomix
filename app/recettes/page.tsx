'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type Recipe = {
  id: string
  title: string
  description: string
  category: string
  origin: string | null
  time_minutes: number
  image_url: string | null
}

export default function Home() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('toutes')
  const [origin, setOrigin] = useState('toutes')
  const [pendingApproval, setPendingApproval] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser()

      if (userData.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('approved')
          .eq('id', userData.user.id)
          .single()

        if (!profile?.approved) {
          setPendingApproval(true)
          setLoading(false)
          return
        }
      }

      const { data, error } = await supabase.from('recipes').select('*')
      if (!error && data) setRecipes(data)
      setLoading(false)
    }
    load()
  }, [])

  const categories = ['toutes', ...new Set(recipes.map((r) => r.category).filter(Boolean))]
  const origins = ['toutes', ...new Set(recipes.map((r) => r.origin).filter(Boolean))]

  const filtered = recipes.filter((recipe) => {
    const matchesSearch = recipe.title.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = category === 'toutes' || recipe.category === category
    const matchesOrigin = origin === 'toutes' || recipe.origin === origin
    return matchesSearch && matchesCategory && matchesOrigin
  })

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Chargement...</div>
  }

  if (pendingApproval) {
    return (
      <div className="p-8 max-w-md mx-auto text-center text-gray-600">
        Ton compte est en attente de validation. Tu recevras un accès une fois ton compte approuvé.
      </div>
    )
  }

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Mes recettes</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <input
          type="text"
          placeholder="Rechercher une recette..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat === 'toutes' ? 'Toutes les catégories' : cat}
            </option>
          ))}
        </select>

        <select
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          {origins.map((o) => (
            <option key={o} value={o}>
              {o === 'toutes' ? 'Toutes les origines' : o}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500">Aucune recette ne correspond à ta recherche.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((recipe) => (
            <Link
              key={recipe.id}
              href={`/recipes/${recipe.id}`}
              className="block rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow no-underline text-inherit"
            >
              {recipe.image_url ? (
                <img
                  src={recipe.image_url}
                  alt={recipe.title}
                  className="w-full h-40 object-cover"
                />
              ) : (
                <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                  Pas de photo
                </div>
              )}
              <div className="p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">{recipe.title}</h2>
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">{recipe.description}</p>
                <p className="text-xs text-gray-500">
                  {recipe.category}
                  {recipe.origin && ` · ${recipe.origin}`} · {recipe.time_minutes} min
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
