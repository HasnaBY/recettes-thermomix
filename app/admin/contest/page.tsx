'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import imageCompression from 'browser-image-compression'

type Photo = { id: string; image_url: string; caption: string | null; position: number }

export default function AdminContest() {
  const [whyParticipated, setWhyParticipated] = useState('')
  const [experience, setExperience] = useState('')
  const [learnings, setLearnings] = useState('')
  const [encounters, setEncounters] = useState('')
  const [todayBenefit, setTodayBenefit] = useState('')
  const [photos, setPhotos] = useState<Photo[]>([])
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null)
  const [newCaption, setNewCaption] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()

  const loadPhotos = async () => {
    const { data } = await supabase.from('contest_photos').select('*').order('position')
    setPhotos(data ?? [])
  }

  useEffect(() => {
    supabase
      .from('contest_content')
      .select('*')
      .eq('id', 1)
      .single()
      .then(({ data }) => {
        if (data) {
          setWhyParticipated(data.why_participated ?? '')
          setExperience(data.experience ?? '')
          setLearnings(data.learnings ?? '')
          setEncounters(data.encounters ?? '')
          setTodayBenefit(data.today_benefit ?? '')
        }
        setLoading(false)
      })

    loadPhotos()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    const { error } = await supabase
      .from('contest_content')
      .update({
        why_participated: whyParticipated,
        experience,
        learnings,
        encounters,
        today_benefit: todayBenefit,
      })
      .eq('id', 1)

    setSaving(false)
    setMessage(error ? error.message : 'Enregistré avec succès !')
  }

  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPhotoFile) return
    setUploadingPhoto(true)

    try {
      const compressed = await imageCompression(newPhotoFile, {
        maxWidthOrHeight: 1200,
        maxSizeMB: 0.3,
        fileType: 'image/webp',
      })

      const fileName = `contest-${Date.now()}.webp`
      const { error: uploadError } = await supabase.storage
        .from('site-images')
        .upload(fileName, compressed)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('site-images').getPublicUrl(fileName)

      await supabase.from('contest_photos').insert({
        image_url: urlData.publicUrl,
        caption: newCaption || null,
        position: photos.length,
      })

      setNewPhotoFile(null)
      setNewCaption('')
      loadPhotos()
    } catch (err: any) {
      setMessage('Erreur upload : ' + err.message)
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleDeletePhoto = async (id: string) => {
    await supabase.from('contest_photos').delete().eq('id', id)
    loadPhotos()
  }

  const movePhoto = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= photos.length) return

    const current = photos[index]
    const target = photos[targetIndex]

    await supabase.from('contest_photos').update({ position: target.position }).eq('id', current.id)
    await supabase.from('contest_photos').update({ position: current.position }).eq('id', target.id)

    loadPhotos()
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement...</div>

  return (
    <div className="p-6 sm:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Modifier "Grand Concours"</h1>

      <form onSubmit={handleSave} className="flex flex-col gap-6 mb-10">
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">Pourquoi j'ai participé</label>
          <textarea
            value={whyParticipated}
            onChange={(e) => setWhyParticipated(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">Mon expérience</label>
          <textarea
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">Ce que j'y ai appris</label>
          <textarea
            value={learnings}
            onChange={(e) => setLearnings(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">Les rencontres</label>
          <textarea
            value={encounters}
            onChange={(e) => setEncounters(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Ce que ça apporte à mes clientes
          </label>
          <textarea
            value={todayBenefit}
            onChange={(e) => setTodayBenefit(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        {message && <p className="text-sm text-gray-700">{message}</p>}

        <button
          type="submit"
          disabled={saving}
          className="py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-black transition-colors disabled:opacity-50"
        >
          {saving ? 'Enregistrement...' : 'Enregistrer le texte'}
        </button>
      </form>

      <h2 className="text-lg font-semibold text-gray-900 mb-3">
        Galerie photo (ordre d'affichage dans le carrousel)
      </h2>

      <form onSubmit={handleAddPhoto} className="flex flex-col gap-3 mb-6 border border-gray-200 rounded-xl p-4">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setNewPhotoFile(e.target.files?.[0] ?? null)}
        />
        <input
          placeholder="Légende (optionnel)"
          value={newCaption}
          onChange={(e) => setNewCaption(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        />
        <button
          type="submit"
          disabled={uploadingPhoto || !newPhotoFile}
          className="py-2 bg-gray-900 text-white rounded-lg font-medium disabled:opacity-50"
        >
          {uploadingPhoto ? 'Envoi...' : 'Ajouter la photo'}
        </button>
      </form>

      <div className="flex flex-col gap-3">
        {photos.map((p, i) => (
          <div key={p.id} className="flex gap-3 items-center border border-gray-200 rounded-xl p-3">
            <img src={p.image_url} alt={p.caption ?? ''} className="w-20 h-20 object-cover rounded-lg shrink-0" />
            <div className="flex-1 min-w-0">
              {p.caption && <p className="text-sm text-gray-700 truncate">{p.caption}</p>}
              <p className="text-xs text-gray-400">Position {i + 1}</p>
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              <button
                onClick={() => movePhoto(i, -1)}
                disabled={i === 0}
                className="px-2 py-1 border border-gray-300 rounded text-sm disabled:opacity-30"
              >
                ↑
              </button>
              <button
                onClick={() => movePhoto(i, 1)}
                disabled={i === photos.length - 1}
                className="px-2 py-1 border border-gray-300 rounded text-sm disabled:opacity-30"
              >
                ↓
              </button>
            </div>
            <button onClick={() => handleDeletePhoto(p.id)} className="text-xs text-red-600 shrink-0">
              Supprimer
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
