'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import imageCompression from 'browser-image-compression'

type Tip = {
  id: string
  title: string
  description: string | null
  image_url: string | null
  video_url: string | null
  external_video_url: string | null
  position: number
}

export default function AdminTips() {
  const [tips, setTips] = useState<Tip[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [externalVideoUrl, setExternalVideoUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()

  const load = async () => {
    const { data } = await supabase.from('tips').select('*').order('position')
    setTips(data ?? [])
  }

  useEffect(() => {
    load()
  }, [])

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setImageFile(null)
    setVideoFile(null)
    setExternalVideoUrl('')
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)
    setMessage('')

    try {
      let imageUrl: string | null = null
      if (imageFile) {
        const compressed = await imageCompression(imageFile, {
          maxWidthOrHeight: 1400,
          maxSizeMB: 0.4,
          fileType: 'image/webp',
        })
        const fileName = `tip-${Date.now()}.webp`
        const { error } = await supabase.storage.from('site-images').upload(fileName, compressed)
        if (error) throw error
        const { data } = supabase.storage.from('site-images').getPublicUrl(fileName)
        imageUrl = data.publicUrl
      }

      let videoUrl: string | null = null
      if (videoFile) {
        const fileName = `tip-video-${Date.now()}-${videoFile.name}`
        const { error } = await supabase.storage.from('tip-videos').upload(fileName, videoFile)
        if (error) throw error
        const { data } = supabase.storage.from('tip-videos').getPublicUrl(fileName)
        videoUrl = data.publicUrl
      }

      const { error: insertError } = await supabase.from('tips').insert({
        title,
        description: description || null,
        image_url: imageUrl,
        video_url: videoUrl,
        external_video_url: externalVideoUrl || null,
        position: tips.length,
      })

      if (insertError) throw insertError

      resetForm()
      load()
      setMessage('Astuce ajoutée avec succès !')
    } catch (err: any) {
      setMessage('Erreur : ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette astuce ?')) return
    await supabase.from('tips').delete().eq('id', id)
    load()
  }

  const moveTip = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= tips.length) return

    const current = tips[index]
    const target = tips[targetIndex]

    await supabase.from('tips').update({ position: target.position }).eq('id', current.id)
    await supabase.from('tips').update({ position: current.position }).eq('id', target.id)

    load()
  }

  return (
    <div className="p-6 sm:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Gérer les astuces Thermomix</h1>

      <form onSubmit={handleAdd} className="flex flex-col gap-3 mb-10 border border-gray-200 rounded-xl p-4">
        <input
          placeholder="Titre de l'astuce"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="px-4 py-2 border border-gray-300 rounded-lg"
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        />
        <div>
          <label className="block mb-1 text-sm text-gray-600">Photo (optionnel)</label>
          <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
        </div>
        <div>
          <label className="block mb-1 text-sm text-gray-600">Vidéo à uploader (optionnel)</label>
          <input type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)} />
        </div>
        <input
          placeholder="Lien vidéo YouTube ou Instagram (optionnel)"
          value={externalVideoUrl}
          onChange={(e) => setExternalVideoUrl(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        />
        {message && <p className="text-sm text-gray-700">{message}</p>}
        <button
          type="submit"
          disabled={uploading}
          className="py-2.5 bg-gray-900 text-white rounded-lg font-medium disabled:opacity-50"
        >
          {uploading ? 'Envoi...' : "Ajouter l'astuce"}
        </button>
      </form>

      <h2 className="text-lg font-semibold text-gray-900 mb-3">Astuces existantes ({tips.length})</h2>
      <div className="flex flex-col gap-3">
        {tips.map((tip, i) => (
          <div key={tip.id} className="border border-gray-200 rounded-xl p-3 flex gap-3 items-center">
            {tip.image_url ? (
              <img src={tip.image_url} alt="" className="w-16 h-16 object-cover rounded-lg shrink-0" />
            ) : (
              <div className="w-16 h-16 bg-gray-100 rounded-lg shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{tip.title}</p>
              <p className="text-xs text-gray-400">Position {i + 1}</p>
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              <button
                onClick={() => moveTip(i, -1)}
                disabled={i === 0}
                className="px-2 py-1 border border-gray-300 rounded text-sm disabled:opacity-30"
              >
                ↑
              </button>
              <button
                onClick={() => moveTip(i, 1)}
                disabled={i === tips.length - 1}
                className="px-2 py-1 border border-gray-300 rounded text-sm disabled:opacity-30"
              >
                ↓
              </button>
            </div>
            <button onClick={() => handleDelete(tip.id)} className="text-xs text-red-600 shrink-0">
              Supprimer
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
