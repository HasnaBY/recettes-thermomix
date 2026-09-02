'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import imageCompression from 'browser-image-compression'
import ImageCropper from '@/components/ImageCropper'
import { MENU_PHOTO_ASPECT } from '@/lib/pdfImageAspect'

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
  const [isFeatured, setIsFeatured] = useState(false)

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [rawFileToCrop, setRawFileToCrop] = useState<File | null>(null)

  const [menuImageFile, setMenuImageFile] = useState<File | null>(null)
  const [rawMenuFileToCrop, setRawMenuFileToCrop] = useState<File | null>(null)
  const [menuImagePreview, setMenuImagePreview] = useState<string | null>(null)

  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const uploadImage = async (file: File, prefix: string) => {
    const compressed = await imageCompression(file, {
      maxWidthOrHeight: 1200,
      maxSizeMB: 0.3,
      fileType: 'image/webp',
    })
    const fileName = `${prefix}-${Date.now()}.webp`
    const { error: uploadError } = await supabase.storage.from('recipe-images').upload(fileName, compressed)
    if (uploadError) throw uploadError
    const { data: urlData } = supabase.storage.from('recipe-images').getPublicUrl(fileName)
    return urlData.publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)
    setError('')

    let imageUrl = null
    let menuImageUrl = null

    try {
      if (imageFile) imageUrl = await uploadImage(imageFile, 'recipe')
      if (menuImageFile) menuImageUrl = await uploadImage(menuImageFile, 'menu')
    } catch (err: any) {
      setError('Erreur upload image : ' + err.message)
      setUploading(false)
      return
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
      is_featured: isFeatured,
      image_url: imageUrl,
      menu_image_url: menuImageUrl,
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

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
          Mettre en avant (visible publiquement, sans connexion)
        </label>

        <div className="border-t border-gray-200 pt-4">
          <label className="block mb-2 text-sm text-gray-600">Photo principale (site)</label>
          {imageFile && <p className="text-xs text-green-700 mb-1">✓ Photo recadrée prête</p>}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) setRawFileToCrop(file)
            }}
          />
        </div>

        <div className="border-t border-gray-200 pt-4">
          <label className="block mb-2 text-sm text-gray-600">
            Photo dédiée au PDF menu (optionnel — sinon la photo principale sera utilisée)
          </label>
          {menuImagePreview && (
            <img src={menuImagePreview} alt="" className="w-full max-w-xs h-24 object-cover rounded-lg mb-2" />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) setRawMenuFileToCrop(file)
            }}
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

      {rawFileToCrop && (
        <ImageCropper
          file={rawFileToCrop}
          aspect={4 / 3}
          onConfirm={(cropped) => {
            setImageFile(cropped)
            setRawFileToCrop(null)
          }}
          onCancel={() => setRawFileToCrop(null)}
        />
      )}

      {rawMenuFileToCrop && (
        <ImageCropper
          file={rawMenuFileToCrop}
          aspect={MENU_PHOTO_ASPECT}
          onConfirm={(cropped) => {
            setMenuImageFile(cropped)
            setMenuImagePreview(URL.createObjectURL(cropped))
            setRawMenuFileToCrop(null)
          }}
          onCancel={() => setRawMenuFileToCrop(null)}
        />
      )}
    </div>
  )
}