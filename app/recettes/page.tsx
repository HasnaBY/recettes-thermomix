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

type AddMode = 'manual' | 'import' | 'creator'

export default function Recettes() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('toutes')
  const [origin, setOrigin] = useState('toutes')
  const [source, setSource] = useState('toutes')
  const [statusFilter, setStatusFilter] = useState('toutes')
  const [isPublicPreview, setIsPublicPreview] = useState(false)
  const [accountPending, setAccountPending] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  const [aiFeatures, setAiFeatures] = useState({
    recipe_import_enabled: false,
    recipe_creator_enabled: false,
    auto_tagging_enabled: false,
  })

  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [addMode, setAddMode] = useState<AddMode>('manual')

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
  const [tagging, setTagging] = useState(false)
  const [computingTime, setComputingTime] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const [importMode, setImportMode] = useState<'url' | 'text'>('url')
  const [importUrl, setImportUrl] = useState('')
  const [importText, setImportText] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [importError, setImportError] = useState('')

  const [rawIdea, setRawIdea] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState('')

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

      if (profile?.is_admin) {
        const { data: features } = await supabase
          .from('ai_features')
          .select('recipe_import_enabled, recipe_creator_enabled, auto_tagging_enabled')
          .eq('id', 1)
          .single()
        if (features) setAiFeatures(features as any)
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
    setImportUrl('')
    setImportText('')
    setImportError('')
    setRawIdea('')
    setGenerateError('')
    setAddMode('manual')
  }

  const handleAutoTag = async () => {
    setTagging(true)
    setSaveError('')
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const response = await fetch('/api/tag-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({
          title: qTitle,
          description: qDescription,
          ingredients: qIngredients.split('\n').filter((i) => i.trim() !== ''),
        }),
      })
      const data = await response.json()
      if (response.ok) {
        setQCategory(data.category ?? qCategory)
        if (data.origin) setQOrigin(data.origin)
        if (data.description) setQDescription(data.description)
      } else {
        setSaveError(data.error)
      }
    } finally {
      setTagging(false)
    }
  }

  const handleComputeTime = async () => {
    setComputingTime(true)
    setSaveError('')
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const response = await fetch('/api/compute-recipe-time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ steps: qSteps }),
      })
      const data = await response.json()
      if (response.ok) {
        setQTotalTime(data.total_time_minutes?.toString() ?? qTotalTime)
      } else {
        setSaveError(data.error)
      }
    } finally {
      setComputingTime(false)
    }
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

  const fillManualFromExtracted = (data: any, sourceUrl?: string) => {
    setQTitle(data.title ?? '')
    setQDescription(data.description ?? '')
    setQCategory(data.category ?? '')
    setQOrigin(data.origin ?? '')
    setQPrepTime(data.prep_time_minutes?.toString() ?? '')
    setQTotalTime(data.total_time_minutes?.toString() ?? '')
    setQIngredients((data.ingredients ?? []).join('\n'))
    setQSteps(data.steps ?? '')
    if (sourceUrl) setQCookidooUrl(sourceUrl)
    setQPublished(false)
    setAddMode('manual')
  }

  const handleImportExtract = async () => {
    setExtracting(true)
    setImportError('')
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const response = await fetch('/api/import-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify(importMode === 'url' ? { url: importUrl } : { rawText: importText }),
      })
      const data = await response.json()

      if (!response.ok) {
        setImportError(data.error)
        return
      }

      fillManualFromExtracted(data, importMode === 'url' ? importUrl : undefined)
    } catch (err: any) {
      setImportError(err.message)
    } finally {
      setExtracting(false)
    }
  }

  const handleGenerateFromIdea = async () => {
    setGenerating(true)
    setGenerateError('')
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

      if (!response.ok) {
        setGenerateError(data.error)
        return
      }

      setQTitle(data.title ?? '')
      setQDescription(data.description ?? '')
      setQCategory(data.category ?? '')
      setQPrepTime(data.prep_time_minutes?.toString() ?? '')
      setQTotalTime(data.total_time_minutes?.toString() ?? '')
      setQIngredients((data.ingredients ?? []).join('\n'))
      setQSteps(data.steps ?? '')
      setQRecipeSource('creation')
      setQPublished(false)
      setAddMode('manual')
    } catch (err: any) {
      setGenerateError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const categories = ['toutes', ...new Set(recipes.map((r) => r.category).filter((c): c is string => Boolean(c)))]
  const origins = ['toutes', ...new Set(recipes.map((r) => r.origin).filter((o): o is string => Boolean(o)))]

  const filtered = recipes.filter((recipe) => {
    const matchesSearch = recipe.title.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = category === 'toutes' || recipe.category === category
    const matchesOrigin = origin === 'toutes' || recipe.origin === origin
    const matchesSource = source === 'toutes' || recipe.recipe_source === source
    const matchesStatus = statusFilter === 'toutes' || recipe.status === statusFilter
    return matchesSearch && matchesCategory && matchesOrigin && matchesSource && matchesStatus
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
        <div className="border border-[#C9A44C] bg-white rounded-2xl p-5 mb-8">
          <div className="flex gap-2 mb-4 flex-wrap">
            <button
              type="button"
              onClick={() => setAddMode('manual')}
              className={`px-3 py-1.5 rounded-full text-sm ${addMode === 'manual' ? 'bg-[#3A3532] text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              ✍️ Saisie manuelle
            </button>
            {aiFeatures.recipe_import_enabled && (
              <button
                type="button"
                onClick={() => setAddMode('import')}
                className={`px-3 py-1.5 rounded-full text-sm ${addMode === 'import' ? 'bg-[#3A3532] text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                📥 Importer (lien/texte)
              </button>
            )}
            {aiFeatures.recipe_creator_enabled && (
              <button
                type="button"
                onClick={() => setAddMode('creator')}
                className={`px-3 py-1.5 rounded-full text-sm ${addMode === 'creator' ? 'bg-[#3A3532] text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                🧠 Créer depuis des ingrédients
              </button>
            )}
          </div>

          {addMode === 'import' && (
            <div className="flex flex-col gap-3 mb-4 pb-4 border-b border-gray-200">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setImportMode('url')}
                  className={`px-3 py-1 rounded-full text-xs ${importMode === 'url' ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}
                >
                  Depuis un lien
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode('text')}
                  className={`px-3 py-1 rounded-full text-xs ${importMode === 'text' ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}
                >
                  Depuis un texte collé
                </button>
              </div>

              {importMode === 'url' ? (
                <input
                  placeholder="https://cookidoo.fr/recipes/recipe/..."
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                />
              ) : (
                <textarea
                  placeholder="Colle ici le texte complet de la recette"
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  rows={6}
                  className="px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                />
              )}

              {importError && <p className="text-red-600 text-sm">{importError}</p>}

              <button
                type="button"
                onClick={handleImportExtract}
                disabled={extracting || (importMode === 'url' ? !importUrl : importText.trim().length < 20)}
                className="self-start py-2 px-5 bg-gray-900 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {extracting ? 'Extraction en cours...' : 'Extraire et pré-remplir le formulaire'}
              </button>
            </div>
          )}

          {addMode === 'creator' && (
            <div className="flex flex-col gap-3 mb-4 pb-4 border-b border-gray-200">
              <textarea
                placeholder="Décris ton idée ou tes ingrédients bruts (ex: poulet, curry, lait de coco, envie d'un plat asiatique rapide)"
                value={rawIdea}
                onChange={(e) => setRawIdea(e.target.value)}
                rows={4}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              />
              {generateError && <p className="text-red-600 text-sm">{generateError}</p>}
              <button
                type="button"
                onClick={handleGenerateFromIdea}
                disabled={generating || !rawIdea}
                className="self-start py-2 px-5 bg-gray-900 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {generating ? 'Génération en cours...' : 'Générer et pré-remplir le formulaire'}
              </button>
            </div>
          )}

          <form onSubmit={handleQuickAdd} className="flex flex-col gap-3">
            <h2 className="font-display text-lg text-[#3A3532]">
              {addMode === 'manual' ? 'Détails de la recette' : "Vérifie et complète avant d'enregistrer"}
            </h2>

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

            {aiFeatures.auto_tagging_enabled && (
              <button
                type="button"
                onClick={handleAutoTag}
                disabled={tagging || !qTitle}
                className="self-start text-sm text-gray-700 underline disabled:opacity-50"
              >
                {tagging ? 'Analyse...' : "🏷️ Suggérer description/catégorie/origine avec l'IA"}
              </button>
            )}

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
            <button
              type="button"
              onClick={handleComputeTime}
              disabled={computingTime || !qSteps}
              className="self-start -mt-1 text-sm text-gray-700 underline disabled:opacity-50"
            >
              {computingTime ? 'Calcul...' : '🧮 Calculer le temps total automatiquement (somme des étapes)'}
            </button>

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
        </div>
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

        {isAdmin && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-[#F0EAE0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9A44C]"
          >
            <option value="toutes">Publiées + brouillons</option>
            <option value="published">Publiées uniquement</option>
            <option value="draft">Brouillons uniquement</option>
          </select>
        )}
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