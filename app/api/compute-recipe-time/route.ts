import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return NextResponse.json({ error: 'Non connectée' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', userData.user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Réservé aux admins' }, { status: 403 })

  const { steps } = await request.json()

  if (!steps || steps.trim().length < 5) {
    return NextResponse.json({ error: "Renseigne d'abord les étapes de préparation." }, { status: 400 })
  }

  const prompt = `Voici les étapes d'une recette Thermomix :
"""
${steps}
"""

Additionne toutes les durées mentionnées dans ces étapes (cuisson, mixage, repos, préparation, etc.) pour obtenir le temps total en minutes. Si une durée est en secondes, convertis-la en minutes (arrondi au supérieur). Si aucune durée n'est mentionnée pour une étape, ignore-la simplement.

Réponds uniquement en JSON avec ce format exact :
{ "total_time_minutes": nombre }`

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

  const result = JSON.parse(data.choices[0].message.content)
  return NextResponse.json(result)
}