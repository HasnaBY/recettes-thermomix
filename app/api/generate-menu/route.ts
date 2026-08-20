import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function isDessertCategory(category: string | null) {
  if (!category) return false
  const c = category.toLowerCase()
  return c.includes('dessert') || c.includes('goûter') || c.includes('gouter')
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickWithPriority(
  priorityPool: { id: string; title: string }[],
  fallbackPool: { id: string; title: string }[],
  count: number
) {
  const shuffledPriority = shuffle(priorityPool)
  const shuffledFallback = shuffle(fallbackPool)

  const picked = shuffledPriority.slice(0, count)
  if (picked.length < count) {import { NextRequest, NextResponse } from 'next/server'
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

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickWithPriority(
  priorityPool: { id: string; title: string }[],
  fallbackPool: { id: string; title: string }[],
  count: number
) {
  const picked = shuffle(priorityPool).slice(0, count)
  if (picked.length < count) {
    picked.push(...shuffle(fallbackPool).slice(0, count - picked.length))
  }
  return picked
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()

  if (!userData.user) {
    return NextResponse.json({ error: 'Non connectée' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('approved, is_admin')
    .eq('id', userData.user.id)
    .single()

  if (!profile?.approved) {
    return NextResponse.json({ error: 'Compte non approuvé' }, { status: 403 })
  }

  if (!profile.is_admin) {
    const { data: settings } = await supabase
      .from('site_settings')
      .select('menu_generation_limit')
      .eq('id', 1)
      .single()

    const limit = settings?.menu_generation_limit ?? 3

    const { count } = await supabase
      .from('generated_menus')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userData.user.id)

    if ((count ?? 0) >= limit) {
      return NextResponse.json(
        { error: `Tu as atteint ta limite de ${limit} générations de menu.` },
        { status: 403 }
      )
    }
  }

  const body = await request.json()
  const { nbPlats, nbDesserts, nbBoissons = 0, nbPains = 0, source } = body

  const { data: allRecipes, error } = await supabase
    .from('recipes')
    .select('id, title, category, ingredients')

  if (error || !allRecipes) {
    return NextResponse.json({ error: 'Erreur lors de la récupération des recettes' }, { status: 500 })
  }

  const withIngredients = allRecipes.filter((r) => r.ingredients && r.ingredients.length > 0)

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

  const byKind = (pool: typeof withIngredients, kind: Kind) =>
    pool.filter((r) => classify(r.category) === kind).map((r) => ({ id: r.id, title: r.title }))

  const kinds: { key: Kind; requested: number; label: string }[] = [
    { key: 'plat', requested: nbPlats, label: 'plat(s)' },
    { key: 'dessert', requested: nbDesserts, label: 'dessert(s)/goûter(s)' },
    { key: 'boisson', requested: nbBoissons, label: 'boisson(s)' },
    { key: 'pain', requested: nbPains, label: 'pain(s)' },
  ]

  const notes: string[] = []
  const result: Record<string, { recipe_id: string; recipe_title: string }[]> = {
    plats: [],
    desserts: [],
    boissons: [],
    pains: [],
  }
  const resultKeyMap: Record<Kind, string> = { plat: 'plats', dessert: 'desserts', boisson: 'boissons', pain: 'pains', autre: '' }

  for (const k of kinds) {
    if (k.requested <= 0) continue

    const priority = byKind(priorityPool, k.key)
    const fallback = byKind(fallbackPool, k.key)
    const total = priority.length + fallback.length

    if (total === 0) {
      return NextResponse.json({ error: `Aucun ${k.label} disponible avec des ingrédients renseignés.` }, { status: 400 })
    }

    if (source === 'favorites' && k.requested > priority.length) {
      notes.push(
        `Tu n'as que ${priority.length} ${k.label} en favoris pour ${k.requested} demandé(s) — le menu a été complété avec d'autres recettes du site.`
      )
    }
    if (k.requested > total) {
      notes.push(`Seulement ${total} ${k.label} au total sont disponibles sur le site pour ${k.requested} demandé(s).`)
    }

    const chosen = pickWithPriority(priority, fallback, Math.min(k.requested, total))
    result[resultKeyMap[k.key]] = chosen.map((r) => ({ recipe_id: r.id, recipe_title: r.title }))
  }

  const menuJson = { ...result, notes }

  await supabase.from('generated_menus').insert({
    user_id: userData.user.id,
    params: { nbPlats, nbDesserts, nbBoissons, nbPains, source },
    menu: menuJson,
  })

  return NextResponse.json({ menu: menuJson })
}
    const remaining = count - picked.length
    picked.push(...shuffledFallback.slice(0, remaining))
  }
  return picked
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()

  if (!userData.user) {
    return NextResponse.json({ error: 'Non connectée' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('approved, is_admin')
    .eq('id', userData.user.id)
    .single()

  if (!profile?.approved) {
    return NextResponse.json({ error: 'Compte non approuvé' }, { status: 403 })
  }

  if (!profile.is_admin) {
    const { data: settings } = await supabase
      .from('site_settings')
      .select('menu_generation_limit')
      .eq('id', 1)
      .single()

    const limit = settings?.menu_generation_limit ?? 3

    const { count } = await supabase
      .from('generated_menus')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userData.user.id)

    if ((count ?? 0) >= limit) {
      return NextResponse.json(
        { error: `Tu as atteint ta limite de ${limit} générations de menu.` },
        { status: 403 }
      )
    }
  }

  const body = await request.json()
  const { nbPlats, nbDesserts, source } = body

  const { data: allRecipes, error } = await supabase
    .from('recipes')
    .select('id, title, category, ingredients')

  if (error || !allRecipes) {
    return NextResponse.json({ error: 'Erreur lors de la récupération des recettes' }, { status: 500 })
  }

  const withIngredients = allRecipes.filter((r) => r.ingredients && r.ingredients.length > 0)

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

  const platsPriority = priorityPool.filter((r) => !isDessertCategory(r.category)).map((r) => ({ id: r.id, title: r.title }))
  const dessertsPriority = priorityPool.filter((r) => isDessertCategory(r.category)).map((r) => ({ id: r.id, title: r.title }))
  const platsFallback = fallbackPool.filter((r) => !isDessertCategory(r.category)).map((r) => ({ id: r.id, title: r.title }))
  const dessertsFallback = fallbackPool.filter((r) => isDessertCategory(r.category)).map((r) => ({ id: r.id, title: r.title }))

  const notes: string[] = []
  if (source === 'favorites' && nbPlats > platsPriority.length) {
    notes.push(
      `Tu n'as que ${platsPriority.length} plat(s) en favoris pour ${nbPlats} demandé(s) — le menu a été complété avec d'autres recettes du site.`
    )
  }
  if (source === 'favorites' && nbDesserts > dessertsPriority.length) {
    notes.push(
      `Tu n'as que ${dessertsPriority.length} dessert(s)/goûter(s) en favoris pour ${nbDesserts} demandé(s) — le menu a été complété avec d'autres recettes du site.`
    )
  }

  const totalPlatsAvailable = platsPriority.length + platsFallback.length
  const totalDessertsAvailable = dessertsPriority.length + dessertsFallback.length

  if (nbPlats > 0 && totalPlatsAvailable === 0) {
    return NextResponse.json({ error: "Aucun plat disponible avec des ingrédients renseignés." }, { status: 400 })
  }
  if (nbDesserts > 0 && totalDessertsAvailable === 0) {
    return NextResponse.json({ error: "Aucun dessert/goûter disponible." }, { status: 400 })
  }

  if (nbPlats > totalPlatsAvailable) {
    notes.push(
      `Seulement ${totalPlatsAvailable} plat(s) au total sont disponibles sur le site pour ${nbPlats} demandé(s).`
    )
  }
  if (nbDesserts > totalDessertsAvailable) {
    notes.push(
      `Seulement ${totalDessertsAvailable} dessert(s) au total sont disponibles sur le site pour ${nbDesserts} demandé(s).`
    )
  }

  const chosenPlats = pickWithPriority(platsPriority, platsFallback, Math.min(nbPlats, totalPlatsAvailable))
  const chosenDesserts = pickWithPriority(dessertsPriority, dessertsFallback, Math.min(nbDesserts, totalDessertsAvailable))

  const menuJson = {
    plats: chosenPlats.map((r) => ({ recipe_id: r.id, recipe_title: r.title })),
    desserts: chosenDesserts.map((r) => ({ recipe_id: r.id, recipe_title: r.title })),
    notes,
  }

  await supabase.from('generated_menus').insert({
    user_id: userData.user.id,
    params: { nbPlats, nbDesserts, source },
    menu: menuJson,
  })

  return NextResponse.json({ menu: menuJson })
}