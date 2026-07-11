'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AdminEditButton from '@/components/AdminEditButton'
import CtaBanner from '@/components/CtaBanner'

type ContestContent = {
  why_participated: string
  experience: string
  learnings: string
  encounters: string
  today_benefit: string
}

type Photo = { id: string; image_url: string; caption: string | null }

export default function GrandConcours() {
  const [visible, setVisible] = useState(true)
  const [checkingVisibility, setCheckingVisibility] = useState(true)
  const [content, setContent] = useState<ContestContent | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('show_concours')
      .eq('id', 1)
      .single()
      .then(({ data }) => {
        setVisible(data?.show_concours ?? true)
        setCheckingVisibility(false)
      })

    supabase
      .from('contest_content')
      .select('*')
      .eq('id', 1)
      .single()
      .then(({ data }) => data && setContent(data as any))

    supabase
      .from('contest_photos')
      .select('*')
      .order('position')
      .then(({ data }) => setPhotos(data ?? []))
  }, [])

  if (checkingVisibility) return <div className="p-8 text-center text-gray-500">Chargement...</div>

  if (!visible) {
    return (
      <div className="p-8 text-center text-gray-500 max-w-md mx-auto">
        Cette page n'est pas disponible pour le moment.
        <AdminEditButton href="/admin/site-settings" />
      </div>
    )
  }

  if (!content) return <div className="p-8 text-center text-gray-500">Chargement...</div>

  return (
    <div className="px-6 sm:px-8 py-12 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-10 text-center">
        Mon expérience au Grand Concours Thermomix
      </h1>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Pourquoi j'ai participé</h2>
        <p className="text-gray-600">{content.why_participated}</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Mon expérience</h2>
        <p className="text-gray-600">{content.experience}</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Ce que j'y ai appris</h2>
        <p className="text-gray-600">{content.learnings}</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Les rencontres</h2>
        <p className="text-gray-600">{content.encounters}</p>
      </section>

      {photos.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quelques souvenirs</h2>
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 -mx-6 px-6 pb-2 scrollbar-hide">
            {photos.map((p) => (
              <div key={p.id} className="snap-center shrink-0 w-[85%] sm:w-[60%]">
                <img
                  src={p.image_url}
                  alt={p.caption ?? 'Photo du concours'}
                  className="w-full h-72 object-cover rounded-xl"
                />
                {p.caption && <p className="text-sm text-gray-500 mt-2 text-center">{p.caption}</p>}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">← Fais glisser pour voir plus →</p>
        </section>
      )}

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          Ce que cela apporte aujourd'hui à mes clientes
        </h2>
        <p className="text-gray-600">{content.today_benefit}</p>
      </section>

      <CtaBanner
        text="Envie de profiter de mon expertise pour ton Thermomix ?"
        buttonLabel="Pourquoi commander avec moi ?"
        href="/pourquoi-commander"
      />

      <AdminEditButton href="/admin/contest" />
    </div>
  )
}
