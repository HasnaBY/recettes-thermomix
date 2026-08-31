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

  if (!userData.user) {
    return NextResponse.json({ error: 'Non connectée' }, { status: 401 })
  }

  const { data: requesterProfile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userData.user.id)
    .single()

  const body = await request.json()
  const { menuId, itemType, oldRecipeId, newRecipeId } = body

  console.log('[swap-menu-item] payload reçu:', { menuId, itemType, oldRecipeId, newRecipeId })

  let menuQuery = supabase.from('generated_menus').select('*').eq('id', menuId)
  if (!requesterProfile?.is_admin) {
    menuQuery = menuQuery.eq('user_id', userData.user.id)
  }

  const { data: menuRow, error: menuError } = await menuQuery.single()

  if (menuError || !menuRow) {
    return NextResponse.json({ error: 'Menu introuvable' }, { status: 404 })
  }

  const currentIds: string[] = Object.values(menuRow.menu)
    .filter((v: any) => Array.isArray(v))
    .flat()
    .map((i: any) => i.recipe_id)

  let replacement: { id: string; title: string } | null = null

  if (newRecipeId) {
    // --- Chemin manuel : priorité absolue à ce que la personne a choisi ---
    if (currentIds.includes(newRecipeId)) {
      return NextResponse.json({ error: 'Cette recette est déjà présente dans le menu.' }, { status: 400 })
    }

    const { data: chosen, error: chosenError } = await supabase
      .from('recipes')
      .select('id, title, status')
      .eq('id', newRecipeId)
      .single()

    if (chosenError || !chosen) {
      return NextResponse.json({ error: 'Recette introuvable.' }, { status: 400 })
    }
    if (chosen.status !== 'published') {
      return NextResponse.json({ error: 'Cette recette est en brouillon et ne peut pas être ajoutée.' }, { status: 400 })
    }

    replacement = { id: chosen.id, title: chosen.title }
  } else {
    // --- Chemin aléatoire : uniquement si aucun newRecipeId fourni ---
    const source = menuRow.params?.source ?? 'all'
    const kind = typeToKind[itemType]

    const { data: allRecipes } = await supabase
      .from('recipes')
      .select('id, title, category, ingredients')
      .eq('status', 'published')

    const withIngredients = (allRecipes ?? []).filter((r) => r.ingredients && r.ingredients.length > 0)

    let favoriteIds: string[] = []
    if (source === 'favorites') {
      const { data: favIds } = await supabase.from('favorites').select('recipe_id').eq('user_id', menuRow.user_id)
      favoriteIds = (favIds ?? []).map((f) => f.recipe_id)
    }

    const priorityPool = source === 'favorites' ? withIngredients.filter((r) => favoriteIds.includes(r.id)) : withIngredients
    const fallbackPool = source === 'favorites' ? withIngredients.filter((r) => !favoriteIds.includes(r.id)) : []

    const matches = (r: any) => classify(r.category) === kind && !currentIds.includes(r.id)

    const priorityCandidates = priorityPool.filter(matches)
    const fallbackCandidates = fallbackPool.filter(matches)
    const candidates = priorityCandidates.length > 0 ? priorityCandidates : fallbackCandidates

    if (candidates.length === 0) {
      return NextResponse.json(
        { error: 'Aucune autre recette disponible sur tout le site pour remplacer celle-ci.' },
        { status: 400 }
      )
    }

    const picked = candidates[Math.floor(Math.random() * candidates.length)]
    replacement = { id: picked.id, title: picked.title }
  }

  if (!replacement) {
    return NextResponse.json({ error: 'Erreur interne : aucun remplacement déterminé.' }, { status: 500 })
  }

  const updatedMenu = { ...menuRow.menu }
  updatedMenu[itemType] = updatedMenu[itemType].map((item: any) =>
    item.recipe_id === oldRecipeId ? { recipe_id: replacement!.id, recipe_title: replacement!.title } : item
  )

  await supabase.from('generated_menus').update({ menu: updatedMenu }).eq('id', menuId)

  return NextResponse.json({ menu: updatedMenu })
}