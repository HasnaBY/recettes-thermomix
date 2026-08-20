'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function RecipeCreator() {
  const [rawIdea, setRawIdea] = useState('')
  const [generated, setGenerated] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()
  const router = useRouter()

  const generate = async () => {
    setLoading(true)
    setError('')
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const response = await fetch('/api/create-recipe-from-ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ rawIdea }),
      })
      const data = await response.json()
      if (response.ok) setGenerated(data)
      else setError(data.error)
    } finally {
      setLoading(false)
    }
  }

  const saveAsDraft = async () => {
    setSaving(true)
    const { error: insertError } = await supabase.from('recipes').insert({
      title: generated.title,
      description: generated.description,
      category: generated.category,
      ingredients: generated.ingredients,
      steps: generated.steps,
      recipe_source: 'creation',
    })
    setSaving(false)
    if (!insertError) router.push('/admin')
    else setError(insertError.message)
  }

  return (
    <div className="p-6 sm:p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Créer une recette depuis une idée</h1>

      <textarea
        placeholder="Décris ton idée ou tes ingrédients bruts (ex: poulet, curry, lait de coco, envie d'un plat asiatique rapide)"
        value={rawIdea}
        onChange={(e) => setRawIdea(e.target.value)}
        rows={4}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3"
      />
      <button
        onClick={generate}
        disabled={loading || !rawIdea}
        className="py-2.5 px-6 bg-gray-900 text-white rounded-lg font-medium disabled:opacity-50"
      >
        {loading ? 'Génération...' : 'Générer la recette'}
      </button>

      {error && <p className="text-red-600 text-sm mt-4">{error}</p>}

      {generated && (
        <div className="mt-6 border border-gray-200 rounded-xl p-4">
          <h2 className="font-bold text-gray-900 mb-1">{generated.title}</h2>
          <p className="text-sm text-gray-600 mb-3">{generated.description}</p>
          <p className="text-xs text-gray-500 mb-1">Catégorie : {generated.category}</p>
          <p className="text-sm font-medium text-gray-900 mt-3 mb-1">Ingrédients</p>
          <ul className="text-sm text-gray-700 list-disc pl-4 mb-3">
            {generated.ingredients?.map((i: string, idx: number) => (
              <li key={idx}>{i}</li>
            ))}
          </ul>
          <p className="text-sm font-medium text-gray-900 mb-1">Étapes</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap mb-4">{generated.steps}</p>

          <button
            onClick={saveAsDraft}
            disabled={saving}
            className="py-2 px-6 bg-gray-900 text-white rounded-lg font-medium disabled:opacity-50"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer comme recette'}
          </button>
        </div>
      )}
    </div>
  )
}