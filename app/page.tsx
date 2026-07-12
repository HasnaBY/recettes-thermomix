'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import AdminEditButton from '@/components/AdminEditButton'

type Advantage = { icon: string; title: string; text: string }
type Testimonial = { id: string; client_name: string | null; content: string; rating: number | null }

export default function Home() {
  const [content, setContent] = useState<{
    hero_title: string
    hero_subtitle: string
    hero_image_url: string | null
    advantages: Advantage[]
    story_teaser: string
  } | null>(null)
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('homepage_content')
      .select('*')
      .eq('id', 1)
      .single()
      .then(({ data }) => data && setContent(data as any))

    supabase
      .from('testimonials')
      .select('*')
      .eq('approved', true)
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data }) => setTestimonials(data ?? []))
  }, [])

  if (!content) return <div className="p-8 text-center text-[#3A3532]/60">Chargement...</div>

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden px-6 sm:px-8 py-16 max-w-4xl mx-auto text-center">
        <div className="watercolor-blob blob-pink w-72 h-72 -top-10 -left-16" />
        <div className="watercolor-blob blob-blue w-64 h-64 top-20 -right-10" />

        <div className="relative">
          {content.hero_image_url && (
            <div className="inline-block p-1.5 rounded-full border-2 border-[#C9A44C] mb-6">
              <img
                src={content.hero_image_url}
                alt="Hasna, conseillère Thermomix"
                className="w-40 h-40 rounded-full object-cover"
              />
            </div>
          )}
          <h1 className="font-display text-3xl sm:text-4xl text-[#3A3532] mb-4 leading-snug">
            {content.hero_title}
          </h1>
          <p className="text-[#3A3532]/70 text-lg mb-8 max-w-2xl mx-auto">{content.hero_subtitle}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/qui-suis-je"
              className="px-6 py-3 bg-[#3A3532] text-[#FDFBF6] rounded-full font-medium hover:bg-[#2A2622] transition-colors no-underline border border-[#C9A44C]"
            >
              Découvrir mon accompagnement
            </Link>
            <Link
              href="/contact"
              className="px-6 py-3 border border-[#3A3532]/30 text-[#3A3532] rounded-full font-medium hover:bg-[#3A3532]/5 transition-colors no-underline"
            >
              Réserver un atelier
            </Link>
          </div>
        </div>
      </section>

      {/* Pourquoi me choisir */}
      <section className="relative overflow-hidden px-6 sm:px-8 py-14 bg-[#F6DEE1]/30">
        <div className="watercolor-blob blob-green w-80 h-80 -bottom-20 left-1/3" />
        <div className="relative max-w-5xl mx-auto">
          <h2 className="font-display text-2xl text-[#3A3532] mb-10 text-center">Pourquoi me choisir ?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {content.advantages?.map((a, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl mb-3">{a.icon}</div>
                <h3 className="font-display text-lg text-[#3A3532] mb-1">{a.title}</h3>
                <p className="text-sm text-[#3A3532]/70">{a.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Témoignages */}
      <section className="relative overflow-hidden px-6 sm:px-8 py-14 max-w-4xl mx-auto">
        <h2 className="font-display text-2xl text-[#3A3532] mb-10 text-center">
          Ce que mes clientes apprécient
        </h2>
        {testimonials.length === 0 ? (
          <p className="text-[#3A3532]/60 text-center">
            Disponibilité, réactivité, accompagnement et bonne humeur — c'est ce que je m'efforce d'offrir à chaque cliente.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.id} className="border border-[#F0EAE0] bg-white rounded-2xl p-5">
                {t.rating && (
                  <div className="text-[#C9A44C] mb-2 text-sm">
                    {'★'.repeat(t.rating)}
                    {'☆'.repeat(5 - t.rating)}
                  </div>
                )}
                <p className="text-[#3A3532]/80 text-sm mb-2">{t.content}</p>
                {t.client_name && <p className="text-xs text-[#3A3532]/50">— {t.client_name}</p>}
              </div>
            ))}
          </div>
        )}
        <div className="text-center mt-6">
          <Link href="/confiance" className="text-sm text-[#3A3532]/70 underline">
            Voir tous les avis
          </Link>
        </div>
      </section>

      {/* Découvrez mon histoire */}
      <section className="relative overflow-hidden px-6 sm:px-8 py-16 bg-[#DCEAF0]/30">
        <div className="watercolor-blob blob-pink w-72 h-72 -top-10 right-0" />
        <div className="relative max-w-2xl mx-auto text-center">
          <h2 className="font-display text-2xl text-[#3A3532] mb-4">Découvrez mon histoire</h2>
          <p className="text-[#3A3532]/70 mb-6">{content.story_teaser}</p>
          <Link
            href="/qui-suis-je"
            className="inline-block px-6 py-3 bg-[#3A3532] text-[#FDFBF6] rounded-full font-medium hover:bg-[#2A2622] transition-colors no-underline border border-[#C9A44C]"
          >
            Qui suis-je ?
          </Link>
        </div>
      </section>

      <AdminEditButton href="/admin/homepage" />
    </div>
  )
}
