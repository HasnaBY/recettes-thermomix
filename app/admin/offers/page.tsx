'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import imageCompression from 'browser-image-compression'

export default function AdminOffers() {
  const [description, setDescription] = useState('')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()

  const load = async () => {
    const { data } = await supabase.from('current_offers').select('*').eq('id', 1).single()
    if (data) {
      setDescription(data.description ?? '')
      setImageUrls(data.image_urls ?? [])
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? [])
    setNewFiles(selected)
  }

  const addImages = async () => {
    if (newFiles.length === 0) return
    setUploading(true)
    setMessage('')

    try {
      const uploadedUrls: string[] = []

      for (let i = 0; i < newFiles.length; i++) {
        setUploadProgress(`Envoi de la photo ${i + 1}/${newFiles.length}...`)

        const original = newFiles[i]
        let toUpload: File | Blob = original
        let extension = original.name.split('.').pop() || 'jpg'

        // Ne compresse que si le fichier est vraiment volumineux (>3 Mo)
        // pour garder un maximum de netteté sur le texte des offres.
        if (original.size > 3 * 1024 * 1024) {
          toUpload = await imageCompression(original, {
            maxWidthOrHeight: 2400,
            maxSizeMB: 3,
            initialQuality: 0.95,
            useWebWorker: true,
            fileType: original.type, // garde le format d'origine, pas de conversion webp
          })
        }

        const fileName = `offer-${Date.now()}-${i}.${extension}`
        const { error } = await supabase.storage.from('site-images').upload(fileName, toUpload)
        if (error) throw error
        const { data } = supabase.storage.from('site-images').getPublicUrl(fileName)
        uploadedUrls.push(data.publicUrl)
      }

      setImageUrls((prev) => [...prev, ...uploadedUrls])
      setNewFiles([])
    } catch (err: any) {
      setMessage('Erreur : ' + err.message)
    } finally {
      setUploading(false)
      setUploadProgress('')
    }
  }

  const removeImage = (url: string) => {
    setImageUrls((prev) => prev.filter((u) => u !== url))
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    const { error } = await supabase
      .from('current_offers')
      .update({ description, image_urls: imageUrls })
      .eq('id', 1)
    setSaving(false)
    setMessage(error ? error.message : 'Enregistré avec succès !')
  }

  return (
    <div className="p-6 sm:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Offres du moment</h1>
      <p className="text-gray-500 text-sm mb-6">
        Ces images et ce texte sont envoyés automatiquement par email dès qu'une personne clique sur "Recevoir les offres du moment" en contact. Les images ne sont compressées que si elles dépassent 3 Mo, pour garder le texte bien lisible.
      </p>

      <div className="flex flex-col gap-4 mb-8">
        <textarea
          placeholder="Texte d'introduction de l'offre"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        {imageUrls.map((url) => (
          <div key={url}>
            <img src={url} className="w-full h-32 object-cover rounded-lg" />
            <button onClick={() => removeImage(url)} className="text-xs text-red-600 mt-1">
              Supprimer
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 mb-6">
        <label className="text-sm text-gray-600">Sélectionne une ou plusieurs photos</label>
        <input type="file" accept="image/*" multiple onChange={handleFilesChange} />
        {newFiles.length > 0 && (
          <p className="text-xs text-gray-500">{newFiles.length} photo(s) sélectionnée(s)</p>
        )}
        {uploadProgress && <p className="text-xs text-gray-500">{uploadProgress}</p>}
        <button
          onClick={addImages}
          disabled={uploading || newFiles.length === 0}
          className="self-start px-3 py-1.5 bg-gray-900 text-white rounded-lg text-sm disabled:opacity-50"
        >
          {uploading ? 'Envoi...' : 'Ajouter les photos'}
        </button>
      </div>

      {message && <p className="text-sm text-gray-700 mb-4">{message}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="py-2.5 px-6 bg-gray-900 text-white rounded-lg font-medium disabled:opacity-50"
      >
        {saving ? 'Enregistrement...' : 'Enregistrer'}
      </button>
    </div>
  )
}
