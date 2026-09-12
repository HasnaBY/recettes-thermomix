'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logActivity } from '@/lib/logActivity'

export default function FavoriteButton({ recipeId }: { recipeId: string }) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        setLoading(false)
        return
      }
      setUserId(userData.user.id)

      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', userData.user.id)
        .eq('recipe_id', recipeId)
        .maybeSingle()

      setIsFavorite(!!data)
      setLoading(false)
    }
    load()
  }, [recipeId])

  const toggleFavorite = async () => {
    if (!userId) return

    if (isFavorite) {
      await supabase.from('favorites').delete().eq('user_id', userId).eq('recipe_id', recipeId)
      setIsFavorite(false)
    } else {
      await supabase.from('favorites').insert({ user_id: userId, recipe_id: recipeId })
      setIsFavorite(true)
      logActivity(supabase, userId, 'favorite_added', recipeId)
    }
  }

  if (loading || !userId) return null

  return (
    <button
      onClick={toggleFavorite}
      className={`px-4 py-2 rounded-full text-sm font-medium border ${
        isFavorite ? 'bg-[#C9A44C] text-white border-[#C9A44C]' : 'bg-white text-[#3A3532] border-[#F0EAE0]'
      }`}
    >
      {isFavorite ? '★ Favori' : '☆ Ajouter aux favoris'}
    </button>
  )
}