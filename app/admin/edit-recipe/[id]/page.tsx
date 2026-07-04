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
  const [steps, setSteps] = useState('')
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
      setSteps(data.steps ?? '')
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
        steps,
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

  if (loading) return <div style={{ padding: '2rem' }}>Chargement...</div>

  return (
    <div style={{ padding: '2rem', maxWidth: '500px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Modifier la recette</h1>

      {imageUrl && (
        <img src={imageUrl} alt={title} style={{ width: '100%', borderRadius: '8px', marginBottom: '1rem' }} />
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input
          placeholder="Titre"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <input
          placeholder="Catégorie"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <input
          type="number"
          placeholder="Temps (minutes)"
          value={timeMinutes}
          onChange={(e) => setTimeMinutes(e.target.value)}
          style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <textarea
          placeholder="Étapes de préparation"
          value={steps}
          onChange={(e) => setSteps(e.target.value)}
          rows={5}
          style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            Remplacer la photo (optionnel)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {error && <p style={{ color: 'red', fontSize: '0.9rem' }}>{error}</p>}

        <button
          type="submit"
          disabled={saving}
          style={{ padding: '0.75rem', backgroundColor: '#000', color: '#fff', borderRadius: '4px', border: 'none' }}
        >
          {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </button>
      </form>

      <button
        onClick={handleDelete}
        style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#fff', color: 'red', border: '1px solid red', borderRadius: '4px', width: '100%' }}
      >
        Supprimer cette recette
      </button>
    </div>
  )
}
