'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Entry = { id: string; user_id: string; image_urls: string[]; comment: string | null; created_at: string }

export default function AdminChallenge() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [recipeId, setRecipeId] = useState('')
  const [active, setActive] = useState(true)
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('monthly_challenge')
      .select('*')
      .eq('id', 1)
      .single()
      .then(({ data }) => {
        if (data) {
          setTitle(data.title ?? '')
          setDescription(data.description ?? '')
          setRecipeId(data.recipe_id ?? '')
          setActive(data.active ?? true)
        }
        setLoading(false)
      })

    supabase
      .from('challenge_entries')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => setEntries(data ?? []))
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    const { error } = await supabase
      .from('monthly_challenge')
      .update({
        title,
        description,
        recipe_id: recipeId || null,
        active,
      })
      .eq('id', 1)

    setSaving(false)
    setMessage(error ? error.message : 'Enregistré avec succès !')
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement...</div>

  return (
    <div className="p-6 sm:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Gérer le challenge du mois</h1>

      <form onSubmit={handleSave} className="flex flex-col gap-4 mb-10">
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">Titre du challenge</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            ID de la recette liée (optionnel — copie l'ID depuis l'URL de la recette)
          </label>
          <input
            value={recipeId}
            onChange={(e) => setRecipeId(e.target.value)}
            placeholder="uuid de la recette"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div className="flex justify-between items-center border border-gray-200 rounded-xl p-4">
          <span className="text-gray-900 font-medium">Challenge actif</span>
          <button
            type="button"
            onClick={() => setActive(!active)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium ${
              active ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'
            }`}
          >
            {active ? 'Actif' : 'Inactif'}
          </button>
        </div>

        {message && <p className="text-sm text-gray-700">{message}</p>}

        <button
          type="submit"
          disabled={saving}
          className="py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-black transition-colors disabled:opacity-50"
        >
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </form>

      <h2 className="text-lg font-semibold text-gray-900 mb-3">
        Toutes les participations ({entries.length})
      </h2>
      <div className="grid gap-4">
        {entries.map((e) => (
          <div key={e.id} className="border border-gray-200 rounded-xl p-3">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
              {e.image_urls?.map((url, i) => (
                <img key={i} src={url} alt="" className="w-full h-24 object-cover rounded-lg" />
              ))}
            </div>
            {e.comment && <p className="text-xs text-gray-500">{e.comment}</p>}
            <p className="text-xs text-gray-400">{new Date(e.created_at).toLocaleDateString('fr-FR')}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
