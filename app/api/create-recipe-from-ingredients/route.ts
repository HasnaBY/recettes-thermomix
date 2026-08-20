import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return NextResponse.json({ error: 'Non connectée' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', userData.user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Réservé aux admins' }, { status: 403 })

  const { data: aiFeatures } = await supabase.from('ai_features').select('recipe_creator_enabled').eq('id', 1).single()
  if (!aiFeatures?.recipe_creator_enabled) return NextResponse.json({ error: 'Fonctionnalité désactivée' }, { status: 403 })

  const { rawIdea } = await request.json()

  const prompt = `Tu es expert Thermomix. Transforme cette idée brute en recette structurée au format Thermomix (vitesses, températures, minutages, modes comme "Sens inverse" si pertinent) :

"${rawIdea}"

Réponds uniquement en JSON avec ce format exact :
{
  "title": "titre de la recette",
  "description": "description courte et accrocheuse",
  "category": "plat|salade|dessert|pain|boisson",
  "ingredients": ["200g de farine", "..."],
  "steps": "étapes détaillées avec vitesse/température/minutage Thermomix, séparées par des retours à la ligne"
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

  return NextResponse.json(JSON.parse(data.choices[0].message.content))
}