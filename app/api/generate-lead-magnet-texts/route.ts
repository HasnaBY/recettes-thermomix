import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return NextResponse.json({ error: 'Non connectée' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', userData.user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Réservé aux admins' }, { status: 403 })

  const { data: aiFeatures } = await supabase.from('ai_features').select('recipe_writer_enabled').eq('id', 1).single()
  if (!aiFeatures?.recipe_writer_enabled) {
    return NextResponse.json({ error: 'Fonctionnalité désactivée' }, { status: 403 })
  }

  const { recipeTitle, recipeDescription, ingredients, prepTime, totalTime } = await request.json()

  const prompt = `Tu rédiges les textes marketing d'un PDF "recette gratuite" offert en échange d'un email, pour une conseillère Thermomix nommée Hasna (marque "Thermomix With Love, Hasna" / "Le Cercle With Love, Hasna").

Recette concernée : ${recipeTitle}
Description existante : ${recipeDescription ?? '(aucune)'}
Ingrédients principaux : ${(ingredients ?? []).slice(0, 6).join(', ')}
Temps de préparation : ${prepTime ?? 'non précisé'} min, temps total : ${totalTime ?? 'non précisé'} min

Génère les textes suivants, ton chaleureux et gourmand, orienté vente douce (donner envie sans être trop insistant) :
1. page_title : titre accrocheur pour la page web qui propose cette recette gratuite (court, orienté bénéfice, ex: "Reçois ma recette de ...")
2. page_subtitle : phrase d'accroche sous ce titre (1 phrase courte)
3. button_label : texte du bouton d'envoi (court, à la première personne, ex: "Je veux ma recette gratuite")
4. pdf_subtitle : phrase courte mettant en avant un avantage clé de la recette pour le PDF (ex: "prête en 15 minutes au Thermomix")
5. pdf_intro : phrase d'intro sous le titre dans le PDF (ex: "Recette testée et approuvée par mes clientes")
6. pdf_serving_suggestions : 3 à 5 idées de dégustation ou d'accompagnement, séparées par " • " (juste les mots, pas de phrase)
7. pdf_cta_title : titre du bandeau final du PDF, invitant à en savoir plus (ex: "Envie de plus de recettes comme celle-ci ?")
8. pdf_cta_subtitle : sous-texte du bandeau final, avec appel à rejoindre la communauté

Réponds uniquement en JSON avec ce format exact :
{
  "page_title": "...",
  "page_subtitle": "...",
  "button_label": "...",
  "pdf_subtitle": "...",
  "pdf_intro": "...",
  "pdf_serving_suggestions": "...",
  "pdf_cta_title": "...",
  "pdf_cta_subtitle": "..."
}`

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
    const texts = JSON.parse(data.choices[0].message.content)
    return NextResponse.json(texts)
  } catch {
    return NextResponse.json({ error: "Erreur lors de l'analyse de la réponse IA" }, { status: 500 })
  }
}