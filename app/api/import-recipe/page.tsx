'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import TagSelect from '@/components/TagSelect'

export default function ImportRecipe() {
  const [mode, setMode] = useState<'url' | 'text'>('url')
  const [url, setUrl] = useState('')
  const [rawText, setRawText] = useState('')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [origin, setOrigin] = useState('')
  const [prepTimeMinutes, setPrepTimeMinutes] = useState('')
  const [totalTimeMinutes, setTotalTimeMinutes] = useState('')
  const [ingredients, setIngredients] = useState('')
  const [steps, setSteps] = useState('')
  const [recipeSource, setRecipeSource] = useState('cookidoo')
  const [published, setPublished] = useState(false)

  const [extracted, setExtracted] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()
  const router = useRouter()

  const handleExtract = async () => {
    setExtracting(true)
    setError('')
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const response = await fetch('/api/import-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify(mode === 'url' ? { url } : { rawText }),
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data.error)
        return
      }

      setTitle(data.title ?? '')
      setDescription(data.description ?? '')
      setCategory(data.category ?? '')
      setOrigin(data.origin ?? '')
      setPrepTimeMinutes(data.prep_time_minutes?.toString() ?? '')
      setTotalTimeMinutes(data.total_time_minutes?.toString() ?? '')
      setIngredients((data.ingredients ?? []).join('\n'))
      setSteps(data.steps ?? '')
      setExtracted(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setExtracting(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const ingredientsList = ingredients
      .split('\n')
      .map((i) => i.trim())
      .filter((i) => i !== '')

    const { error: insertError } = await supabase.from('recipes').insert({
      title,
      description,
      category,
      origin: origin || null,
      recipe_source: recipeSource,
      prep_time_minutes: prepTimeMinutes ? parseInt(prepTimeMinutes) : null,
      total_time_minutes: totalTimeMinutes ? parseInt(totalTimeMinutes) : null,
      cookidoo_url: mode === 'url' ? url : null,
      ingredients: ingredientsList.length > 0 ? ingredientsList : null,
      steps: steps || null,
      is_featured: false,
      status: published ? 'published' : 'draft',
      image_url: null,
    })

    if (insertError) {
      setError(insertError.message)
      setSaving(false)
    } else {
      router.push('/admin')
    }
  }

  return (
    <div className="p-6 sm:p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Importer une recette</h1>
      <p className="text-gray-500 text-sm mb-6">
        Colle un lien ou le texte d'une recette, l'IA récupère titre/ingrédients/étapes exactement tels qu'écrits. Il ne te restera qu'à ajouter la photo. La recette est créée en brouillon par défaut.
      </p>

      {!extracted ? (
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode('url')}
              className={`px-3 py-1.5 rounded-full text-sm ${mode === 'url' ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}
            >
              Depuis un lien
            </button>
            <button
              type="button"
              onClick={() => setMode('text')}
              className={`px-3 py-1.5 rounded-full text-sm ${mode === 'text' ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}
            >
              Depuis un texte collé
            </button>
          </div>

          {mode === 'url' ? (
            <input
              placeholder="https://cookidoo.fr/recipes/recipe/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          ) : (
            <textarea
              placeholder="Colle ici le texte complet de la recette"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={12}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm"
            />
          )}

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            onClick={handleExtract}
            disabled={extracting || (mode === 'url' ? !url : rawText.trim().length < 20)}
            className="py-2.5 px-6 bg-gray-900 text-white rounded-lg font-medium disabled:opacity-50"
          >
            {extracting ? 'Extraction en cours...' : 'Extraire la recette'}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <p className="text-sm text-green-700 bg-green-50 rounded-lg p-3">
            Recette extraite — vérifie et corrige les champs avant d'enregistrer.
          </p>

          <input
            placeholder="Titre"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="px-4 py-2 border border-gray-300 rounded-lg"
          />
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          />

          <TagSelect table="recipe_categories" value={category} onChange={setCategory} placeholder="Choisir une catégorie" />
          <TagSelect table="recipe_origins" value={origin} onChange={setOrigin} placeholder="Choisir une origine (optionnel)" />

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block mb-1 text-sm text-gray-600">Préparation (min)</label>
              <input
                type="number"
                value={prepTimeMinutes}
                onChange={(e) => setPrepTimeMinutes(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="flex-1">
              <label className="block mb-1 text-sm text-gray-600">Temps total (min)</label>
              <input
                type="number"
                value={totalTimeMinutes}
                onChange={(e) => setTotalTimeMinutes(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block mb-2 text-sm text-gray-600">Type de recette</label>
            <select
              value={recipeSource}
              onChange={(e) => setRecipeSource(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="cookidoo">📱 Recette Cookidoo</option>
              <option value="creation">👩‍🍳 Ma création personnelle</option>
            </select>
          </div>

          <div>
            <label className="block mb-2 text-sm text-gray-600">Ingrédients (un par ligne)</label>
            <textarea
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm text-gray-600">Étapes de préparation</label>
            <textarea
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
            Publier immédiatement (sinon reste en brouillon)
          </label>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="py-2.5 px-6 bg-gray-900 text-white rounded-lg font-medium disabled:opacity-50"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer la recette'}
            </button>
            <button
              type="button"
              onClick={() => setExtracted(false)}
              className="py-2.5 px-6 border border-gray-300 rounded-lg font-medium"
            >
              Recommencer
            </button>
          </div>
        </form>
      )}
    </div>
  )
}