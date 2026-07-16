'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import imageCompression from 'browser-image-compression'

const SLOTS = [
  { key: 'portrait_thermomix', label: '🥇 Portrait de toi avec le Thermomix', usage: 'Accueil + Contact' },
  { key: 'atelier_photo', label: '🥈 Toi en atelier', usage: 'Qui suis-je + Le Cercle' },
  { key: 'bouza_photo', label: '🥉 Ta Bouza noisettes', usage: 'Qui suis-je' },
  { key: 'cuisine_action', label: '🏅 Ta cuisine, Thermomix en action', usage: 'Pourquoi commander' },
  { key: 'table_ete', label: '🎖️ Table de recettes d\'été', usage: 'Challenge + Anti-canicule' },
  { key: 'round_logo', label: '⭕ Logo rond', usage: 'Accueil, Qui suis-je, Pourquoi commander, Le Cercle, Elles m\'ont fait confiance, Challenge' },
{ key: 'kids_cooking', label: '👩‍👧‍👦 Session cuisine avec les enfants', usage: 'Qui suis-je' },

]

export default function AdminBrandPhotos() {
  const [photos, setPhotos] = useState<Record<string, string | null>>({})
  const [uploadingKey, setUploadingKey] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const supabase = createClient()

  const load = async () => {
    const { data } = await supabase.from('brand_photos').select('*')
    const map: Record<string, string | null> = {}
    data?.forEach((row: any) => (map[row.key] = row.image_url))
    setPhotos(map)
  }

  useEffect(() => {
    load()
  }, [])

  const handleUpload = async (key: string, file: File) => {
    setUploadingKey(key)
    setMessage('')
    try {
      const compressed = await imageCompression(file, {
        maxWidthOrHeight: 1400,
        maxSizeMB: 0.4,
        fileType: 'image/webp',
      })
      const fileName = `${key}-${Date.now()}.webp`
      const { error: uploadError } = await supabase.storage.from('site-images').upload(fileName, compressed)
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('site-images').getPublicUrl(fileName)

      await supabase.from('brand_photos').upsert({ key, image_url: data.publicUrl })
      await load()
    } catch (err: any) {
      setMessage('Erreur : ' + err.message)
    } finally {
      setUploadingKey(null)
    }
  }

  const handleDelete = async (key: string) => {
    if (!confirm('Retirer cette photo ?')) return
    await supabase.from('brand_photos').update({ image_url: null }).eq('key', key)
    load()
  }

  return (
    <div className="p-6 sm:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Photos de marque</h1>
      <p className="text-gray-500 text-sm mb-6">
        Chaque photo est utilisée automatiquement à tous les emplacements indiqués.
      </p>

      {message && <p className="text-sm text-red-600 mb-4">{message}</p>}

      <div className="flex flex-col gap-6">
        {SLOTS.map((slot) => (
          <div key={slot.key} className="border border-gray-200 rounded-xl p-4">
            <h3 className="font-medium text-gray-900">{slot.label}</h3>
            <p className="text-xs text-gray-500 mb-3">Utilisée sur : {slot.usage}</p>

            {photos[slot.key] ? (
              <div className="mb-3">
                <img src={photos[slot.key]!} alt={slot.label} className="w-full h-48 object-cover rounded-lg mb-2" />
                <button onClick={() => handleDelete(slot.key)} className="text-sm text-red-600">
                  Supprimer cette photo
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-400 mb-3">Aucune photo pour l'instant.</p>
            )}

            <input
              type="file"
              accept="image/*"
              disabled={uploadingKey === slot.key}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleUpload(slot.key, file)
              }}
            />
            {uploadingKey === slot.key && <p className="text-xs text-gray-500 mt-1">Envoi en cours...</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
