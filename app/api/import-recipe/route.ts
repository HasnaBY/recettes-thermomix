import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return NextResponse.json({ error: 'Non connectée' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', userData.user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Réservé aux admins' }, { status: 403 })

  const { data: aiFeatures } = await supabase.from('ai_features').select('recipe_import_enabled').eq('id', 1).single()
  if (!aiFeatures?.recipe_import_enabled) {
    return NextResponse.json({ error: 'Fonctionnalité désactivée' }, { status: 403 })
  }

  const { url, rawText } = await request.json()

  let content = rawText

  if (url) {
    try {
      const pageResponse = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
      if (!pageResponse.ok) throw new Error('Page inaccessible')
      const html = await pageResponse.text()
      content = stripHtml(html).slice(0, 15000)
    } catch (err: any) {
      return NextResponse.json({ error: "Impossible de récupérer le contenu de cette URL." }, { status: 400 })
    }
  }

  if (!content || content.trim().length < 20) {
    return NextResponse.json({ error: 'Contenu introuvable ou trop court.' }, { status: 400 })
  }

  const { data: categories } = await supabase.from('recipe_categories').select('label')
  const { data: origins } = await supabase.from('recipe_origins').select('label')

  const prompt = `Voici le contenu brut d'une page contenant une recette :
"""
${content}
"""

Extrais le TITRE, les INGREDIENTS et les ETAPES EXACTEMENT comme écrits sur la page, mot pour mot, sans reformuler ni résumer.

Propose en plus une DESCRIPTION courte et accrocheuse (celle-ci peut être reformulée avec tes propres mots, 1-2 phrases).

Choisis une CATEGORIE parmi cette liste existante si une convient : ${JSON.stringify((categories ?? []).map((c) => c.label))}. Sinon, propose une nouvelle catégorie (première lettre en majuscule).

Choisis une ORIGINE parmi cette liste existante si une convient : ${JSON.stringify((origins ?? []).map((o) => o.label))}. Sinon, propose une nouvelle origine ou null si incertaine.

Extrais le temps de préparation (temps actif en cuisine) en minutes si mentionné sur la page.

Calcule aussi le TEMPS TOTAL en minutes en additionnant toutes les durées mentionnées dans les étapes (cuisson, mixage, repos, etc.) — si la page indique déjà un temps total explicite, utilise-le en priorité.

Réponds uniquement en JSON avec ce format exact :
{
  "title": "...",
  "description": "...",
  "category": "...",
  "origin": "..." ou null,
  "prep_time_minutes": nombre ou null,
  "total_time_minutes": nombre ou null,
  "ingredients": ["...", "..."],
  "steps": "..."
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