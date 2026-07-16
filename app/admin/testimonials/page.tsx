'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Testimonial = {
  id: string
  client_name: string | null
  content: string
  rating: number | null
  approved: boolean
  created_at: string
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function AdminTestimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [clientName, setClientName] = useState('')
  const [content, setContent] = useState('')
  const [rating, setRating] = useState('5')
  const supabase = createClient()

  const load = async () => {
    const { data } = await supabase
      .from('testimonials')
      .select('*')
      .order('created_at', { ascending: false })
    setTestimonials(data ?? [])
  }

  useEffect(() => {
    load()
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    await supabase.from('testimonials').insert({
      client_name: clientName || null,
      content,
      rating: parseInt(rating),
      approved: true,
    })
    setClientName('')
    setContent('')
    setRating('5')
    load()
  }

  const handleApprove = async (id: string) => {
    await supabase.from('testimonials').update({ approved: true }).eq('id', id)
    load()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('testimonials').delete().eq('id', id)
    load()
  }

  const pending = testimonials.filter((t) => !t.approved)
  const approved = testimonials.filter((t) => t.approved)

  return (
    <div className="p-6 sm:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Gérer les témoignages</h1>

      <h2 className="text-lg font-semibold text-gray-900 mb-3">
        En attente de validation ({pending.length})
      </h2>
      {pending.length === 0 ? (
        <p className="text-gray-500 mb-8">Aucun témoignage en attente.</p>
      ) : (
        <div className="grid gap-3 mb-8">
          {pending.map((t) => (
            <div key={t.id} className="border border-amber-300 bg-amber-50 rounded-xl p-4">
              <p className="text-gray-700">{t.content}</p>
              <p className="text-sm text-gray-500 mt-1">
                — {t.client_name ?? 'Anonyme'} ({t.rating}★)
              </p>
              <p className="text-xs text-gray-400 mt-1">Reçu le {formatDate(t.created_at)}</p>
              <div className="flex gap-3 mt-3">
                <button
                  onClick={() => handleApprove(t.id)}
                  className="text-sm px-3 py-1.5 bg-gray-900 text-white rounded-lg"
                >
                  Publier
                </button>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="text-sm px-3 py-1.5 text-red-600 border border-red-600 rounded-lg"
                >
                  Refuser
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="text-lg font-semibold text-gray-900 mb-3">Ajouter un témoignage manuellement</h2>
      <form onSubmit={handleAdd} className="flex flex-col gap-3 mb-8 border border-gray-200 rounded-xl p-4">
        <input
          placeholder="Nom de la cliente (optionnel)"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        />
        <textarea
          placeholder="Témoignage"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={3}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        />
        <select
          value={rating}
          onChange={(e) => setRating(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} étoiles
            </option>
          ))}
        </select>
        <button type="submit" className="py-2 bg-gray-900 text-white rounded-lg font-medium">
          Ajouter et publier
        </button>
      </form>

      <h2 className="text-lg font-semibold text-gray-900 mb-3">Publiés ({approved.length})</h2>
      <div className="grid gap-3">
        {approved.map((t) => (
          <div key={t.id} className="border border-gray-200 rounded-xl p-4 flex justify-between items-start gap-4">
            <div>
              <p className="text-gray-700">{t.content}</p>
              <p className="text-sm text-gray-500 mt-1">
                — {t.client_name ?? 'Anonyme'} ({t.rating}★)
              </p>
              <p className="text-xs text-gray-400 mt-1">Reçu le {formatDate(t.created_at)}</p>
            </div>
            <button onClick={() => handleDelete(t.id)} className="text-red-600 text-sm shrink-0">
              Supprimer
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
