'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import AdminEditButton from '@/components/AdminEditButton'
import BrandPhoto from '@/components/BrandPhoto'

type ValueItem = { icon: string; label: string }

type AboutContent = {
  subtitle: string | null
  before_thermomix: string
  discovery: string
  what_changed: string[]
  why_advisor: string
  values: ValueItem[]
  accompaniment: string
  club_sharing_text: string
}

export default function QuiSuisJe() {
  const [content, setContent] = useState<AboutContent | null>(null)
  const [ramenId, setRamenId] = useState<string | null>(null)
  const [bouzaId, setBouzaId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('about_page_content')
      .select('*')
      .eq('id', 1)
      .single()
      .then(({ data }) => data && setContent(data as any))

    supabase
      .from('recipes')
      .select('id')
      .eq('title', 'Ramen curry rouge au poulet')
      .maybeSingle()
      .then(({ data }) => data && setRamenId(data.id))

    supabase
      .from('recipes')
      .select('id')
      .eq('title', 'Bouza noisettes')
      .maybeSingle()
      .then(({ data }) => data && setBouzaId(data.id))
  }, [])

  if (!content) return <div className="p-8 text-center text-[#3A3532]/60">Chargement...</div>

  return (
    <div className="px-6 sm:px-8 py-12 max-w-2xl mx-auto">
      <h1 className="font-display text-3xl text-[#3A3532] mb-3 text-center">Qui suis-je ?</h1>
      {content.subtitle && (
        <p className="text-[#3A3532]/70 text-center mb-8 max-w-lg mx-auto">{content.subtitle}</p>
      )}

      <div className="flex justify-center mb-10">
        <BrandPhoto
          photoKey="atelier_photo"
          alt="Hasna en atelier"
          className="w-full max-w-md h-64 object-cover rounded-2xl"
        />
      </div>

      <section className="mb-10">
        <h2 className="font-display text-xl text-[#3A3532] mb-3">Mon quotidien avant Thermomix</h2>
        <p className="text-[#3A3532]/70">{content.before_thermomix}</p>
      </section>

      <section className="mb-10">
        <h2 className="font-display text-xl text-[#3A3532] mb-3">La découverte du Thermomix</h2>
        <p className="text-[#3A3532]/70">{content.discovery}</p>
      </section>

      <section className="mb-10">
        <h2 className="font-display text-xl text-[#3A3532] mb-3">Ce que Thermomix a changé</h2>
        <ul className="grid gap-2 mb-4">
          {content.what_changed?.map((item, i) => (
            <li key={i} className="text-[#3A3532]/70 flex gap-2">
              <span className="text-[#C9A44C]">✓</span> {item}
            </li>
          ))}
        </ul>
        {content.club_sharing_text && (
          <p className="text-[#3A3532]/70 mb-4">
            Au sein du Club, je partage à mes clientes une sélection de recettes testées et validées par mes soins — comme{' '}
            {ramenId ? (
              <Link href={`/recipes/${ramenId}`} className="text-[#3A3532] underline">
                ce ramen au curry rouge et poulet
              </Link>
            ) : (
              'ce ramen au curry rouge et poulet'
            )}
            {' '}— en plus de mes propres créations personnelles, comme{' '}
            {bouzaId ? (
              <Link href={`/recipes/${bouzaId}`} className="text-[#3A3532] underline">
                la bouza noisettes
              </Link>
            ) : (
              'la bouza noisettes'
            )}
            .
          </p>
        )}
        <BrandPhoto
          photoKey="bouza_photo"
          alt="Bouza noisettes"
          className="w-full h-56 object-cover rounded-2xl"
        />
      </section>

      <section className="mb-10">
        <h2 className="font-display text-xl text-[#3A3532] mb-3">Pourquoi je suis devenue conseillère</h2>
        <p className="text-[#3A3532]/70">{content.why_advisor}</p>
      </section>

      <section className="mb-10">
        <h2 className="font-display text-xl text-[#3A3532] mb-4">Mes valeurs</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
          {content.values?.map((v, i) => (
            <div key={i}>
              <div className="text-3xl mb-1">{v.icon}</div>
              <p className="text-sm text-[#3A3532]/70">{v.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="font-display text-xl text-[#3A3532] mb-3">Mon accompagnement</h2>
        <p className="text-[#3A3532]/70">{content.accompaniment}</p>
      </section>

      <div className="text-center">
        <Link
          href="/pourquoi-commander"
          className="inline-block px-6 py-3 bg-[#3A3532] text-[#FDFBF6] rounded-full font-medium hover:bg-[#2A2622] transition-colors no-underline border border-[#C9A44C]"
        >
          Découvrir les avantages de commander avec moi
        </Link>
      </div>

      <AdminEditButton href="/admin/about" />
    </div>
  )
}
