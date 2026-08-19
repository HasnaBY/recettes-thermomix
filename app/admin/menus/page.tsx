'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type MenuRow = {
  id: string
  user_id: string
  menu: { plats: { recipe_id: string; recipe_title: string }[]; desserts: { recipe_id: string; recipe_title: string }[] }
  created_at: string
}

export default function AdminMenus() {
  const [menus, setMenus] = useState<MenuRow[]>([])
  const [emailMap, setEmailMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('generated_menus')
        .select('*')
        .order('created_at', { ascending: false })

      const rows = data ?? []
      setMenus(rows)

      const userIds = [...new Set(rows.map((r) => r.user_id))]
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', userIds)

        const map: Record<string, string> = {}
        profiles?.forEach((p) => (map[p.id] = p.email))
        setEmailMap(map)
      }

      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement...</div>

  return (
    <div className="p-6 sm:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tous les menus générés ({menus.length})</h1>

      {menus.length === 0 ? (
        <p className="text-gray-500">Aucun menu généré pour le moment.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {menus.map((row) => (
            <div key={row.id} className="border border-gray-200 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-900">{emailMap[row.user_id] ?? row.user_id}</span>
                <span className="text-xs text-gray-400">
                  {new Date(row.created_at).toLocaleDateString('fr-FR')}
                </span>
              </div>

              {row.menu.plats?.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs text-gray-500 mb-1">Plats</p>
                  <div className="flex flex-wrap gap-1">
                    {row.menu.plats.map((item, i) => (
                      <Link
                        key={i}
                        href={`/recipes/${item.recipe_id}`}
                        className="text-xs px-2 py-0.5 bg-gray-100 rounded-full no-underline text-gray-700"
                      >
                        {item.recipe_title}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {row.menu.desserts?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Desserts</p>
                  <div className="flex flex-wrap gap-1">
                    {row.menu.desserts.map((item, i) => (
                      <Link
                        key={i}
                        href={`/recipes/${item.recipe_id}`}
                        className="text-xs px-2 py-0.5 bg-gray-100 rounded-full no-underline text-gray-700"
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