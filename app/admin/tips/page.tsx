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
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [existingVideoUrl, setExistingVideoUrl] = useState<string | null>(null)
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
    setEditingId(null)
    setTitle('')
    setDescription('')
    setImageFile(null)
    setExistingImageUrl(null)
    setVideoFile(null)
    setExistingVideoUrl(null)
    setExternalVideoUrl('')
  }

  const startEdit = (tip: Tip) => {
    setEditingId(tip.id)
    setTitle(tip.title)
    setDescription(tip.description ?? '')
    setExistingImageUrl(tip.image_url)
    setImageFile(null)
    setExistingVideoUrl(tip.video_url)
    setVideoFile(null)
    setExternalVideoUrl(tip.external_video_url ?? '')
    setMessage('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)
    setMessage('')

    try {
      let imageUrl = existingImageUrl
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

      let videoUrl = existingVideoUrl
      if (videoFile) {
        const fileName = `tip-video-${Date.now()}-${videoFile.name}`
        const { error } = await supabase.storage.from('tip-videos').upload(fileName, videoFile)
        if (error) throw error
        const { data } = supabase.storage.from('tip-videos').getPublicUrl(fileName)
        videoUrl = data.publicUrl
      }

      if (editingId) {
        const { error: updateError } = await supabase
          .from('tips')
          .update({
            title,
            description: description || null,
            image_url: imageUrl,
            video_url: videoUrl,
            external_video_url: externalVideoUrl || null,
          })
          .eq('id', editingId)

        if (updateError) throw updateError
        setMessage('Astuce mise à jour avec succès !')
      } else {
        const { error: insertError } = await supabase.from('tips').insert({
          title,
          description: description || null,
          image_url: imageUrl,
          video_url: videoUrl,
          external_video_url: externalVideoUrl || null,
          position: tips.length,
        })

        if (insertError) throw insertError
        setMessage('Astuce ajoutée avec succès !')
      }

      resetForm()
      load()
    } catch (err: any) {
      setMessage('Erreur : ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette astuce ?')) return
    await supabase.from('tips').delete().eq('id', id)
    if (editingId === id) resetForm()
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

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 mb-10 border border-gray-200 rounded-xl p-4">
        <h2 className="font-medium text-gray-900">
          {editingId ? "Modifier l'astuce" : 'Ajouter une astuce'}
        </h2>

        <input
          placeholder="Titre de l'astuce"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="px-4 py-2 border border-gray-300 rounded-lg"
        />
        <textarea
          placeholder="Description (utilise Entrée pour créer des paragraphes)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        />

        <div>
          <label className="block mb-1 text-sm text-gray-600">Photo (optionnel)</label>
          {existingImageUrl && !imageFile && (
            <img src={existingImageUrl} alt="" className="w-24 h-24 object-cover rounded-lg mb-2" />
          )}
          <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
        </div>

        <div>
          <label className="block mb-1 text-sm text-gray-600">Vidéo à uploader (optionnel)</label>
          {existingVideoUrl && !videoFile && (
            <p className="text-xs text-gray-500 mb-1">Une vidéo est déjà associée à cette astuce.</p>
          )}
          <input type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)} />
        </div>

        <input
          placeholder="Lien vidéo YouTube ou Instagram (optionnel)"
          value={externalVideoUrl}
          onChange={(e) => setExternalVideoUrl(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        />

        {message && <p className="text-sm text-gray-700">{message}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={uploading}
            className="py-2.5 px-6 bg-gray-900 text-white rounded-lg font-medium disabled:opacity-50"
          >
            {uploading ? 'Envoi...' : editingId ? 'Enregistrer les modifications' : "Ajouter l'astuce"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="py-2.5 px-6 border border-gray-300 rounded-lg font-medium"
            >
              Annuler
            </button>
          )}
        </div>
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
            <button onClick={() => startEdit(tip)} className="text-xs text-gray-900 underline shrink-0">
              Modifier
            </button>
            <button onClick={() => handleDelete(tip.id)} className="text-xs text-red-600 shrink-0">
              Supprimer
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}