import { SupabaseClient } from '@supabase/supabase-js'

export async function logActivity(
  supabase: SupabaseClient,
  userId: string,
  eventType: 'recipe_view' | 'menu_generated' | 'favorite_added' | 'tip_view',
  detail?: string
) {
  try {
    await supabase.from('client_activity').insert({ user_id: userId, event_type: eventType, detail: detail ?? null })
  } catch {
    // Le suivi ne doit jamais bloquer l'action principale de la cliente.
  }
}