'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type ListItem = { id: string; title: string; slug: string }

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
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const load = async () => {
    const { data } = await supabase
      .from('recipe_lists')
      .select('id, title, slug')
      .order('created_at', { ascending: false })
    setLists(data ?? [])
  }

  useEffect(() => {
    load()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError('')

    const { error } = await supabase.from('recipe_lists').insert({
      title,
      slug: slugify(title),
      description: description || null,
    })

    if (error) {
      setError(error.message)
    } else {
      setTitle('')
      setDescription('')
      load()
    }
    setCreating(false)
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
          <div key={l.id} className="flex justify-between items-center border border-[#F0EAE0] rounded-xl p-3">
            <span className="text-[#3A3532]">{l.title}</span>
            <div className="flex gap-3">
              <Link href={`/admin/recipe-lists/${l.id}`} className="text-sm text-[#3A3532] underline">
                Gérer les recettes
              </Link>
              <button onClick={() => handleDelete(l.id)} className="text-sm text-red-600">
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
