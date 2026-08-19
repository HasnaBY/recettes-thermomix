'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type MenuRow = {
  id: string
  menu: { plats: { recipe_id: string; recipe_title: string }[]; desserts: { recipe_id: string; recipe_title: string }[] }
  created_at: string
}

export default function MesMenus() {
  const [menus, setMenus] = useState<MenuRow[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      const { data } = await supabase
        .from('generated_menus')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false })

      setMenus(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="p-8 text-center text-[#3A3532]/60">Chargement...</div>

  return (
    <div className="px-6 sm:px-8 py-12 max-w-2xl mx-auto">
      <Link href="/generateur-menu" className="inline-block mb-4 text-sm text-[#3A3532]/70 hover:text-[#3A3532]">
        ← Générateur de menu
      </Link>

      <h1 className="font-display text-3xl text-[#3A3532] mb-8 text-center">Historique de mes menus</h1>

      {menus.length === 0 ? (
        <p className="text-[#3A3532]/60 text-center">Aucun menu généré pour le moment.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {menus.map((row) => (
            <div key={row.id} className="border border-[#F0EAE0] bg-white rounded-2xl p-5">
              <p className="text-xs text-[#3A3532]/40 mb-3">
                {new Date(row.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>

              {row.menu.plats?.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-[#3A3532] mb-1">🍽️ Plats</p>
                  <div className="flex flex-wrap gap-2">
                    {row.menu.plats.map((item, i) => (
                      <Link
                        key={i}
                        href={`/recipes/${item.recipe_id}`}
                        className="text-xs px-2 py-1 bg-[#DCEAF0]/30 rounded-full no-underline text-[#3A3532]"
                      >
                        {item.recipe_title}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {row.menu.desserts?.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-[#3A3532] mb-1">🍰 Desserts / goûters</p>
                  <div className="flex flex-wrap gap-2">
                    {row.menu.desserts.map((item, i) => (
                      <Link
                        key={i}
                        href={`/recipes/${item.recipe_id}`}
                        className="text-xs px-2 py-1 bg-[#F6DEE1]/30 rounded-full no-underline text-[#3A3532]"
                      >
                        {item.recipe_title}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}