import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return NextResponse.json({ error: 'Non connectée' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', userData.user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Réservé aux admins' }, { status: 403 })

  const { data: aiFeatures } = await supabase.from('ai_features').select('auto_tagging_enabled').eq('id', 1).single()
  if (!aiFeatures?.auto_tagging_enabled) {
    return NextResponse.json({ error: 'Fonctionnalité désactivée' }, { status: 403 })
  }

  const { title, description, ingredients } = await request.json()

  const { data: categories } = await supabase.from('recipe_categories').select('label')
  const { data: origins } = await supabase.from('recipe_origins').select('label')

  const prompt = `Tu catégorises et décris des recettes pour un site Thermomix. Voici la recette :
Titre : ${title}
Description actuelle : ${description ?? '(aucune)'}
Ingrédients : ${(ingredients ?? []).join(', ')}

Propose une DESCRIPTION courte et accrocheuse (1-2 phrases), ton chaleureux, pour un site de conseillère Thermomix appelé "Thermomix With Love, Hasna".

Choisis une CATEGORIE parmi cette liste existante si une convient : ${JSON.stringify((categories ?? []).map((c) => c.label))}. Si aucune ne convient, propose-en une nouvelle avec la première lettre de chaque mot en majuscule (ex: "Petit Déjeuner").

Choisis une ORIGINE parmi cette liste existante si une convient : ${JSON.stringify((origins ?? []).map((o) => o.label))}. Si incertaine, propose une nouvelle origine avec la première lettre en majuscule, ou null.

Réponds uniquement en JSON avec ce format exact :
{ "description": "...", "category": "...", "origin": "..." ou null }`

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

  const tags = JSON.parse(data.choices[0].message.content)

  // Ajoute la catégorie/origine proposée aux listes si elle n'existe pas déjà
  if (tags.category) {
    await supabase.from('recipe_categories').upsert({ label: tags.category }, { onConflict: 'label' })
  }
  if (tags.origin) {
    await supabase.from('recipe_origins').upsert({ label: tags.origin }, { onConflict: 'label' })
  }

  return NextResponse.json(tags)
}