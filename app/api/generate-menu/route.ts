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

  const pool = source === 'favorites' ? withIngredients.filter((r) => favoriteIds.includes(r.id)) : withIngredients
  const fallbackPool = source === 'favorites' ? withIngredients.filter((r) => !favoriteIds.includes(r.id)) : []

  const platsFavPool = pool.filter((r) => !isDessertCategory(r.category)).map((r) => ({ id: r.id, title: r.title }))
  const dessertsFavPool = pool.filter((r) => isDessertCategory(r.category)).map((r) => ({ id: r.id, title: r.title }))
  const platsFallbackPool = fallbackPool.filter((r) => !isDessertCategory(r.category)).map((r) => ({ id: r.id, title: r.title }))
  const dessertsFallbackPool = fallbackPool.filter((r) => isDessertCategory(r.category)).map((r) => ({ id: r.id, title: r.title }))

  const notes: string[] = []
  if (source === 'favorites' && nbPlats > platsFavPool.length) {
    notes.push(
      `Tu n'as que ${platsFavPool.length} plat(s) en favoris pour ${nbPlats} demandé(s) — le menu a été complété avec d'autres recettes du site.`
    )
  }
  if (source === 'favorites' && nbDesserts > dessertsFavPool.length) {
    notes.push(
      `Tu n'as que ${dessertsFavPool.length} dessert(s)/goûter(s) en favoris pour ${nbDesserts} demandé(s) — le menu a été complété avec d'autres recettes du site.`
    )
  }

  if (nbPlats > 0 && platsFavPool.length + platsFallbackPool.length === 0) {
    return NextResponse.json({ error: "Aucun plat disponible avec des ingrédients renseignés." }, { status: 400 })
  }
  if (nbDesserts > 0 && dessertsFavPool.length + dessertsFallbackPool.length === 0) {
    return NextResponse.json({ error: "Aucun dessert/goûter disponible." }, { status: 400 })
  }

  const prompt = `Tu es un assistant culinaire. Voici des recettes disponibles, triées par priorité.

Plats en priorité (favoris) :
${JSON.stringify(platsFavPool)}
Plats de secours (à utiliser seulement si la liste ci-dessus ne suffit pas) :
${JSON.stringify(platsFallbackPool)}

Desserts/goûters en priorité (favoris) :
${JSON.stringify(dessertsFavPool)}
Desserts/goûters de secours (à utiliser seulement si la liste ci-dessus ne suffit pas) :
${JSON.stringify(dessertsFallbackPool)}

Choisis exactement ${nbPlats} plats au total : pioche d'abord dans "Plats en priorité", et seulement si ce n'est pas suffisant, complète avec "Plats de secours".
Choisis exactement ${nbDesserts} desserts/goûters au total, avec la même logique de priorité.
Utilise les "id" exacts fournis. Varie les choix, ne répète pas une recette sauf si nécessaire.
Réponds uniquement en JSON avec ce format :
{
  "plats": [{ "recipe_id": "uuid-exact" }],
  "desserts": [{ "recipe_id": "uuid-exact" }]
}`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.error?.message ?? 'Erreur OpenAI')

    const menuJson = JSON.parse(data.choices[0].message.content)

    const recipeMap = new Map(allRecipes.map((r) => [r.id, r]))
    menuJson.plats?.forEach((item: any) => {
      item.recipe_title = recipeMap.get(item.recipe_id)?.title ?? 'Recette inconnue'
    })
    menuJson.desserts?.forEach((item: any) => {
      item.recipe_title = recipeMap.get(item.recipe_id)?.title ?? 'Recette inconnue'
    })
    menuJson.notes = notes

    await supabase.from('generated_menus').insert({
      user_id: userData.user.id,
      params: { nbPlats, nbDesserts, source },
      menu: menuJson,
    })

    return NextResponse.json({ menu: menuJson })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}