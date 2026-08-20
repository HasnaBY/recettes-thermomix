import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return NextResponse.json({ error: 'Non connectée' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('approved').eq('id', userData.user.id).single()
  if (!profile?.approved) return NextResponse.json({ error: 'Compte non approuvé' }, { status: 403 })

  const { data: aiFeatures } = await supabase.from('ai_features').select('chatbot_enabled').eq('id', 1).single()
  if (!aiFeatures?.chatbot_enabled) return NextResponse.json({ error: 'Fonctionnalité désactivée' }, { status: 403 })

  const { messages } = await request.json()

  const systemPrompt = `Tu es l'assistant culinaire du site "Thermomix With Love, Hasna". Tu réponds aux questions sur le Thermomix (TM5, TM6, TM7/Sensor) : substitutions d'ingrédients, vitesses/températures/modes, adaptation de recettes entre modèles. Réponds de façon concise, chaleureuse, pratique. Si tu n'es pas sûre d'une info technique précise, dis-le honnêtement plutôt que d'inventer.`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
    }),
  })

  const data = await response.json()
  if (!response.ok) return NextResponse.json({ error: data.error?.message ?? 'Erreur IA' }, { status: 500 })

  return NextResponse.json({ reply: data.choices[0].message.content })
}