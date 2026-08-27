import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return NextResponse.json({ error: 'Non connectée' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', userData.user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Réservé aux admins' }, { status: 403 })

  const { data: aiFeatures } = await supabase.from('ai_features').select('translate_enabled').eq('id', 1).single()
  if (!aiFeatures?.translate_enabled) return NextResponse.json({ error: 'Fonctionnalité désactivée' }, { status: 403 })

  const { title, description, ingredients, steps, advice } = await request.json()

  const prompt = `Traduis vers le français les champs suivants d'une recette Thermomix, si nécessaire (s'ils sont déjà en français, laisse-les identiques).

IMPORTANT — conversion des unités : en plus de la traduction du texte, convertis systématiquement toutes les unités de mesure non françaises vers les unités françaises standard :
- Températures en °F → convertis en °C (arrondi à l'entier le plus proche)
- Volumes en cups, tablespoons (tbsp), teaspoons (tsp), fl oz → convertis en ml ou cl (arrondi à un chiffre logique, ex: multiples de 5 ou 10 ml)
- Poids en oz (once), lb (livre) → convertis en g ou kg
- Longueurs en inches → convertis en cm si pertinent (ex: taille d'un moule)
- Une fois convertie, la quantité doit être exprimée uniquement dans l'unité française (ne garde pas l'unité d'origine entre parenthèses)
- Les vitesses/températures/minutages spécifiques au Thermomix (déjà en °C, ml, g) doivent rester inchangés

Titre : ${title ?? ''}
Description : ${description ?? ''}
Ingrédients : ${JSON.stringify(ingredients ?? [])}
Étapes : ${steps ?? ''}
Conseils : ${advice ?? ''}

Réponds uniquement en JSON avec ce format exact :
{ "title": "...", "description": "...", "ingredients": ["...", "..."], "steps": "...", "advice": "..." }`

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

  return NextResponse.json(JSON.parse(data.choices[0].message.content))
}