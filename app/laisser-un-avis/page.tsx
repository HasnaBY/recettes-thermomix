'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AdminEditButton from '@/components/AdminEditButton'
import imageCompression from 'browser-image-compression'

export default function LaisserUnAvis() {
  const [visible, setVisible] = useState(true)
  const [checkingVisibility, setCheckingVisibility] = useState(true)
  const [clientName, setClientName] = useState('')
  const [content, setContent] = useState('')
  const [rating, setRating] = useState('5')
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('show_public_testimonials')
      .eq('id', 1)
      .single()
      .then(({ data }) => {
        setVisible(data?.show_public_testimonials ?? true)
        setCheckingVisibility(false)
      })
  }, [])

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? [])
    setFiles(selected.slice(0, 3))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)
    setError('')

    try {
      const uploadedUrls: string[] = []

      for (let i = 0; i < files.length; i++) {
        setUploadProgress(`Envoi de la photo ${i + 1}/${files.length}...`)

        const compressed = await imageCompression(files[i], {
          maxWidthOrHeight: 1200,
          maxSizeMB: 0.3,
          fileType: 'image/webp',
        })

        const fileName = `public-${Date.now()}-${i}.webp`
        const { error: uploadError } = await supabase.storage
          .from('testimonial-images')
          .upload(fileName, compressed)

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage.from('testimonial-images').getPublicUrl(fileName)
        uploadedUrls.push(urlData.publicUrl)
      }

      const { error: insertError } = await supabase.from('testimonials').insert({
        client_name: clientName || null,
        content,
        rating: parseInt(rating),
        approved: false,
        user_id: null,
        image_urls: uploadedUrls.length > 0 ? uploadedUrls : null,
      })

      if (insertError) throw insertError

      setSent(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
      setUploadProgress('')
    }
  }

  if (checkingVisibility) return <div className="p-8 text-center text-[#3A3532]/60">Chargement...</div>

  if (!visible) {
    return (
      <div className="p-8 text-center text-[#3A3532]/60 max-w-md mx-auto">
        Cette page n'est pas disponible pour le moment.
        <AdminEditButton href="/admin/site-settings" />
      </div>
    )
  }

  return (
    <div className="px-6 sm:px-8 py-12 max-w-lg mx-auto">
      <h1 className="font-display text-3xl text-[#3A3532] mb-4 text-center">Laisser un avis</h1>
      <p className="text-[#3A3532]/70 text-center mb-8">
        Ton témoignage sera publié après validation.
      </p>

      {sent ? (
        <div className="border border-[#F0EAE0] bg-white rounded-2xl p-5 text-center">
          <p className="text-[#3A3532]/70">Merci pour ton témoignage ! Il sera visible après validation.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 border border-[#F0EAE0] bg-white rounded-2xl p-5">
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
            rows={4}
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
          {uploadProgress && <p className="text-sm text-[#3A3532]/60">{uploadProgress}</p>}
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={uploading}
            className="py-2.5 bg-[#3A3532] text-[#FDFBF6] rounded-full font-medium hover:bg-[#2A2622] transition-colors border border-[#C9A44C] disabled:opacity-50"
          >
            {uploading ? 'Envoi...' : 'Envoyer mon témoignage'}
          </button>
        </form>
      )}
    </div>
  )
}
