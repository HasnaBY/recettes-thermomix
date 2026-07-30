'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import AdminEditButton from '@/components/AdminEditButton'
import BrandPhoto from '@/components/BrandPhoto'

type Advantage = { icon: string; title: string; text: string }
type Testimonial = { id: string; client_name: string | null; content: string; rating: number | null }
type Recipe = {
  id: string
  title: string
  description: string
  image_url: string | null
}

export default function Home() {
  const [content, setContent] = useState<{
    hero_title: string
    hero_subtitle: string
    hero_paragraph_3: string | null
    advantages: Advantage[]
    story_teaser: string
  } | null>(null)
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [featuredRecipes, setFeaturedRecipes] = useState<Recipe[]>([])
  const [checkingAdmin, setCheckingAdmin] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: userData } = await supabase.auth.getUser()

      if (userData.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', userData.user.id)
          .single()

        if (profile?.is_admin) {
          window.location.href = '/admin'
          return
        }
      }

      setCheckingAdmin(false)
    }
    checkAdmin()
  }, [])

  useEffect(() => {
    if (checkingAdmin) return

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

    supabase
      .from('recipes')
      .select('id, title, description, image_url')
      .eq('is_featured', true)
      .order('featured_position')
      .then(({ data }) => setFeaturedRecipes(data ?? []))
  }, [checkingAdmin])

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const amount = scrollRef.current.clientWidth * 0.8
    scrollRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  if (checkingAdmin) return <div className="p-8 text-center text-[#3A3532]/60">Chargement...</div>
  if (!content) return <div className="p-8 text-center text-[#3A3532]/60">Chargement...</div>

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden px-6 sm:px-8 py-16 max-w-4xl mx-auto text-center">
        <div className="watercolor-blob blob-pink w-72 h-72 -top-10 -left-16" />
        <div className="watercolor-blob blob-blue w-64 h-64 top-20 -right-10" />

        <div className="relative">
          <h1 className="font-display text-3xl sm:text-4xl text-[#3A3532] mb-4 leading-snug">
            {content.hero_title}
          </h1>
          <p className="text-[#3A3532]/70 text-lg mb-6 max-w-2xl mx-auto">{content.hero_subtitle}</p>

          <div className="inline-block p-1.5 rounded-full border-2 border-[#C9A44C] mb-6">
            <BrandPhoto
              photoKey="portrait_thermomix"
              alt="Hasna, conseillère Thermomix"
              className="w-40 h-40 rounded-full object-cover"
            />
          </div>

          {content.hero_paragraph_3 && (
            <p className="text-[#3A3532]/70 text-lg mb-8 max-w-2xl mx-auto">{content.hero_paragraph_3}</p>
          )}
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

      {/* Logo rond */}
      <div className="flex justify-center py-8">
        <BrandPhoto
          photoKey="round_logo"
          alt="Thermomix With Love, Hasna"
          className="w-28 h-28 rounded-full object-cover border-2 border-[#C9A44C]"
        />
      </div>

      {/* Aperçu recettes - carrousel */}
      {featuredRecipes.length > 0 && (
        <section className="relative overflow-hidden py-14 max-w-5xl mx-auto">
          <h2 className="font-display text-2xl text-[#3A3532] mb-8 text-center px-6">
            Un aperçu de mes recettes
          </h2>

          <div className="relative px-6">
            <div ref={scrollRef} className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-2 scrollbar-hide">
              {featuredRecipes.map((recipe) => (
                <Link
                  key={recipe.id}
                  href={`/recipes/${recipe.id}`}
                  className="snap-center shrink-0 w-[75%] sm:w-[38%] lg:w-[30%] block rounded-2xl border border-[#F0EAE0] bg-white overflow-hidden hover:shadow-md transition-shadow no-underline text-inherit"
                >
                  {recipe.image_url ? (
                    <img src={recipe.image_url} alt={recipe.title} className="w-full h-44 object-cover" />
                  ) : (
                    <div className="w-full h-44 bg-[#F6DEE1]/30" />
                  )}
                  <div className="p-4">
                    <h3 className="font-display text-lg text-[#3A3532] mb-1">{recipe.title}</h3>
                    <p className="text-[#3A3532]/70 text-sm line-clamp-2">{recipe.description}</p>
                  </div>
                </Link>
              ))}
            </div>

            <button
              onClick={() => scroll('left')}
              aria-label="Voir les recettes précédentes"
              className="hidden sm:flex absolute top-1/2 -translate-y-1/2 -left-2 w-10 h-10 items-center justify-center rounded-full bg-white border border-[#F0EAE0] shadow-md text-[#3A3532] hover:bg-[#F6DEE1]/30"
            >
              ←
            </button>
            <button
              onClick={() => scroll('right')}
              aria-label="Voir les recettes suivantes"
              className="hidden sm:flex absolute top-1/2 -translate-y-1/2 -right-2 w-10 h-10 items-center justify-center rounded-full bg-white border border-[#F0EAE0] shadow-md text-[#3A3532] hover:bg-[#F6DEE1]/30"
            >
              →
            </button>
          </div>

          <p className="text-xs text-[#3A3532]/40 text-center mt-2 sm:hidden">← Fais glisser pour voir plus →</p>

          <div className="text-center mt-6 px-6">
            <Link
              href="/recettes"
              className="inline-block px-6 py-3 bg-[#3A3532] text-[#FDFBF6] rounded-full font-medium hover:bg-[#2A2622] transition-colors no-underline border border-[#C9A44C]"
            >
              Voir toutes les recettes
            </Link>
          </div>
        </section>
      )}

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