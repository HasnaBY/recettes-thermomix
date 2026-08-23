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
  recipe_source: string | null
  prep_time_minutes: number | null
  total_time_minutes: number | null
  image_url: string | null
  status: string
  created_at: string

}

export default function Recettes() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('toutes')
  const [origin, setOrigin] = useState('toutes')
  const [source, setSource] = useState('toutes')
  const [isPublicPreview, setIsPublicPreview] = useState(false)
  const [accountPending, setAccountPending] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        setIsPublicPreview(true)
        const { data } = await supabase.from('recipes').select('*').eq('is_featured', true).eq('status', 'published')
        setRecipes(data ?? [])
        setLoading(false)
        return
      }

      const { data: profile } = await supabase.from('profiles').select('approved, is_admin').eq('id', userData.user.id).single()

      setIsAdmin(!!profile?.is_admin)

      if (!profile?.approved) {
        setAccountPending(true)
        setLoading(false)
        return
      }

      let query = supabase.from('recipes').select('*')
      if (!profile.is_admin) {
        query = query.eq('status', 'published')
      }

      const { data, error } = await query
      if (!error && data) setRecipes(data)
      setLoading(false)
    }
    load()
  }, [])

  const categories = ['toutes', ...new Set(recipes.map((r) => r.category).filter((c): c is string => Boolean(c)))]
  const origins = ['toutes', ...new Set(recipes.map((r) => r.origin).filter((o): o is string => Boolean(o)))]

  const filtered = recipes.filter((recipe) => {
    const matchesSearch = recipe.title.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = category === 'toutes' || recipe.category === category
    const matchesOrigin = origin === 'toutes' || recipe.origin === origin
    const matchesSource = source === 'toutes' || recipe.recipe_source === source
    return matchesSearch && matchesCategory && matchesOrigin && matchesSource
  })

  if (loading) {
    return <div className="p-8 text-center text-[#3A3532]/60">Chargement...</div>
  }

  if (accountPending) {
    return (
      <div className="p-8 max-w-md mx-auto text-center text-[#3A3532]/70">
        Ton compte est en attente de validation. Tu recevras un accès prochainement.
      </div>
    )
  }

  const sourceBadge = (recipeSource: string | null) => {
    if (recipeSource === 'creation') {
      return <span className="text-xs px-2 py-0.5 rounded-full bg-[#F6DEE1]/60 text-[#3A3532]">👩‍🍳 Ma création</span>
    }
    return <span className="text-xs px-2 py-0.5 rounded-full bg-[#DCEAF0]/60 text-[#3A3532]">📱 Cookidoo</span>
  }

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto">
      <h1 className="font-display text-3xl text-[#3A3532] mb-2">Mes recettes</h1>

      {isPublicPreview && (
        <div className="border border-[#C9A44C] bg-[#F6DEE1]/20 rounded-2xl p-4 mb-8">
          <p className="text-[#3A3532]/80 text-sm mb-3">
            Voici un aperçu de mes recettes. Connecte-toi pour accéder à toutes les recettes, avec ingrédients et étapes complètes.
          </p>
          <Link
            href="/login"
            className="inline-block px-5 py-2 bg-[#3A3532] text-[#FDFBF6] rounded-full text-sm font-medium hover:bg-[#2A2622] transition-colors no-underline border border-[#C9A44C]"
          >
            Se connecter
          </Link>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-8 flex-wrap">
        <input
          type="text"
          placeholder="Rechercher une recette..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[160px] px-4 py-2 border border-[#F0EAE0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9A44C]"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-2 border border-[#F0EAE0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9A44C]"
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
          className="px-4 py-2 border border-[#F0EAE0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9A44C]"
        >
          {origins.map((o) => (
            <option key={o} value={o}>
              {o === 'toutes' ? 'Toutes les origines' : o}
            </option>
          ))}
        </select>

        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="px-4 py-2 border border-[#F0EAE0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9A44C]"
        >
          <option value="toutes">Toutes les sources</option>
          <option value="cookidoo">📱 Cookidoo</option>
          <option value="creation">👩‍🍳 Mes créations</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-[#3A3532]/60">Aucune recette ne correspond à ta recherche.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((recipe) => (
            <div key={recipe.id} className="relative">
              <Link
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
                  <div className="mb-2 flex gap-2 flex-wrap">
                    {sourceBadge(recipe.recipe_source)}
                    {recipe.status === 'draft' && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Brouillon</span>
                    )}
                  </div>
                  <h2 className="font-display text-lg text-[#3A3532] mb-1">{recipe.title}</h2>
                  <p className="text-[#3A3532]/70 text-sm mb-2 line-clamp-2">{recipe.description}</p>
                  <p className="text-xs text-[#3A3532]/50">
                    {recipe.category}
                    {recipe.origin && ` · ${recipe.origin}`}
                    {recipe.total_time_minutes && ` · ${recipe.total_time_minutes} min au total`}
                  </p>
                  <p className="text-xs text-[#3A3532]/40 mt-1">
                    {new Date(recipe.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </Link>

              {isAdmin && (
                <Link
                  href={`/admin/edit-recipe/${recipe.id}`}
                  className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-white/95 rounded-full shadow no-underline text-sm"
                  aria-label="Modifier cette recette"
                >
                  ✏️
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}