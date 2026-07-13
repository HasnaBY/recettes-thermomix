'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import AdminEditButton from '@/components/AdminEditButton'
import BrandPhoto from '@/components/BrandPhoto'

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

  if (!content) return <div className="p-8 text-center text-[#3A3532]/60">Chargement...</div>

  const Block = ({ title, items }: { title: string; items: string[] }) => (
    <section className="mb-10">
      <h2 className="font-display text-xl text-[#3A3532] mb-3">{title}</h2>
      <ul className="grid gap-2">
        {items?.map((item, i) => (
          <li key={i} className="text-[#3A3532]/70 flex gap-2">
            <span className="text-[#C9A44C]">✓</span> {item}
          </li>
        ))}
      </ul>
    </section>
  )

  return (
    <div className="px-6 sm:px-8 py-12 max-w-2xl mx-auto">
      <h1 className="font-display text-3xl text-[#3A3532] mb-10 text-center">
        Pourquoi commander avec moi ?
      </h1>

      <div className="flex justify-center mb-10">
        <BrandPhoto
          photoKey="cuisine_action"
          alt="Thermomix en action"
          className="w-full h-56 object-cover rounded-2xl"
        />
      </div>

      <Block title="Avant votre achat" items={content.before_purchase} />
      <Block title="Le jour de la livraison" items={content.delivery_day} />
      <Block title="Après la livraison" items={content.after_delivery} />

      <p className="text-[#3A3532]/70 text-center italic mb-10">{content.conclusion}</p>

      <div className="text-center">
        <Link
          href="/club-fondatrices"
          className="inline-block px-6 py-3 bg-[#3A3532] text-[#FDFBF6] rounded-full font-medium hover:bg-[#2A2622] transition-colors no-underline border border-[#C9A44C]"
        >
          Rejoindre Le Cercle With Love
        </Link>
      </div>

      <AdminEditButton href="/admin/why-order" />
    </div>
  )
}
