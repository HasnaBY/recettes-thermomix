import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getMondayOfWeek, toDateInputValue } from '@/lib/dateHelpers'

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

  const weekStart = toDateInputValue(
    getMondayOfWeek(params?.periodStart ? new Date(params.periodStart + 'T00:00:00') : new Date())
  )

  const rows = ids.map((id) => ({
    user_id: id,
    created_by: userData.user.id,
    origin: 'admin',
    params,
    menu,
    week_start: weekStart,
  }))

  const { data: insertedRows, error } = await supabase.from('generated_menus').insert(rows).select('id, user_id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, count: ids.length, insertedRows })
}