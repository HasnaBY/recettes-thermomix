'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import CtaBanner from '@/components/CtaBanner'
import AdminEditButton from '@/components/AdminEditButton'

type Testimonial = { id: string; client_name: string | null; content: string; rating: number | null }
type Item = { id: string; category: string; image_url: string; caption: string | null }

const CATEGORIES: { key: string; label: string; emoji: string }[] = [
  { key: 'atelier', label: 'Photos d\'ateliers', emoji: '👩‍🍳' },
  { key: 'realisation', label: 'Réalisations de clientes', emoji: '🍽️' },
  { key: 'capture', label: 'Messages reçus', emoji: '💬' },
  { key: 'avis', label: 'Avis', emoji: '⭐' },
]

export default function Confiance() {
  const [user, setUser] = useState<User | null>(null)
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)

  const [clientName, setClientName] = useState('')
  const [content, setContent] = useState('')
  const [rating, setRating] = useState('5')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  const loadTestimonials = async () => {
    const { data } = await supabase
      .from('testimonials')
      .select('*')
      .order('created_at', { ascending: false })
    setTestimonials(data ?? [])
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    loadTestimonials()

    supabase
      .from('social_proof')
      .select('*')
      .order('position')
      .then(({ data }) => {
        setItems(data ?? [])
        setLoading(false)
      })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setError('')

    const { error } = await supabase.from('testimonials').insert({
      user_id: user.id,
      client_name: clientName || null,
      content,
      rating: parseInt(rating),
      approved: false,
    })

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
      setContent('')
      setClientName('')
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement...</div>

  return (
    <div className="px-6 sm:px-8 py-12 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
        🥰 Elles m'ont fait confiance
      </h1>
      <p className="text-gray-600 text-center mb-10">
        Quelques mots et moments partagés avec mes clientes.
      </p>

      {/* Formulaire témoignage (clientes connectées uniquement) */}
      {user && (
        <div className="border border-gray-200 rounded-xl p-5 mb-10 max-w-xl mx-auto">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Laisser un témoignage</h2>
          {sent ? (
            <p className="text-gray-600">
              Merci pour ton témoignage ! Il sera visible après validation.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                placeholder="Ton nom (optionnel)"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
              <textarea
                placeholder="Ton témoignage"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={3}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
              <select
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} étoiles
                  </option>
                ))}
              </select>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <button
                type="submit"
                className="py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-black transition-colors"
              >
                Envoyer mon témoignage
              </button>
            </form>
          )}
        </div>
      )}

      {/* Témoignages écrits */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Ce qu'elles disent</h2>
        {testimonials.length === 0 ? (
          <p className="text-gray-500">Pas encore de témoignage à afficher.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
      </section>

      {/* Galeries photo par catégorie */}
      {CATEGORIES.map((cat) => {
        const catItems = items.filter((i) => i.category === cat.key)
        if (catItems.length === 0) return null

        return (
          <section key={cat.key} className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {cat.emoji} {cat.label}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {catItems.map((item) => (
                <div key={item.id}>
                  <img
                    src={item.image_url}
                    alt={item.caption ?? cat.label}
                    className="w-full h-36 object-cover rounded-lg"
                  />
                  {item.caption && <p className="text-xs text-gray-500 mt-1">{item.caption}</p>}
                </div>
              ))}
            </div>
          </section>
        )
      })}

      <CtaBanner
        text="Prête à rejoindre mes clientes conquises ?"
        buttonLabel="Me contacter"
        href="/contact"
      />

      <AdminEditButton href="/admin/testimonials" />
    </div>
  )
}
