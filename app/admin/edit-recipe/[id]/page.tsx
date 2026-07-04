'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import imageCompression from 'browser-image-compression'

export default function EditRecipe({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [timeMinutes, setTimeMinutes] = useState('')
  const [cookidooUrl, setCookidooUrl] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { id: recipeId } = await params
      setId(recipeId)

      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', recipeId)
        .single()

      if (error || !data) {
        setError('Recette introuvable')
        setLoading(false)
        return
      }

      setTitle(data.title ?? '')
      setDescription(data.description ?? '')
      setCategory(data.category ?? '')
      setTimeMinutes(data.time_minutes?.toString() ?? '')
      setCookidooUrl(data.cookidoo_url ?? '')
      setImageUrl(data.image_url)
      setLoading(false)
    }
    load()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    let finalImageUrl = imageUrl

    if (imageFile) {
      try {
        const compressed = await imageCompression(imageFile, {
          maxWidthOrHeight: 1200,
          maxSizeMB: 0.3,
          fileType: 'image/webp',
        })

        const fileName = `${Date.now()}-${imageFile.name.replace(/\.[^.]+$/, '')}.webp`

        const { error: uploadError } = await supabase.storage
          .from('recipe-images')
          .upload(fileName, compressed)

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
          .from('recipe-images')
          .getPublicUrl(fileName)

        finalImageUrl = urlData.publicUrl
      } catch (err: any) {
        setError('Erreur upload image : ' + err.message)
        setSaving(false)
        return
      }
    }

    const { error: updateError } = await supabase
      .from('recipes')
      .update({
        title,
        description,
        category,
        time_minutes: parseInt(timeMinutes) || null,
        cookidoo_url: cookidooUrl || null,
        image_url: finalImageUrl,
      })
      .eq('id', id)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
    } else {
      router.push('/admin')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Supprimer définitivement cette recette ?')) return
    await supabase.from('recipes').delete().eq('id', id)
    router.push('/admin')
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement...</div>

  return (
    <div className="p-6 sm:p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Modifier la recette</h1>

      {imageUrl && (
        <img src={imageUrl} alt={title} className="w-full h-48 object-cover rounded-lg mb-4" />
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          placeholder="Titre"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <input
          placeholder="Catégorie"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <input
          type="number"
          placeholder="Temps (minutes)"
          value={timeMinutes}
          onChange={(e) => setTimeMinutes(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <input
          type="url"
          placeholder="Lien Cookidoo"
          value={cookidooUrl}
          onChange={(e) => setCookidooUrl(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <div>
          <label className="block mb-2 text-sm text-gray-600">Remplacer la photo (optionnel)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-black transition-colors disabled:opacity-50"
        >
          {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </button>
      </form>

      <button
        onClick={handleDelete}
        className="mt-4 w-full py-2.5 bg-white text-red-600 border border-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors"
      >
        Supprimer cette recette
      </button>
    </div>
  )
}
