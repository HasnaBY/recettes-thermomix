'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logActivity } from '@/lib/logActivity'

export default function RecipeViewTracker({ recipeId, recipeTitle }: { recipeId: string; recipeTitle: string }) {
  useEffect(() => {
    const track = async () => {
      const supabase = createClient()
      const { data: userData } = await supabase.auth.getUser()
      if (userData.user) {
        logActivity(supabase, userData.user.id, 'recipe_view', recipeTitle)
      }
    }
    track()
  }, [recipeId])

  return null
}