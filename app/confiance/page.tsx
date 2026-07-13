'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import CtaBanner from '@/components/CtaBanner'
import AdminEditButton from '@/components/AdminEditButton'
import Lightbox from '@/components/Lightbox'
import imageCompression from 'browser-image-compression'

type Testimonial = {
  id: string
  client_name: string | null
  content: string
  rating: number | null
  image_urls: string[] | null
}
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
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)

  const supabase = createClient()

  const loadTestimonials = async () => {
    const { data } = await supabase
      .from('testimonials')
      .select('*')
      .eq('approved', true)
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

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? [])
    setFiles(selected.slice(0, 3))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setUploading(true)
    setError('')

    try {
      const uploadedUrls: string[] = []

      for (const file of files) {
        const compressed = await imageCompression(file, {
          maxWidthOrHeight: 1200,
          maxSizeMB: 0.3,
          fileType: 'image/webp',
        })
        const fileName = `${user.id}-${Date.now()}-${Math.random().toString(36).slice(2)}.webp`
        const { error: uploadError } = await supabase.storage
          .from('testimonial-images')
          .upload(fileName, compressed)
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('testimonial-images').getPublicUrl(fileName)
        uploadedUrls.push(urlData.publicUrl)
      }

      const { error: insertError } = await supabase.from('testimonials').insert({
        user_id: user.id,
        client_name: clientName || null,
        content,
        rating: parseInt(rating),
        approved: false,
        image_urls: uploadedUrls.length > 0 ? uploadedUrls : null,
      })

      if (insertError) throw insertError

      setSent(true)
      setContent('')
      setClientName('')
      setFiles([])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-[#3A3532]/60">Chargement...</div>

  return (
    <div className="px-6 sm:px-8 py-12 max-w-4xl mx-auto">
      <h1 className="font-display text-3xl text-[#3A3532] mb-2 text-center">
        🥰 Elles m'ont fait confiance
      </h1>
      <p className="text-[#3A3532]/70 text-center mb-10">
        Quelques mots et moments partagés avec mes clientes.
      </p>

      {user && (
        <div className="border border-[#F0EAE0] bg-white rounded-2xl p-5 mb-10 max-w-xl mx-auto">
          <h2 className="font-display text-lg text-[#3A3532] mb-3">Laisser un témoignage</h2>
          {sent ? (
            <p className="text-[#3A3532]/70">
              Merci pour ton témoignage ! Il sera visible après validation.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                placeholder="Ton nom (optionnel)"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="px-4 py-2 border border-[#F0EAE0] rounded-xl"
              />
              <textarea
                placeholder="Ton témoignage"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={3}
                className="px-4 py-2 border border-[#F0EAE0] rounded-xl"
              />
              <select
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                className="px-4 py-2 border border-[#F0EAE0] rounded-xl"
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} étoiles
                  </option>
                ))}
              </select>
              <div>
                <label className="block mb-2 text-sm text-[#3A3532]/60">
                  Jusqu'à 3 photos (optionnel)
                </label>
                <input type="file" accept="image/*" multiple onChange={handleFilesChange} />
                {files.length > 0 && (
                  <p className="text-xs text-[#3A3532]/50 mt-1">{files.length} photo(s) sélectionnée(s)</p>
                )}
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={uploading}
                className="py-2 bg-[#3A3532] text-[#FDFBF6] rounded-full font-medium hover:bg-[#2A2622] transition-colors border border-[#C9A44C] disabled:opacity-50"
              >
                {uploading ? 'Envoi...' : 'Envoyer mon témoignage'}
              </button>
            </form>
          )}
        </div>
      )}

      <section className="mb-12">
        <h2 className="font-display text-xl text-[#3A3532] mb-4">Ce qu'elles disent</h2>
        {testimonials.length === 0 ? (
          <p className="text-[#3A3532]/60">Pas encore de témoignage à afficher.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.id} className="border border-[#F0EAE0] bg-white rounded-2xl p-4">
                {t.rating && (
                  <div className="text-[#C9A44C] mb-2 text-sm">
                    {'★'.repeat(t.rating)}
                    {'☆'.repeat(5 - t.rating)}
                  </div>
                )}
                <p className="text-[#3A3532]/80 text-sm mb-2">{t.content}</p>
                {t.image_urls && t.image_urls.length > 0 && (
                  <div className="grid grid-cols-3 gap-1 mb-2">
                    {t.image_urls.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt=""
                        onClick={() => setLightboxSrc(url)}
                        className="w-full h-16 object-cover rounded-lg cursor-pointer"
                      />
                    ))}
                  </div>
                )}
                {t.client_name && <p className="text-xs text-[#3A3532]/50">— {t.client_name}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      {CATEGORIES.map((cat) => {
        const catItems = items.filter((i) => i.category === cat.key)
        if (catItems.length === 0) return null

        return (
          <section key={cat.key} className="mb-10">
            <h2 className="font-display text-xl text-[#3A3532] mb-4">
              {cat.emoji} {cat.label}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {catItems.map((item) => (
                <div key={item.id}>
                  <img
                    src={item.image_url}
                    alt={item.caption ?? cat.label}
                    onClick={() => setLightboxSrc(item.image_url)}
                    className="w-full h-36 object-cover rounded-xl cursor-pointer"
                  />
                  {item.caption && <p className="text-xs text-[#3A3532]/50 mt-1">{item.caption}</p>}
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

      <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />

      <AdminEditButton href="/admin/testimonials" />
    </div>
  )
}
