import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const CATEGORIES = [
  'Fruits & légumes',
  'Viandes & poissons',
  'Produits laitiers & œufs',
  'Épicerie & féculents',
  'Boissons',
  'Épices & condiments',
  'Autres',
]

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return NextResponse.json({ error: 'Non connectée' }, { status: 401 })

  const { data: aiFeatures } = await supabase
    .from('ai_features')
    .select('ingredient_categorization_enabled')
    .eq('id', 1)
    .single()

  if (!aiFeatures?.ingredient_categorization_enabled) {
    return NextResponse.json({ error: 'Fonctionnalité désactivée' }, { status: 403 })
  }

  const { ingredients } = await request.json()

  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return NextResponse.json({ error: 'Liste vide' }, { status: 400 })
  }

  const uniqueIngredients = [...new Set(ingredients)]

  const prompt = `Classe chacun de ces ingrédients de cuisine dans EXACTEMENT une des catégories suivantes : ${CATEGORIES.join(', ')}.

Les ingrédients peuvent contenir des quantités, unités, ou précisions (ex: "200g de farine", "2 œufs bio", "1 pincée de sel fin") — ignore la quantité et concentre-toi sur le produit lui-même.

Ingrédients à classer :
${uniqueIngredients.map((ing, i) => `${i + 1}. ${ing}`).join('\n')}

Réponds uniquement en JSON avec ce format exact, un objet où chaque clé est l'ingrédient EXACT tel que donné ci-dessus et la valeur sa catégorie :
{ "200g de farine": "Épicerie & féculents", "2 œufs bio": "Produits laitiers & œufs" }`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    }),
  })

  const data = await response.json()
  if (!response.ok) return NextResponse.json({ error: data.error?.message ?? 'Erreur IA' }, { status: 500 })

  try {
    const mapping = JSON.parse(data.choices[0].message.content)
    return NextResponse.json({ mapping })
  } catch {
    return NextResponse.json({ error: "Erreur lors de l'analyse de la réponse IA" }, { status: 500 })
  }
}