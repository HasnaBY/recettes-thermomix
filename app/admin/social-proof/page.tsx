'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import imageCompression from 'browser-image-compression'

type Item = { id: string; category: string; image_url: string; caption: string | null }

const CATEGORIES = [
  { key: 'atelier', label: 'Photo d\'atelier' },
  { key: 'realisation', label: 'Réalisation de cliente' },
  { key: 'capture', label: 'Capture de message' },
  { key: 'avis', label: 'Avis' },
]

export default function AdminSocialProof() {
  const [items, setItems] = useState<Item[]>([])
  const [category, setCategory] = useState('atelier')
  const [file, setFile] = useState<File | null>(null)
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()

  const load = async () => {
    const { data } = await supabase.from('social_proof').select('*').order('position')
    setItems(data ?? [])
  }

  useEffect(() => {
    load()
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    setUploading(true)
    setMessage('')

    try {
      const compressed = await imageCompression(file, {
        maxWidthOrHeight: 1200,
        maxSizeMB: 0.3,
        fileType: 'image/webp',
      })

      const fileName = `social-${Date.now()}.webp`
      const { error: uploadError } = await supabase.storage
        .from('site-images')
        .upload(fileName, compressed)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('site-images').getPublicUrl(fileName)

      await supabase.from('social_proof').insert({
        category,
        image_url: urlData.publicUrl,
        caption: caption || null,
        position: items.length,
      })

      setFile(null)
      setCaption('')
      load()
    } catch (err: any) {
      setMessage('Erreur : ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    await supabase.from('social_proof').delete().eq('id', id)
    load()
  }

  return (
    <div className="p-6 sm:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Gérer "Ils m'ont fait confiance"</h1>

      <form onSubmit={handleAdd} className="flex flex-col gap-3 mb-8 border border-gray-200 rounded-xl p-4">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          {CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <input
          placeholder="Légende (optionnel)"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        />
        {message && <p className="text-sm text-gray-700">{message}</p>}
        <button
          type="submit"
          disabled={uploading || !file}
          className="py-2 bg-gray-900 text-white rounded-lg font-medium disabled:opacity-50"
        >
          {uploading ? 'Envoi...' : 'Ajouter'}
        </button>
      </form>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map((item) => (
          <div key={item.id}>
            <img src={item.image_url} alt={item.caption ?? ''} className="w-full h-32 object-cover rounded-lg" />
            <p className="text-xs text-gray-400 mt-1">
              {CATEGORIES.find((c) => c.key === item.category)?.label}
            </p>
            {item.caption && <p className="text-xs text-gray-500">{item.caption}</p>}
            <button onClick={() => handleDelete(item.id)} className="mt-1 text-xs text-red-600">
              Supprimer
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
