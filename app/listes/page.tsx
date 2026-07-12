'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type ListItem = { id: string; title: string; slug: string; description: string | null; cover_image_url: string | null }

export default function Listes() {
  const [lists, setLists] = useState<ListItem[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('recipe_lists')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setLists(data ?? [])
        setLoading(false)
      })
  }, [])

  if (loading) return <div className="p-8 text-center text-[#3A3532]/60">Chargement...</div>

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto">
      <h1 className="font-display text-3xl text-[#3A3532] mb-8">Listes de recettes</h1>

      {lists.length === 0 ? (
        <p className="text-[#3A3532]/60">Pas encore de liste disponible.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {lists.map((list) => (
            <Link
              key={list.id}
              href={`/listes/${list.slug}`}
              className="block rounded-2xl border border-[#F0EAE0] bg-white overflow-hidden hover:shadow-md transition-shadow no-underline text-inherit"
            >
              {list.cover_image_url ? (
                <img src={list.cover_image_url} alt={list.title} className="w-full h-36 object-cover" />
              ) : (
                <div className="w-full h-36 bg-[#DCEAF0]/40 flex items-center justify-center text-3xl">
                  📋
                </div>
              )}
              <div className="p-4">
                <h2 className="font-display text-lg text-[#3A3532] mb-1">{list.title}</h2>
                {list.description && (
                  <p className="text-[#3A3532]/70 text-sm line-clamp-2">{list.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
