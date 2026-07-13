'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import imageCompression from 'browser-image-compression'

type Entry = { id: string; user_id: string; image_urls: string[]; comment: string | null; created_at: string }
type RecipeList = { id: string; title: string }
type Recipe = { id: string; title: string }

async function uploadCompressed(supabase: any, file: File, prefix: string) {
  const compressed = await imageCompression(file, {
    maxWidthOrHeight: 1200,
    maxSizeMB: 0.3,
    fileType: 'image/webp',
  })
  const fileName = `${prefix}-${Date.now()}.webp`
  const { error } = await supabase.storage.from('site-images').upload(fileName, compressed)
  if (error) throw error
  const { data } = supabase.storage.from('site-images').getPublicUrl(fileName)
  return data.publicUrl as string
}

export default function AdminChallenge() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [active, setActive] = useState(true)

  const [linkType, setLinkType] = useState<'none' | 'list' | 'recipes'>('none')
  const [recipeListId, setRecipeListId] = useState('')
  const [recipeIds, setRecipeIds] = useState<string[]>([])
  const [allLists, setAllLists] = useState<RecipeList[]>([])
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([])
  const [recipeToAdd, setRecipeToAdd] = useState('')

  const [descriptionImages, setDescriptionImages] = useState<string[]>([])
  const [newDescImageFile, setNewDescImageFile] = useState<File | null>(null)

  const [rewardText, setRewardText] = useState('')
  const [rewardImageUrl, setRewardImageUrl] = useState<string | null>(null)
  const [rewardImageFile, setRewardImageFile] = useState<File | null>(null)

  const [bannerTopUrl, setBannerTopUrl] = useState<string | null>(null)
  const [bannerTopFile, setBannerTopFile] = useState<File | null>(null)
  const [bannerBottomUrl, setBannerBottomUrl] = useState<string | null>(null)
  const [bannerBottomFile, setBannerBottomFile] = useState<File | null>(null)

  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()

  const loadEntries = async () => {
    const { data } = await supabase
      .from('challenge_entries')
      .select('*')
      .order('created_at', { ascending: false })
    setEntries(data ?? [])
  }

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
          setActive(data.active ?? true)
          setRecipeListId(data.recipe_list_id ?? '')
          setRecipeIds(data.recipe_ids ?? [])
          setDescriptionImages(data.description_images ?? [])
          setRewardText(data.reward_text ?? '')
          setRewardImageUrl(data.reward_image_url)
          setBannerTopUrl(data.banner_top_url)
          setBannerBottomUrl(data.banner_bottom_url)
          setLinkType(data.recipe_list_id ? 'list' : data.recipe_ids?.length ? 'recipes' : 'none')
        }
        setLoading(false)
      })

    supabase.from('recipe_lists').select('id, title').order('title').then(({ data }) => setAllLists(data ?? []))
    supabase.from('recipes').select('id, title').order('title').then(({ data }) => setAllRecipes(data ?? []))

    loadEntries()
  }, [])

  const addRecipeToLink = () => {
    if (!recipeToAdd || recipeIds.includes(recipeToAdd)) return
    setRecipeIds((prev) => [...prev, recipeToAdd])
    setRecipeToAdd('')
  }

  const removeRecipeFromLink = (id: string) => {
    setRecipeIds((prev) => prev.filter((r) => r !== id))
  }

  const addDescriptionImage = async () => {
    if (!newDescImageFile) return
    try {
      const url = await uploadCompressed(supabase, newDescImageFile, 'challenge-desc')
      setDescriptionImages((prev) => [...prev, url])
      setNewDescImageFile(null)
    } catch (err: any) {
      setMessage('Erreur upload : ' + err.message)
    }
  }

  const removeDescriptionImage = (url: string) => {
    setDescriptionImages((prev) => prev.filter((u) => u !== url))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      let finalRewardImageUrl = rewardImageUrl
      if (rewardImageFile) {
        finalRewardImageUrl = await uploadCompressed(supabase, rewardImageFile, 'challenge-reward')
      }

      let finalBannerTopUrl = bannerTopUrl
      if (bannerTopFile) {
        finalBannerTopUrl = await uploadCompressed(supabase, bannerTopFile, 'challenge-banner-top')
      }

      let finalBannerBottomUrl = bannerBottomUrl
      if (bannerBottomFile) {
        finalBannerBottomUrl = await uploadCompressed(supabase, bannerBottomFile, 'challenge-banner-bottom')
      }

      const { error } = await supabase
        .from('monthly_challenge')
        .update({
          title,
          description,
          active,
          recipe_list_id: linkType === 'list' ? recipeListId || null : null,
          recipe_ids: linkType === 'recipes' ? recipeIds : null,
          description_images: descriptionImages,
          reward_text: rewardText || null,
          reward_image_url: finalRewardImageUrl,
          banner_top_url: finalBannerTopUrl,
          banner_bottom_url: finalBannerBottomUrl,
        })
        .eq('id', 1)

      if (error) throw error

      setRewardImageUrl(finalRewardImageUrl)
      setBannerTopUrl(finalBannerTopUrl)
      setBannerBottomUrl(finalBannerBottomUrl)
      setRewardImageFile(null)
      setBannerTopFile(null)
      setBannerBottomFile(null)
      setMessage('Enregistré avec succès !')
    } catch (err: any) {
      setMessage(err.message)
    } finally {
      setSaving(false)
    }
  }

  const deletePhotoFromEntry = async (entry: Entry, photoUrl: string) => {
    const remaining = entry.image_urls.filter((u) => u !== photoUrl)

    if (remaining.length === 0) {
      if (!confirm('Supprimer aussi cette participation (plus aucune photo) ?')) return
      await supabase.from('challenge_entries').delete().eq('id', entry.id)
    } else {
      await supabase.from('challenge_entries').update({ image_urls: remaining }).eq('id', entry.id)
    }
    loadEntries()
  }

  const deleteEntry = async (id: string) => {
    if (!confirm('Supprimer toute cette participation ?')) return
    await supabase.from('challenge_entries').delete().eq('id', id)
    loadEntries()
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement...</div>

  const selectedRecipeObjects = allRecipes.filter((r) => recipeIds.includes(r.id))

  return (
    <div className="p-6 sm:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Gérer le challenge du mois</h1>

      <form onSubmit={handleSave} className="flex flex-col gap-6 mb-10">
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
            Photos dans la description
          </label>
          <div className="grid grid-cols-3 gap-2 mb-2">
            {descriptionImages.map((url) => (
              <div key={url}>
                <img src={url} className="w-full h-20 object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={() => removeDescriptionImage(url)}
                  className="text-xs text-red-600 mt-1"
                >
                  Supprimer
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setNewDescImageFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={addDescriptionImage}
              disabled={!newDescImageFile}
              className="px-3 py-1 bg-gray-900 text-white rounded-lg text-sm disabled:opacity-50"
            >
              Ajouter
            </button>
          </div>
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">Lien vers des recettes</label>
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setLinkType('none')}
              className={`px-3 py-1.5 rounded-full text-sm ${linkType === 'none' ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}
            >
              Aucun
            </button>
            <button
              type="button"
              onClick={() => setLinkType('list')}
              className={`px-3 py-1.5 rounded-full text-sm ${linkType === 'list' ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}
            >
              Une liste de recettes
            </button>
            <button
              type="button"
              onClick={() => setLinkType('recipes')}
              className={`px-3 py-1.5 rounded-full text-sm ${linkType === 'recipes' ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}
            >
              Recettes individuelles
            </button>
          </div>

          {linkType === 'list' && (
            <select
              value={recipeListId}
              onChange={(e) => setRecipeListId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Choisir une liste...</option>
              {allLists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </select>
          )}

          {linkType === 'recipes' && (
            <div>
              <div className="flex gap-2 mb-2">
                <select
                  value={recipeToAdd}
                  onChange={(e) => setRecipeToAdd(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Choisir une recette à ajouter...</option>
                  {allRecipes
                    .filter((r) => !recipeIds.includes(r.id))
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={addRecipeToLink}
                  disabled={!recipeToAdd}
                  className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-sm disabled:opacity-50"
                >
                  Ajouter
                </button>
              </div>
              <div className="flex flex-col gap-1">
                {selectedRecipeObjects.map((r) => (
                  <div key={r.id} className="flex justify-between items-center bg-gray-50 rounded px-3 py-1.5">
                    <span className="text-sm">{r.title}</span>
                    <button
                      type="button"
                      onClick={() => removeRecipeFromLink(r.id)}
                      className="text-xs text-red-600"
                    >
                      Retirer
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border border-gray-200 rounded-xl p-4">
          <h3 className="font-medium text-gray-900 mb-3">🎁 Récompense</h3>
          <textarea
            placeholder="Description de la récompense"
            value={rewardText}
            onChange={(e) => setRewardText(e.target.value)}
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-2"
          />
          {rewardImageUrl && (
            <img src={rewardImageUrl} className="w-full h-32 object-cover rounded-lg mb-2" />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setRewardImageFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <div className="border border-gray-200 rounded-xl p-4">
          <h3 className="font-medium text-gray-900 mb-3">Bannière du haut</h3>
          {bannerTopUrl && <img src={bannerTopUrl} className="w-full h-24 object-cover rounded-lg mb-2" />}
          <input type="file" accept="image/*" onChange={(e) => setBannerTopFile(e.target.files?.[0] ?? null)} />
        </div>

        <div className="border border-gray-200 rounded-xl p-4">
          <h3 className="font-medium text-gray-900 mb-3">Bannière du bas</h3>
          {bannerBottomUrl && <img src={bannerBottomUrl} className="w-full h-24 object-cover rounded-lg mb-2" />}
          <input type="file" accept="image/*" onChange={(e) => setBannerBottomFile(e.target.files?.[0] ?? null)} />
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
                <div key={i} className="relative">
                  <img src={url} alt="" className="w-full h-24 object-cover rounded-lg" />
                  <button
                    onClick={() => deletePhotoFromEntry(e, url)}
                    className="absolute top-1 right-1 bg-white/90 text-red-600 text-xs px-1.5 py-0.5 rounded"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            {e.comment && <p className="text-xs text-gray-500">{e.comment}</p>}
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-gray-400">{new Date(e.created_at).toLocaleDateString('fr-FR')}</p>
              <button onClick={() => deleteEntry(e.id)} className="text-xs text-red-600">
                Supprimer toute la participation
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
