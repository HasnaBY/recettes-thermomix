'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function FavoriteButton({ recipeId }: { recipeId: string }) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const check = async () => {
      const { data: userData } = await supabase.auth.getUser()
      const uid = userData.user?.id ?? null
      setUserId(uid)

      if (uid) {
        const { data } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', uid)
          .eq('recipe_id', recipeId)
          .maybeSingle()

        setIsFavorite(!!data)
      }
      setLoading(false)
    }
    check()
  }, [recipeId])

  const toggleFavorite = async () => {
    if (!userId) {
      window.location.href = '/login'
      return
    }

    if (isFavorite) {
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('recipe_id', recipeId)
      setIsFavorite(false)
    } else {
      await supabase.from('favorites').insert({ user_id: userId, recipe_id: recipeId })
      setIsFavorite(true)
    }
  }

  if (loading) return null

  return (
    <button
      onClick={toggleFavorite}
      style={{
        padding: '0.5rem 1rem',
        borderRadius: '4px',
        border: '1px solid #000',
        backgroundColor: isFavorite ? '#000' : '#fff',
        color: isFavorite ? '#fff' : '#000',
        cursor: 'pointer',
        marginBottom: '1rem',
      }}
    >
      {isFavorite ? '★ Dans mes favoris' : '☆ Ajouter aux favoris'}
    </button>
  )
}
