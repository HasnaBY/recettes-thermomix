'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type Lead = {
  id: string
  first_name: string
  email: string
  phone: string
  recipe_id: string | null
  contacted: boolean
  notes: string | null
  created_at: string
}

export default function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [recipeTitles, setRecipeTitles] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'not_contacted'>('all')
  const supabase = createClient()

  const load = async () => {
    const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false })
    setLeads(data ?? [])

    const recipeIds = [...new Set((data ?? []).map((l) => l.recipe_id).filter(Boolean))] as string[]
    if (recipeIds.length > 0) {
      const { data: recipes } = await supabase.from('recipes').select('id, title').in('id', recipeIds)
      const map: Record<string, string> = {}
      recipes?.forEach((r) => (map[r.id] = r.title))
      setRecipeTitles(map)
    }

    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const toggleContacted = async (id: string, current: boolean) => {
    await supabase.from('leads').update({ contacted: !current }).eq('id', id)
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, contacted: !current } : l)))
  }

  const filtered = filter === 'not_contacted' ? leads.filter((l) => !l.contacted) : leads

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement...</div>

  return (
    <div className="p-6 sm:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Prospects ({leads.length})</h1>
      <p className="text-gray-500 text-sm mb-6">
        Toutes les personnes ayant demandé la recette gratuite via{' '}
        <Link href="/recette-gratuite" target="_blank" className="underline">
          /recette-gratuite
        </Link>
        .
      </p>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-full text-sm ${filter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}
        >
          Tous ({leads.length})
        </button>
        <button
          onClick={() => setFilter('not_contacted')}
          className={`px-3 py-1.5 rounded-full text-sm ${filter === 'not_contacted' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}
        >
          À relancer ({leads.filter((l) => !l.contacted).length})
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500">Aucun prospect pour le moment.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((lead) => (
            <div key={lead.id} className="border border-gray-200 rounded-xl p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">{lead.first_name}</p>
                  <p className="text-xs text-gray-500">{lead.email}</p>
                  <p className="text-xs text-gray-500">{lead.phone}</p>
                </div>
                <p className="text-xs text-gray-400">
                  {new Date(lead.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              {lead.recipe_id && recipeTitles[lead.recipe_id] && (
                <p className="text-xs text-gray-500 mb-2">Recette reçue : {recipeTitles[lead.recipe_id]}</p>
              )}

              <button
                onClick={() => toggleContacted(lead.id, lead.contacted)}
                className={`text-xs px-3 py-1 rounded-full ${
                  lead.contacted ? 'bg-gray-100 text-gray-600' : 'bg-[#C9A44C]/20 text-[#3A3532] font-medium'
                }`}
              >
                {lead.contacted ? '✓ Relancée' : 'Marquer comme relancée'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}