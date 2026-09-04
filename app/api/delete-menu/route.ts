import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return NextResponse.json({ error: 'Non connectée' }, { status: 401 })

  const { menuId } = await request.json()
  if (!menuId) return NextResponse.json({ error: 'Menu manquant' }, { status: 400 })

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', userData.user.id).single()

  let query = supabase.from('generated_menus').delete().eq('id', menuId)
  if (!profile?.is_admin) {
    query = query.eq('user_id', userData.user.id)
  }

  const { error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}