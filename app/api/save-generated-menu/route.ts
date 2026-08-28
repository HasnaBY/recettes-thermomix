import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return NextResponse.json({ error: 'Non connectée' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', userData.user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Réservé aux admins' }, { status: 403 })

  const { targetUserId, menu, params } = await request.json()

  if (!targetUserId || !menu) {
    return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
  }

  const { error } = await supabase.from('generated_menus').insert({
    user_id: targetUserId,
    created_by: userData.user.id,
    origin: 'admin',
    params,
    menu,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}