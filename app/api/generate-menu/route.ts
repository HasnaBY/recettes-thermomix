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

  // Vérifie la limite de générations pour les non-admins
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

  let recipesQuery = supabase
    .from('recipes')
    .select('id, title, category, ingredients')

  if (source === 'favorites') {
    const { data: favIds } = await supabase
      .from('favorites')
      .select('recipe_id')
      .eq('user_id', userData.user.id)

    const ids = (favIds ?? []).map((f) => f.recipe_id)
    if (ids.length === 0) {
      return NextResponse.json({ error: "Tu n'as pas encore de recettes favorites." }, { status: 400 })
    }
    recipesQuery = recipesQuery.in('id', ids)
  }

  const { data: recipes, error } = await recipesQuery

  if (error || !recipes) {
    return NextResponse.json({ error: 'Erreur lors de la récupération des recettes' }, { status: 500 })
  }

  const withIngredients = recipes.filter((r) => r.ingredients && r.ingredients.length > 0)

  const platsPool = withIngredients
    .filter((r) => !isDessertCategory(r.category))
    .map((r) => ({ id: r.id, title: r.title, category: r.category }))

  const dessertsPool = withIngredients
    .filter((r) => isDessertCategory(r.category))
    .map((r) => ({ id: r.id, title: r.title, category: r.category }))

  if (nbPlats > 0 && platsPool.length === 0) {
    return NextResponse.json(
      { error: "Aucun plat disponible avec des ingrédients renseignés." },
      { status: 400 }
    )
  }
  if (nbDesserts > 0 && dessertsPool.length === 0) {
    return NextResponse.json(
      { error: "Aucun dessert/goûter disponible avec des ingrédients renseignés." },
      { status: 400 }
    )
  }

  const prompt = `Tu es un assistant culinaire. Voici deux listes de recettes disponibles, déjà triées par type.

Plats disponibles (JSON) :
${JSON.stringify(platsPool)}

Desserts/goûters disponibles (JSON) :
${JSON.stringify(dessertsPool)}

Choisis exactement ${nbPlats} plats en piochant UNIQUEMENT dans la liste "Plats disponibles" (utilise leur "id" exact).
Choisis exactement ${nbDesserts} desserts/goûters en piochant UNIQUEMENT dans la liste "Desserts/goûters disponibles" (utilise leur "id" exact).
Varie les choix autant que possible, ne répète pas la même recette deux fois sauf si la liste est trop courte pour le nombre demandé.
Réponds uniquement en JSON, avec exactement ce format :
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

    if (!response.ok) {
      throw new Error(data.error?.message ?? 'Erreur OpenAI')
    }

    const menuJson = JSON.parse(data.choices[0].message.content)

    const recipeMap = new Map(recipes.map((r) => [r.id, r]))
    menuJson.plats?.forEach((item: any) => {
      item.recipe_title = recipeMap.get(item.recipe_id)?.title ?? 'Recette inconnue'
    })
    menuJson.desserts?.forEach((item: any) => {
      item.recipe_title = recipeMap.get(item.recipe_id)?.title ?? 'Recette inconnue'
    })

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