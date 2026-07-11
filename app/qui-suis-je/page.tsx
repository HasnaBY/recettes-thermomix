'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import AdminEditButton from '@/components/AdminEditButton'

type ValueItem = { icon: string; label: string }

type AboutContent = {
  before_thermomix: string
  discovery: string
  what_changed: string[]
  why_advisor: string
  values: ValueItem[]
  accompaniment: string
}

export default function QuiSuisJe() {
  const [content, setContent] = useState<AboutContent | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('about_page_content')
      .select('*')
      .eq('id', 1)
      .single()
      .then(({ data }) => data && setContent(data as any))
  }, [])

  if (!content) return <div className="p-8 text-center text-gray-500">Chargement...</div>

  return (
    <div className="px-6 sm:px-8 py-12 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-10 text-center">Qui suis-je ?</h1>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Mon quotidien avant Thermomix</h2>
        <p className="text-gray-600">{content.before_thermomix}</p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">La découverte du Thermomix</h2>
        <p className="text-gray-600">{content.discovery}</p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Ce que Thermomix a changé</h2>
        <ul className="grid gap-2">
          {content.what_changed?.map((item, i) => (
            <li key={i} className="text-gray-600 flex gap-2">
              <span>✓</span> {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Pourquoi je suis devenue conseillère</h2>
        <p className="text-gray-600">{content.why_advisor}</p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Mes valeurs</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
          {content.values?.map((v, i) => (
            <div key={i}>
              <div className="text-3xl mb-1">{v.icon}</div>
              <p className="text-sm text-gray-600">{v.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Mon accompagnement</h2>
        <p className="text-gray-600">{content.accompaniment}</p>
      </section>

      <div className="text-center">
        <Link
          href="/pourquoi-commander"
          className="inline-block px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-black transition-colors no-underline"
        >
          Découvrir les avantages de commander avec moi
        </Link>
      </div>

      <AdminEditButton href="/admin/about" />
    </div>
  )
}
