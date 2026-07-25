'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import imageCompression from 'browser-image-compression'

type ListItem = { id: string; title: string; slug: string; cover_image_url: string | null }

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default function AdminRecipeLists() {
  const [lists, setLists] = useState<ListItem[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [uploadingListId, setUploadingListId] = useState<string | null>(null)
  const supabase = createClient()

  const load = async () => {
    const { data } = await supabase
      .from('recipe_lists')
      .select('id, title, slug, cover_image_url')
      .order('created_at', { ascending: false })
    setLists(data ?? [])
  }

  useEffect(() => {
    load()
  }, [])

  const uploadCoverImage = async (file: File) => {
    const compressed = await imageCompression(file, {
      maxWidthOrHeight: 1400,
      maxSizeMB: 0.4,
      fileType: 'image/webp',
    })
    const fileName = `list-cover-${Date.now()}.webp`
    const { error } = await supabase.storage.from('site-images').upload(fileName, compressed)
    if (error) throw error
    const { data } = supabase.storage.from('site-images').getPublicUrl(fileName)
    return data.publicUrl
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError('')

    try {
      let coverImageUrl: string | null = null
      if (imageFile) {
        coverImageUrl = await uploadCoverImage(imageFile)
      }

      const { error: insertError } = await supabase.from('recipe_lists').insert({
        title,
        slug: slugify(title),
        description: description || null,
        cover_image_url: coverImageUrl,
      })

      if (insertError) throw insertError

      setTitle('')
      setDescription('')
      setImageFile(null)
      load()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleChangeCover = async (listId: string, file: File) => {
    setUploadingListId(listId)
    try {
      const url = await uploadCoverImage(file)
      await supabase.from('recipe_lists').update({ cover_image_url: url }).eq('id', listId)
      load()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploadingListId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette liste ?')) return
    await supabase.from('recipe_lists').delete().eq('id', id)
    load()
  }

  return (
    <div className="p-6 sm:p-8 max-w-2xl mx-auto">
      <h1 className="font-display text-2xl text-[#3A3532] mb-6">Listes de recettes</h1>

      <form onSubmit={handleCreate} className="flex flex-col gap-3 mb-8 border border-[#F0EAE0] rounded-2xl p-4">
        <input
          placeholder="Titre de la liste (ex: Anti canicule)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="px-4 py-2 border border-[#F0EAE0] rounded-xl"
        />
        <textarea
          placeholder="Description (optionnel)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="px-4 py-2 border border-[#F0EAE0] rounded-xl"
        />
        <div>
          <label className="block mb-1 text-sm text-gray-600">Photo de couverture (optionnel)</label>
          <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={creating}
          className="py-2 bg-[#3A3532] text-[#FDFBF6] rounded-full font-medium disabled:opacity-50"
        >
          {creating ? 'Création...' : 'Créer la liste'}
        </button>
      </form>

      <div className="flex flex-col gap-3">
        {lists.map((l) => (
          <div key={l.id} className="border border-[#F0EAE0] rounded-xl p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[#3A3532] font-medium">{l.title}</span>
              <div className="flex gap-3">
                <Link href={`/admin/recipe-lists/${l.id}`} className="text-sm text-[#3A3532] underline">
                  Gérer les recettes
                </Link>
                <button onClick={() => handleDelete(l.id)} className="text-sm text-red-600">
                  Supprimer
                </button>
              </div>
            </div>

            {l.cover_image_url && (
              <img src={l.cover_image_url} alt={l.title} className="w-full h-32 object-cover rounded-lg mb-2" />
            )}

            <label className="block text-xs text-gray-500 mb-1">
              {l.cover_image_url ? 'Remplacer la photo de couverture' : 'Ajouter une photo de couverture'}
            </label>
            <input
              type="file"
              accept="image/*"
              disabled={uploadingListId === l.id}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleChangeCover(l.id, file)
              }}
            />
            {uploadingListId === l.id && <p className="text-xs text-gray-500 mt-1">Envoi en cours...</p>}
          </div>
        ))}
      </div>
    </div>
  )
}