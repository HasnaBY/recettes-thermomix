import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return NextResponse.json({ recipes: [] })

  const { data: aiFeatures } = await supabase.from('ai_features').select('recommendations_enabled').eq('id', 1).single()
  if (!aiFeatures?.recommendations_enabled) return NextResponse.json({ recipes: [] })

  const { data: favData } = await supabase
    .from('favorites')
    .select('recipe_id, recipes(category, origin)')
    .eq('user_id', userData.user.id)

  const favIds = (favData ?? []).map((f: any) => f.recipe_id)
  const categories = [...new Set((favData ?? []).map((f: any) => f.recipes?.category).filter(Boolean))]
  const origins = [...new Set((favData ?? []).map((f: any) => f.recipes?.origin).filter(Boolean))]

  if (favIds.length === 0) return NextResponse.json({ recipes: [] })

  const { data: candidates } = await supabase
    .from('recipes')
    .select('id, title, category, origin, image_url')
    .not('id', 'in', `(${favIds.join(',')})`)

  const scored = (candidates ?? []).map((r) => {
    let score = 0
    if (categories.includes(r.category)) score += 2
    if (r.origin && origins.includes(r.origin)) score += 1
    return { ...r, score }
  })

  const recommended = scored
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)

  return NextResponse.json({ recipes: recommended })
}