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

  let pool = withIngredients

  if (source === 'favorites') {
    const { data: favIds } = await supabase
      .from('favorites')
      .select('recipe_id')
      .eq('user_id', userData.user.id)
    const ids = (favIds ?? []).map((f) => f.recipe_id)
    const favoritePool = withIngredients.filter((r) => ids.includes(r.id))
    pool = favoritePool.length > 0 ? favoritePool : withIngredients
  }

  const currentIds = [
    ...(menuRow.menu.plats ?? []).map((i: any) => i.recipe_id),
    ...(menuRow.menu.desserts ?? []).map((i: any) => i.recipe_id),
  ]

  const candidates = pool.filter((r) => {
    const matchesType = itemType === 'desserts' ? isDessertCategory(r.category) : !isDessertCategory(r.category)
    return matchesType && !currentIds.includes(r.id)
  })

  if (candidates.length === 0) {
    return NextResponse.json({ error: "Aucune autre recette disponible pour remplacer celle-ci." }, { status: 400 })
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