import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function isDessertCategory(category: string | null) {
  if (!category) return false
  const c = category.toLowerCase()
  return c.includes('dessert') || c.includes('goûter') || c.includes('gouter')
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()

  if (!userData.user) {
    return NextResponse.json({ error: 'Non connectée' }, { status: 401 })
  }

  const body = await request.json()
  const { menuId, itemType, oldRecipeId } = body

  const { data: menuRow, error: menuError } = await supabase
    .from('generated_menus')
    .select('*')
    .eq('id', menuId)
    .eq('user_id', userData.user.id)
    .single()

  if (menuError || !menuRow) {
    return NextResponse.json({ error: 'Menu introuvable' }, { status: 404 })
  }

  const source = menuRow.params?.source ?? 'all'

  const { data: allRecipes } = await supabase
    .from('recipes')
    .select('id, title, category, ingredients')

  const withIngredients = (allRecipes ?? []).filter((r) => r.ingredients && r.ingredients.length > 0)

  let favoriteIds: string[] = []
  if (source === 'favorites') {
    const { data: favIds } = await supabase
      .from('favorites')
      .select('recipe_id')
      .eq('user_id', userData.user.id)
    favoriteIds = (favIds ?? []).map((f) => f.recipe_id)
  }

  const priorityPool = source === 'favorites' ? withIngredients.filter((r) => favoriteIds.includes(r.id)) : withIngredients
  const fallbackPool = source === 'favorites' ? withIngredients.filter((r) => !favoriteIds.includes(r.id)) : []

  const currentIds = [
    ...(menuRow.menu.plats ?? []).map((i: any) => i.recipe_id),
    ...(menuRow.menu.desserts ?? []).map((i: any) => i.recipe_id),
  ]

  const matchesType = (r: any) =>
    itemType === 'desserts' ? isDessertCategory(r.category) : !isDessertCategory(r.category)

  const priorityCandidates = priorityPool.filter((r) => matchesType(r) && !currentIds.includes(r.id))
  const fallbackCandidates = fallbackPool.filter((r) => matchesType(r) && !currentIds.includes(r.id))

  const candidates = priorityCandidates.length > 0 ? priorityCandidates : fallbackCandidates

  if (candidates.length === 0) {
    return NextResponse.json(
      { error: "Aucune autre recette disponible sur tout le site pour remplacer celle-ci." },
      { status: 400 }
    )
  }

  const replacement = candidates[Math.floor(Math.random() * candidates.length)]

  const updatedMenu = { ...menuRow.menu }
  updatedMenu[itemType] = updatedMenu[itemType].map((item: any) =>
    item.recipe_id === oldRecipeId
      ? { recipe_id: replacement.id, recipe_title: replacement.title }
      : item
  )

  await supabase.from('generated_menus').update({ menu: updatedMenu }).eq('id', menuId)

  return NextResponse.json({ menu: updatedMenu })
}