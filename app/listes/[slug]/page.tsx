'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import BrandPhoto from '@/components/BrandPhoto'

type Recipe = {
  id: string
  title: string
  description: string
  category: string
  time_minutes: number
  image_url: string | null
}

type ListInfo = { id: string; slug: string; title: string; description: string | null }

export default function ListeDetail({ params }: { params: Promise<{ slug: string }> }) {
  const [list, setList] = useState<ListInfo | null>(null)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { slug } = await params

      const { data: listData, error: listError } = await supabase
        .from('recipe_lists')
        .select('*')
        .eq('slug', slug)
        .single()

      if (listError || !listData) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setList(listData)

      const { data: items } = await supabase
        .from('recipe_list_items')
        .select('position, recipes(*)')
        .eq('list_id', listData.id)
        .order('position')

      const recipeList = (items ?? []).map((i: any) => i.recipes).filter(Boolean) as Recipe[]
      setRecipes(recipeList)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="p-8 text-center text-[#3A3532]/60">Chargement...</div>
  if (notFound) return <div className="p-8 text-center text-[#3A3532]/60">Liste introuvable</div>

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto">
      <Link href="/listes" className="inline-block mb-4 text-sm text-[#3A3532]/70 hover:text-[#3A3532]">
        ← Toutes les listes
      </Link>

      <h1 className="font-display text-3xl text-[#3A3532] mb-2">{list?.title}</h1>
      {list?.description && <p className="text-[#3A3532]/70 mb-4">{list.description}</p>}

      {list?.slug === 'anti-canicule' && (
        <div className="mb-8">
          <BrandPhoto
            photoKey="table_ete"
            alt="Table de recettes d'été"
            className="w-full h-56 object-cover rounded-2xl"
          />
        </div>
      )}

      {recipes.length === 0 ? (
        <p className="text-[#3A3532]/60">Aucune recette dans cette liste pour le moment.</p>
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
    </div>
  )
}
