'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import MenuPdfDownloadButton from '@/components/MenuPdfDownloadButton'
import { formatWeekLabel } from '@/lib/dateHelpers'

type MenuRow = {
  id: string
  user_id: string
  menu: { plats: { recipe_id: string; recipe_title: string }[]; desserts: { recipe_id: string; recipe_title: string }[]; boissons?: any[]; pains?: any[]; entrees?: any[] }
  created_at: string
  origin: string
  week_start: string | null
  pdf_url: string | null
}

export default function AdminMenus() {
  const [menus, setMenus] = useState<MenuRow[]>([])
  const [emailMap, setEmailMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('generated_menus').select('*').order('created_at', { ascending: false })
      const rows = data ?? []
      setMenus(rows)

      const userIds = [...new Set(rows.map((r) => r.user_id))]
      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('id, email').in('id', userIds)
        const map: Record<string, string> = {}
        profiles?.forEach((p) => (map[p.id] = p.email))
        setEmailMap(map)
      }

      setLoading(false)
    }
    load()
  }, [])

  const handleDelete = async (menuId: string) => {
    if (!confirm('Supprimer définitivement ce menu ?')) return
    setDeletingId(menuId)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    const response = await fetch('/api/delete-menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ menuId }),
    })

    if (response.ok) {
      setMenus((prev) => prev.filter((m) => m.id !== menuId))
    } else {
      alert('Erreur lors de la suppression.')
    }
    setDeletingId(null)
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement...</div>

  const weekGroups = new Map<string, MenuRow[]>()
  menus.forEach((row) => {
    const key = row.week_start ?? row.created_at.split('T')[0]
    if (!weekGroups.has(key)) weekGroups.set(key, [])
    weekGroups.get(key)!.push(row)
  })
  const sortedWeeks = [...weekGroups.keys()].sort((a, b) => (a < b ? 1 : -1))

  return (
    <div className="p-6 sm:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tous les menus générés ({menus.length})</h1>

      {sortedWeeks.length === 0 ? (
        <p className="text-gray-500">Aucun menu généré pour le moment.</p>
      ) : (
        <div className="flex flex-col gap-10">
          {sortedWeeks.map((weekKey) => (
            <div key={weekKey}>
              <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                {formatWeekLabel(weekKey)}
              </h2>

              <div className="flex flex-col gap-4">
                {weekGroups.get(weekKey)!.map((row) => (
                  <div key={row.id} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-900">{emailMap[row.user_id] ?? row.user_id}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(row.created_at).toLocaleDateString('fr-FR')} · {row.origin === 'admin' ? 'Envoyé par toi' : 'Généré par la cliente'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDelete(row.id)}
                      disabled={deletingId === row.id}
                      className="text-xs text-red-600 underline mb-2 block disabled:opacity-50"
                    >
                      {deletingId === row.id ? 'Suppression...' : '🗑️ Supprimer ce menu'}
                    </button>

                    {row.pdf_url && (
                      
                      <a  href={row.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mb-2 text-xs text-gray-700 underline"
                      >
                        📄 Revoir le PDF déjà généré
                      </a>
                    )}

                    {[
                      { key: 'plats', label: 'Plats' },
                      { key: 'desserts', label: 'Desserts' },
                    ].map(({ key, label }) => {
                      const items = (row.menu as any)[key] as { recipe_id: string; recipe_title: string }[] | undefined
                      if (!items || items.length === 0) return null
                      return (
                        <div key={key} className="mb-2">
                          <p className="text-xs text-gray-500 mb-1">{label}</p>
                          <div className="flex flex-wrap gap-1">
                            {items.map((item, i) => (
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
                      )
                    })}

                    <div className="mt-2">
                      <MenuPdfDownloadButton menu={row.menu} origin={row.origin} periodStart={weekKey} menuId={row.id} />
                    </div>
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