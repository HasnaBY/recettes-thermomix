
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return NextResponse.json({ error: 'Non connectée' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', userData.user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Réservé aux admins' }, { status: 403 })

  const { data: aiFeatures } = await supabase.from('ai_features').select('recipe_writer_enabled').eq('id', 1).single()
  if (!aiFeatures?.recipe_writer_enabled) return NextResponse.json({ error: 'Fonctionnalité désactivée' }, { status: 403 })

  const { type, input } = await request.json()

  const prompt =
    type === 'description'
      ? `Écris une description accrocheuse (2-3 phrases) pour cette recette Thermomix, ton chaleureux et gourmand, pour une conseillère Thermomix nommée Hasna (marque "Thermomix With Love, Hasna"). Titre : ${input.title}. Ingrédients principaux : ${input.ingredients}.`
      : `Rédige une newsletter courte (100-150 mots) pour les clientes de Hasna, conseillère Thermomix ("Thermomix With Love, Hasna"), sur le sujet suivant : ${input.topic}. Ton chaleureux, personnel, avec un appel à l'action à la fin.`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  const data = await response.json()
  if (!response.ok) return NextResponse.json({ error: data.error?.message ?? 'Erreur IA' }, { status: 500 })

  return NextResponse.json({ text: data.choices[0].message.content })
}