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

  const { data: requesterProfile } = await supabase
    .from('profiles')
    .select('approved, is_admin')
    .eq('id', userData.user.id)
    .single()

  const body = await request.json()
  const { nbPlats, nbDesserts, nbBoissons = 0, nbPains = 0, source, targetUserId, preview = false, periodStart } = body

  const isAdminAssigning = !!targetUserId && requesterProfile?.is_admin
  const ownerId = isAdminAssigning ? targetUserId : userData.user.id

  if (!isAdminAssigning) {
    if (!requesterProfile?.approved) {
      return NextResponse.json({ error: 'Compte non approuvé' }, { status: 403 })
    }

    if (!requesterProfile.is_admin) {
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
        .eq('origin', 'client')

      if ((count ?? 0) >= limit) {
        return NextResponse.json(
          { error: `Tu as atteint ta limite de ${limit} générations de menu.` },
          { status: 403 }
        )
      }
    }
  }

  const { data: allRecipes, error } = await supabase
    .from('recipes')
    .select('id, title, category, ingredients')
    .eq('status', 'published')

  if (error || !allRecipes) {
    return NextResponse.json({ error: 'Erreur lors de la récupération des recettes' }, { status: 500 })
  }

  const withIngredients = allRecipes.filter((r) => r.ingredients && r.ingredients.length > 0)

  let favoriteIds: string[] = []
  if (source === 'favorites') {
    const { data: favIds } = await supabase.from('favorites').select('recipe_id').eq('user_id', ownerId)
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

    if (!isAdminAssigning && source === 'favorites' && k.requested > priority.length) {
      notes.push(
        `Il n'y a que ${priority.length} ${k.label} en favoris pour ${k.requested} demandé(s) — le menu a été complété avec d'autres recettes du site.`
      )
    }
    if (k.requested > total) {
      notes.push(`Seulement ${total} ${k.label} au total sont disponibles sur le site pour ${k.requested} demandé(s).`)
    }

    const chosen = pickWithPriority(priority, fallback, Math.min(k.requested, total))
    result[resultKeyMap[k.key]] = chosen.map((r) => ({ recipe_id: r.id, recipe_title: r.title }))
  }

  const menuJson = { ...result, notes }
  const params = { nbPlats, nbDesserts, nbBoissons, nbPains, source, periodStart: periodStart ?? null }

  if (preview) {
    return NextResponse.json({ menu: menuJson, params })
  }

  const { error: insertError } = await supabase.from('generated_menus').insert({
    user_id: ownerId,
    created_by: userData.user.id,
    origin: isAdminAssigning ? 'admin' : 'client',
    params,
    menu: menuJson,
  })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ menu: menuJson })
}