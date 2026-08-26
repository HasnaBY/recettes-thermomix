'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import imageCompression from 'browser-image-compression'
import TagSelect from '@/components/TagSelect'

type Recipe = {
  id: string
  title: string
  description: string
  category: string
  origin: string | null
  recipe_source: string | null
  prep_time_minutes: number | null
  total_time_minutes: number | null
  image_url: string | null
  status: string
  created_at: string
}

export default function Recettes() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('toutes')
  const [origin, setOrigin] = useState('toutes')
  const [source, setSource] = useState('toutes')
  const [isPublicPreview, setIsPublicPreview] = useState(false)
  const [accountPending, setAccountPending] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [qTitle, setQTitle] = useState('')
  const [qDescription, setQDescription] = useState('')
  const [qCategory, setQCategory] = useState('')
  const [qOrigin, setQOrigin] = useState('')
  const [qRecipeSource, setQRecipeSource] = useState('cookidoo')
  const [qPrepTime, setQPrepTime] = useState('')
  const [qTotalTime, setQTotalTime] = useState('')
  const [qCookidooUrl, setQCookidooUrl] = useState('')
  const [qIngredients, setQIngredients] = useState('')
  const [qSteps, setQSteps] = useState('')
  const [qPublished, setQPublished] = useState(true)
  const [qImageFile, setQImageFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const supabase = createClient()

  const loadRecipes = async (adminFlag: boolean) => {
    let query = supabase.from('recipes').select('*')
    if (!adminFlag) query = query.eq('status', 'published')
    const { data, error } = await query.order('created_at', { ascending: false })
    if (!error && data) setRecipes(data)
  }

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        setIsPublicPreview(true)
        const { data } = await supabase.from('recipes').select('*').eq('is_featured', true).eq('status', 'published')
        setRecipes(data ?? [])
        setLoading(false)
        return
      }

      const { data: profile } = await supabase.from('profiles').select('approved, is_admin').eq('id', userData.user.id).single()

      setIsAdmin(!!profile?.is_admin)

      if (!profile?.approved) {
        setAccountPending(true)
        setLoading(false)
        return
      }

      await loadRecipes(!!profile?.is_admin)
      setLoading(false)
    }
    load()
  }, [])

  const resetQuickAdd = () => {
    setQTitle('')
    setQDescription('')
    setQCategory('')
    setQOrigin('')
    setQRecipeSource('cookidoo')
    setQPrepTime('')
    setQTotalTime('')
    setQCookidooUrl('')
    setQIngredients('')
    setQSteps('')
    setQPublished(true)
    setQImageFile(null)
    setSaveError('')
  }

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaveError('')

    let imageUrl: string | null = null

    if (qImageFile) {
      try {
        const compressed = await imageCompression(qImageFile, {
          maxWidthOrHeight: 1200,
          maxSizeMB: 0.3,
          fileType: 'image/webp',
        })
        const fileName = `${Date.now()}-${qImageFile.name.replace(/\.[^.]+$/, '')}.webp`
        const { error: uploadError } = await supabase.storage.from('recipe-images').upload(fileName, compressed)
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('recipe-images').getPublicUrl(fileName)
        imageUrl = urlData.publicUrl
      } catch (err: any) {
        setSaveError('Erreur upload image : ' + err.message)
        setSaving(false)
        return
      }
    }

    const ingredientsList = qIngredients
      .split('\n')
      .map((i) => i.trim())
      .filter((i) => i !== '')

    const { error: insertError } = await supabase.from('recipes').insert({
      title: qTitle,
      description: qDescription,
      category: qCategory,
      origin: qOrigin || null,
      recipe_source: qRecipeSource,
      prep_time_minutes: qPrepTime ? parseInt(qPrepTime) : null,
      total_time_minutes: qTotalTime ? parseInt(qTotalTime) : null,
      cookidoo_url: qCookidooUrl || null,
      ingredients: ingredientsList.length > 0 ? ingredientsList : null,
      steps: qSteps || null,
      is_featured: false,
      status: qPublished ? 'published' : 'draft',
      image_url: imageUrl,
    })

    setSaving(false)

    if (insertError) {
      setSaveError(insertError.message)
    } else {
      resetQuickAdd()
      setShowQuickAdd(false)
      await loadRecipes(isAdmin)
    }
  }

  const categories = ['toutes', ...new Set(recipes.map((r) => r.category).filter((c): c is string => Boolean(c)))]
  const origins = ['toutes', ...new Set(recipes.map((r) => r.origin).filter((o): o is string => Boolean(o)))]

  const filtered = recipes.filter((recipe) => {
    const matchesSearch = recipe.title.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = category === 'toutes' || recipe.category === category
    const matchesOrigin = origin === 'toutes' || recipe.origin === origin
    const matchesSource = source === 'toutes' || recipe.recipe_source === source
    return matchesSearch && matchesCategory && matchesOrigin && matchesSource
  })

  if (loading) {
    return <div className="p-8 text-center text-[#3A3532]/60">Chargement...</div>
  }

  if (accountPending) {
    return (
      <div className="p-8 max-w-md mx-auto text-center text-[#3A3532]/70">
        Ton compte est en attente de validation. Tu recevras un accès prochainement.
      </div>
    )
  }

  const sourceBadge = (recipeSource: string | null) => {
    if (recipeSource === 'creation') {
      return <span className="text-xs px-2 py-0.5 rounded-full bg-[#F6DEE1]/60 text-[#3A3532]">👩‍🍳 Ma création</span>
    }
    return <span className="text-xs px-2 py-0.5 rounded-full bg-[#DCEAF0]/60 text-[#3A3532]">📱 Cookidoo</span>
  }

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
        <h1 className="font-display text-3xl text-[#3A3532]">Mes recettes</h1>
        {isAdmin && (
          <button
            onClick={() => setShowQuickAdd((v) => !v)}
            className="text-sm px-4 py-2 bg-[#3A3532] text-[#FDFBF6] rounded-full font-medium"
          >
            {showQuickAdd ? 'Fermer' : '+ Ajouter une recette'}
          </button>
        )}
      </div>

      {isPublicPreview && (
        <div className="border border-[#C9A44C] bg-[#F6DEE1]/20 rounded-2xl p-4 mb-8">
          <p className="text-[#3A3532]/80 text-sm mb-3">
            Voici un aperçu de mes recettes. Connecte-toi pour accéder à toutes les recettes, avec ingrédients et étapes complètes.
          </p>
          <Link
            href="/login"
            className="inline-block px-5 py-2 bg-[#3A3532] text-[#FDFBF6] rounded-full text-sm font-medium hover:bg-[#2A2622] transition-colors no-underline border border-[#C9A44C]"
          >
            Se connecter
          </Link>
        </div>
      )}

      {isAdmin && showQuickAdd && (
        <form onSubmit={handleQuickAdd} className="border border-[#C9A44C] bg-white rounded-2xl p-5 mb-8 flex flex-col gap-3">
          <h2 className="font-display text-lg text-[#3A3532]">Nouvelle recette</h2>

          <input
            placeholder="Titre"
            value={qTitle}
            onChange={(e) => setQTitle(e.target.value)}
            required
            className="px-4 py-2 border border-gray-300 rounded-lg"
          />
          <textarea
            placeholder="Description"
            value={qDescription}
            onChange={(e) => setQDescription(e.target.value)}
            rows={2}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          />

          <TagSelect table="recipe_categories" value={qCategory} onChange={setQCategory} placeholder="Choisir une catégorie" />
          <TagSelect table="recipe_origins" value={qOrigin} onChange={setQOrigin} placeholder="Choisir une origine (optionnel)" />

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block mb-1 text-sm text-gray-600">Préparation (min)</label>
              <input
                type="number"
                value={qPrepTime}
                onChange={(e) => setQPrepTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="flex-1">
              <label className="block mb-1 text-sm text-gray-600">Temps total (min)</label>
              <input
                type="number"
                value={qTotalTime}
                onChange={(e) => setQTotalTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block mb-1 text-sm text-gray-600">Type de recette</label>
            <select
              value={qRecipeSource}
              onChange={(e) => setQRecipeSource(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="cookidoo">📱 Recette Cookidoo</option>
              <option value="creation">👩‍🍳 Ma création personnelle</option>
            </select>
          </div>

          <input
            type="url"
            placeholder="Lien Cookidoo (optionnel)"
            value={qCookidooUrl}
            onChange={(e) => setQCookidooUrl(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          />

          <div>
            <label className="block mb-1 text-sm text-gray-600">Ingrédients (un par ligne)</label>
            <textarea
              value={qIngredients}
              onChange={(e) => setQIngredients(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm text-gray-600">Étapes de préparation</label>
            <textarea
              value={qSteps}
              onChange={(e) => setQSteps(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm text-gray-600">Photo</label>
            <input type="file" accept="image/*" onChange={(e) => setQImageFile(e.target.files?.[0] ?? null)} />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={qPublished} onChange={(e) => setQPublished(e.target.checked)} />
            Publier immédiatement (sinon reste en brouillon)
          </label>

          {saveError && <p className="text-red-600 text-sm">{saveError}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="py-2.5 px-6 bg-[#3A3532] text-[#FDFBF6] rounded-full font-medium disabled:opacity-50"
            >
              {saving ? 'Enregistrement...' : 'Créer la recette'}
            </button>
            <button
              type="button"
              onClick={() => {
                resetQuickAdd()
                setShowQuickAdd(false)
              }}
              className="py-2.5 px-6 border border-gray-300 rounded-full font-medium"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-8 flex-wrap">
        <input
          type="text"
          placeholder="Rechercher une recette..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[160px] px-4 py-2 border border-[#F0EAE0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9A44C]"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-2 border border-[#F0EAE0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9A44C]"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat === 'toutes' ? 'Toutes les catégories' : cat}
            </option>
          ))}
        </select>

        <select
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          className="px-4 py-2 border border-[#F0EAE0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9A44C]"
        >
          {origins.map((o) => (
            <option key={o} value={o}>
              {o === 'toutes' ? 'Toutes les origines' : o}
            </option>
          ))}
        </select>

        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="px-4 py-2 border border-[#F0EAE0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9A44C]"
        >
          <option value="toutes">Toutes les sources</option>
          <option value="cookidoo">📱 Cookidoo</option>
          <option value="creation">👩‍🍳 Mes créations</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-[#3A3532]/60">Aucune recette ne correspond à ta recherche.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((recipe) => (
            <div key={recipe.id} className="relative">
              <Link
                href={`/recipes/${recipe.id}`}
                className="block rounded-2xl border border-[#F0EAE0] bg-white overflow-hidden hover:shadow-md transition-shadow no-underline text-inherit"
              >
                {recipe.image_url ? (
                  <img src={recipe.image_url} alt={recipe.title} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-[#F6DEE1]/30 flex items-center justify-center text-[#3A3532]/40 text-sm">
                    Pas de photo
                  </div>
                )}
                <div className="p-4">
                  <div className="mb-2 flex gap-2 flex-wrap">
                    {sourceBadge(recipe.recipe_source)}
                    {recipe.status === 'draft' && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Brouillon</span>
                    )}
                  </div>
                  <h2 className="font-display text-lg text-[#3A3532] mb-1">{recipe.title}</h2>
                  <p className="text-[#3A3532]/70 text-sm mb-2 line-clamp-2">{recipe.description}</p>
                  <p className="text-xs text-[#3A3532]/50">
                    {recipe.category}
                    {recipe.origin && ` · ${recipe.origin}`}
                    {recipe.total_time_minutes && ` · ${recipe.total_time_minutes} min au total`}
                  </p>
                </div>
              </Link>

              {isAdmin && (
                <Link
                  href={`/admin/edit-recipe/${recipe.id}`}
                  className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-white/95 rounded-full shadow no-underline text-sm"
                  aria-label="Modifier cette recette"
                >
                  ✏️
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}