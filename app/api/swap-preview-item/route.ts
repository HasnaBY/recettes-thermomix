import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Kind = 'dessert' | 'boisson' | 'pain' | 'plat' | 'autre'

function classify(category: string | null): Kind {
  if (!category) return 'autre'
  const c = category.toLowerCase()
  if (c.includes('dessert') || c.includes('goûter') || c.includes('gouter')) return 'dessert'
  if (c.includes('boisson')) return 'boisson'
  if (c.includes('pain')) return 'pain'
  if (c.includes('plat') || c.includes('salade')) return 'plat'
  return 'autre'
}

const typeToKind: Record<string, Kind> = { plats: 'plat', desserts: 'dessert', boissons: 'boisson', pains: 'pain' }

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return NextResponse.json({ error: 'Non connectée' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', userData.user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Réservé aux admins' }, { status: 403 })

  const { menu, itemType, oldRecipeId, source, targetUserId } = await request.json()

  const kind = typeToKind[itemType]
  const { data: allRecipes } = await supabase
    .from('recipes')
    .select('id, title, category, ingredients')
    .eq('status', 'published')

  const withIngredients = (allRecipes ?? []).filter((r) => r.ingredients && r.ingredients.length > 0)

  let favoriteIds: string[] = []
  if (source === 'favorites' && targetUserId) {
    const { data: favIds } = await supabase.from('favorites').select('recipe_id').eq('user_id', targetUserId)
    favoriteIds = (favIds ?? []).map((f) => f.recipe_id)
  }

  const priorityPool = source === 'favorites' ? withIngredients.filter((r) => favoriteIds.includes(r.id)) : withIngredients
  const fallbackPool = source === 'favorites' ? withIngredients.filter((r) => !favoriteIds.includes(r.id)) : []

  const currentIds = Object.values(menu)
    .filter((v: any) => Array.isArray(v))
    .flat()
    .map((i: any) => i.recipe_id)

  const matches = (r: any) => classify(r.category) === kind && !currentIds.includes(r.id)

  const priorityCandidates = priorityPool.filter(matches)
  const fallbackCandidates = fallbackPool.filter(matches)
  const candidates = priorityCandidates.length > 0 ? priorityCandidates : fallbackCandidates

  if (candidates.length === 0) {
    return NextResponse.json({ error: 'Aucune autre recette disponible pour remplacer celle-ci.' }, { status: 400 })
  }

  const replacement = candidates[Math.floor(Math.random() * candidates.length)]

  const updatedMenu = { ...menu }
  updatedMenu[itemType] = updatedMenu[itemType].map((item: any) =>
    item.recipe_id === oldRecipeId ? { recipe_id: replacement.id, recipe_title: replacement.title } : item
  )

  return NextResponse.json({ menu: updatedMenu })
}