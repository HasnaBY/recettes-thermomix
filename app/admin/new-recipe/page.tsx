'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import imageCompression from 'browser-image-compression'

export default function NewRecipe() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [origin, setOrigin] = useState('')
  const [recipeSource, setRecipeSource] = useState('cookidoo')
  const [prepTimeMinutes, setPrepTimeMinutes] = useState('')
  const [totalTimeMinutes, setTotalTimeMinutes] = useState('')
  const [cookidooUrl, setCookidooUrl] = useState('')
  const [ingredients, setIngredients] = useState('')
  const [steps, setSteps] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)
    setError('')

    let imageUrl = null

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

        imageUrl = urlData.publicUrl
      } catch (err: any) {
        setError('Erreur upload image : ' + err.message)
        setUploading(false)
        return
      }
    }

    const ingredientsList = ingredients
      .split('\n')
      .map((i) => i.trim())
      .filter((i) => i !== '')

    const { error: insertError } = await supabase.from('recipes').insert({
      title,
      description,
      category,
      origin,
      recipe_source: recipeSource,
      prep_time_minutes: prepTimeMinutes ? parseInt(prepTimeMinutes) : null,
      total_time_minutes: totalTimeMinutes ? parseInt(totalTimeMinutes) : null,
      cookidoo_url: cookidooUrl || null,
      ingredients: ingredientsList.length > 0 ? ingredientsList : null,
      steps: steps || null,
      image_url: imageUrl,
    })

    if (insertError) {
      setError(insertError.message)
      setUploading(false)
    } else {
      router.push('/admin')
    }
  }

  return (
    <div className="p-6 sm:p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Ajouter une recette</h1>

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
          placeholder="Catégorie (ex: plat, dessert...)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <input
          placeholder="Origine (ex: tunisienne, italienne...)"
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
        />

        <div>
          <label className="block mb-2 text-sm text-gray-600">Type de recette</label>
          <select
            value={recipeSource}
            onChange={(e) => setRecipeSource(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="cookidoo">📱 Recette Cookidoo</option>
            <option value="creation">👩‍🍳 Ma création personnelle</option>
          </select>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block mb-1 text-sm text-gray-600">Préparation (min)</label>
            <input
              type="number"
              placeholder="ex: 15"
              value={prepTimeMinutes}
              onChange={(e) => setPrepTimeMinutes(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div className="flex-1">
            <label className="block mb-1 text-sm text-gray-600">Temps total (min)</label>
            <input
              type="number"
              placeholder="ex: 45"
              value={totalTimeMinutes}
              onChange={(e) => setTotalTimeMinutes(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
        </div>

        <input
          type="url"
          placeholder="Lien Cookidoo (optionnel)"
          value={cookidooUrl}
          onChange={(e) => setCookidooUrl(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
        />

        <div>
          <label className="block mb-2 text-sm text-gray-600">Ingrédients (un par ligne)</label>
          <textarea
            placeholder={"200g de farine\n2 œufs\n1 pincée de sel"}
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            rows={5}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm text-gray-600">Étapes de préparation</label>
          <textarea
            placeholder="Décris les étapes, une par ligne ou en paragraphes"
            value={steps}
            onChange={(e) => setSteps(e.target.value)}
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm text-gray-600">Photo de la recette</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={uploading}
          className="py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-black transition-colors disabled:opacity-50"
        >
          {uploading ? 'Enregistrement...' : 'Créer la recette'}
        </button>
      </form>
    </div>
  )
}
