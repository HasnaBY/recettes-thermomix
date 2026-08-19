import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()

  if (!userData.user) {
    return NextResponse.json({ error: 'Non connectée' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('approved')
    .eq('id', userData.user.id)
    .single()

  if (!profile?.approved) {
    return NextResponse.json({ error: 'Compte non approuvé' }, { status: 403 })
  }

  const body = await request.json()
  const { days, people, objective, source } = body

  let recipesQuery = supabase
    .from('recipes')
    .select('id, title, category, prep_time_minutes, total_time_minutes, ingredients')

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

  const recipesForPrompt = recipes
    .filter((r) => r.ingredients && r.ingredients.length > 0)
    .map((r) => ({
      id: r.id,
      title: r.title,
      category: r.category,
      prep_time: r.prep_time_minutes,
      total_time: r.total_time_minutes,
    }))

  if (recipesForPrompt.length === 0) {
    return NextResponse.json(
      { error: "Aucune recette disponible avec des ingrédients renseignés pour générer un menu." },
      { status: 400 }
    )
  }

  const prompt = `Tu es un assistant culinaire. Voici une liste de recettes disponibles au format JSON :
${JSON.stringify(recipesForPrompt)}

Génère un menu pour ${days} jours, pour ${people} personnes, avec l'objectif "${objective}".
Choisis uniquement des recettes présentes dans la liste ci-dessus (utilise leur "id" exact).
Varie les recettes autant que possible, ne répète pas la même recette deux fois sauf si la liste est très courte.
Réponds uniquement en JSON, avec exactement ce format :
{
  "days": [
    { "day": "Lundi", "meals": [ { "type": "Dîner", "recipe_id": "uuid-exact-de-la-liste" } ] }
  ]
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
    menuJson.days.forEach((day: any) => {
      day.meals.forEach((meal: any) => {
        const recipe = recipeMap.get(meal.recipe_id)
        meal.recipe_title = recipe?.title ?? 'Recette inconnue'
      })
    })

    await supabase.from('generated_menus').insert({
      user_id: userData.user.id,
      params: { days, people, objective, source },
      menu: menuJson,
    })

    return NextResponse.json({ menu: menuJson })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}