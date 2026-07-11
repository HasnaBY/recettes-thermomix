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

  if (!content) return <div className="p-8 text-center text-gray-500">Chargement...</div>

  return (
    <div>
      {/* Hero */}
      <section className="px-6 sm:px-8 py-12 max-w-4xl mx-auto text-center">
        {content.hero_image_url && (
          <img
            src={content.hero_image_url}
            alt="Conseillère Thermomix"
            className="w-40 h-40 rounded-full object-cover mx-auto mb-6"
          />
        )}
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">{content.hero_title}</h1>
        <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">{content.hero_subtitle}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/qui-suis-je"
            className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-black transition-colors no-underline"
          >
            Découvrir mon accompagnement
          </Link>
          <Link
            href="/contact"
            className="px-6 py-3 border border-gray-900 text-gray-900 rounded-lg font-medium hover:bg-gray-50 transition-colors no-underline"
          >
            Réserver un atelier
          </Link>
        </div>
      </section>

      {/* Pourquoi me choisir */}
      <section className="px-6 sm:px-8 py-12 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Pourquoi me choisir ?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {content.advantages?.map((a, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl mb-3">{a.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{a.title}</h3>
                <p className="text-sm text-gray-600">{a.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Témoignages */}
      <section className="px-6 sm:px-8 py-12 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
          Ce que mes clientes apprécient
        </h2>
        {testimonials.length === 0 ? (
          <p className="text-gray-500 text-center">
            Disponibilité, réactivité, accompagnement et bonne humeur — c'est ce que je m'efforce d'offrir à chaque cliente.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.id} className="border border-gray-200 rounded-xl p-4">
                {t.rating && (
                  <div className="text-amber-500 mb-2 text-sm">
                    {'★'.repeat(t.rating)}
                    {'☆'.repeat(5 - t.rating)}
                  </div>
                )}
                <p className="text-gray-700 text-sm mb-2">{t.content}</p>
                {t.client_name && <p className="text-xs text-gray-500">— {t.client_name}</p>}
              </div>
            ))}
          </div>
        )}
        <div className="text-center mt-6">
          <Link href="/confiance" className="text-sm text-gray-600 underline">
             Voir tous les avis
          </Link>

        </div>
      </section>

      {/* Découvrez mon histoire */}
      <section className="px-6 sm:px-8 py-12 bg-gray-50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Découvrez mon histoire</h2>
          <p className="text-gray-600 mb-6">{content.story_teaser}</p>
          <Link
            href="/qui-suis-je"
            className="inline-block px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-black transition-colors no-underline"
          >
            Qui suis-je ?
          </Link>
        </div>
      </section>
     <AdminEditButton href="/admin/homepage" />
 
    </div>
  )
}
