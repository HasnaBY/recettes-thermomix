'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import MenuPdfDownloadButton from '@/components/MenuPdfDownloadButton'
import { formatWeekLabel } from '@/lib/dateHelpers'

type MenuRow = {
  id: string
  menu: { plats: { recipe_id: string; recipe_title: string }[]; desserts: { recipe_id: string; recipe_title: string }[]; boissons?: any[]; pains?: any[] }
  created_at: string
  origin: string
  week_start: string | null
  pdf_url: string | null
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

  const weekGroups = new Map<string, MenuRow[]>()
  menus.forEach((row) => {
    const key = row.week_start ?? row.created_at.split('T')[0]
    if (!weekGroups.has(key)) weekGroups.set(key, [])
    weekGroups.get(key)!.push(row)
  })
  const sortedWeeks = [...weekGroups.keys()].sort((a, b) => (a < b ? 1 : -1))

  return (
    <div className="px-6 sm:px-8 py-12 max-w-2xl mx-auto">
      <Link href="/generateur-menu" className="inline-block mb-4 text-sm text-[#3A3532]/70 hover:text-[#3A3532]">
        ← Générateur de menu
      </Link>

      <h1 className="font-display text-3xl text-[#3A3532] mb-8 text-center">Historique de mes menus</h1>

      {sortedWeeks.length === 0 ? (
        <p className="text-[#3A3532]/60 text-center">Aucun menu généré pour le moment.</p>
      ) : (
        <div className="flex flex-col gap-10">
          {sortedWeeks.map((weekKey) => (
            <div key={weekKey}>
              <h2 className="font-display text-lg text-[#3A3532] mb-4 border-b border-[#F0EAE0] pb-2">
                {formatWeekLabel(weekKey)}
              </h2>

              <div className="flex flex-col gap-4">
                {weekGroups.get(weekKey)!.map((row) => (
                  <div key={row.id} className="border border-[#F0EAE0] bg-white rounded-2xl p-5">
                    <div className="flex justify-between items-center mb-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          row.origin === 'admin' ? 'bg-[#C9A44C]/30 text-[#3A3532]' : 'bg-[#F0EAE0] text-[#3A3532]'
                        }`}
                      >
                        {row.origin === 'admin' ? '💛 Proposé par Hasna' : 'Généré par moi'}
                      </span>
                      <p className="text-xs text-[#3A3532]/40">
                        {new Date(row.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>

                    {row.pdf_url && (
                      
                        href={row.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mb-3 text-xs text-[#3A3532] underline"
                      >
                        📄 Revoir le PDF déjà généré
                      </a>
                    )}

                    {[
                      { key: 'plats', label: '🍽️ Plats' },
                      { key: 'desserts', label: '🍰 Desserts / goûters' },
                      { key: 'boissons', label: '🥤 Boissons' },
                      { key: 'pains', label: '🍞 Pains' },
                    ].map(({ key, label }) => {
                      const items = (row.menu as any)[key] as { recipe_id: string; recipe_title: string }[] | undefined
                      if (!items || items.length === 0) return null
                      return (
                        <div key={key} className="mb-3">
                          <p className="text-sm font-medium text-[#3A3532] mb-1">{label}</p>
                          <div className="flex flex-wrap gap-2">
                            {items.map((item, i) => (
                              <Link
                                key={i}
                                href={`/recipes/${item.recipe_id}`}
                                className="text-xs px-2 py-1 bg-[#F0EAE0] rounded-full no-underline text-[#3A3532]"
                              >
                                {item.recipe_title}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )
                    })}

                    <MenuPdfDownloadButton menu={row.menu} origin={row.origin} periodStart={weekKey} menuId={row.id} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}