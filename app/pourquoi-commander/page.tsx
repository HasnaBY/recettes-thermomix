'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import AdminEditButton from '@/components/AdminEditButton'

type WhyOrderContent = {
  before_purchase: string[]
  delivery_day: string[]
  after_delivery: string[]
  conclusion: string
}

export default function PourquoiCommander() {
  const [content, setContent] = useState<WhyOrderContent | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('why_order_content')
      .select('*')
      .eq('id', 1)
      .single()
      .then(({ data }) => data && setContent(data as any))
  }, [])

  if (!content) return <div className="p-8 text-center text-gray-500">Chargement...</div>

  const Block = ({ title, items }: { title: string; items: string[] }) => (
    <section className="mb-10">
      <h2 className="text-xl font-semibold text-gray-900 mb-3">{title}</h2>
      <ul className="grid gap-2">
        {items?.map((item, i) => (
          <li key={i} className="text-gray-600 flex gap-2">
            <span>✓</span> {item}
          </li>
        ))}
      </ul>
    </section>
  )

  return (
    <div className="px-6 sm:px-8 py-12 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-10 text-center">
        Pourquoi commander avec moi ?
      </h1>

      <Block title="Avant votre achat" items={content.before_purchase} />
      <Block title="Le jour de la livraison" items={content.delivery_day} />
      <Block title="Après la livraison" items={content.after_delivery} />

      <p className="text-gray-700 text-center italic mb-10">{content.conclusion}</p>

      <div className="text-center">
        <Link
          href="/club-fondatrices"
          className="inline-block px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-black transition-colors no-underline"
        >
          Rejoindre le Club Fondatrices
        </Link>
      </div>

      <AdminEditButton href="/admin/why-order"/>
    </div>
  )
}
