import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return NextResponse.json({ error: 'Non connectée' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', userData.user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Réservé aux admins' }, { status: 403 })

  const { targetUserId, targetUserIds, menu, params } = await request.json()

  const ids: string[] = targetUserIds && targetUserIds.length > 0 ? targetUserIds : targetUserId ? [targetUserId] : []

  if (ids.length === 0 || !menu) {
    return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
  }

  const rows = ids.map((id) => ({
    user_id: id,
    created_by: userData.user.id,
    origin: 'admin',
    params,
    menu,
  }))

  const { error } = await supabase.from('generated_menus').insert(rows)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, count: ids.length })
}