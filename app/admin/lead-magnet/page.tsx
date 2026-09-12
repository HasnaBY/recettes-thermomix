'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Recipe = { id: string; title: string; image_url: string | null }

export default function AdminLeadMagnet() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [selectedRecipeId, setSelectedRecipeId] = useState('')
  const [pageTitle, setPageTitle] = useState('')
  const [pageSubtitle, setPageSubtitle] = useState('')
  const [buttonLabel, setButtonLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: recipesData } = await supabase
        .from('recipes')
        .select('id, title, image_url')
        .eq('status', 'published')
        .order('title')
      setRecipes(recipesData ?? [])

      const { data: settings } = await supabase.from('lead_magnet_settings').select('*').eq('id', 1).single()
      if (settings) {
        setSelectedRecipeId(settings.recipe_id ?? '')
        setPageTitle(settings.page_title ?? '')
        setPageSubtitle(settings.page_subtitle ?? '')
        setButtonLabel(settings.button_label ?? '')
      }
    }
    load()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    const { error } = await supabase
      .from('lead_magnet_settings')
      .update({
        recipe_id: selectedRecipeId || null,
        page_title: pageTitle,
        page_subtitle: pageSubtitle,
        button_label: buttonLabel,
      })
      .eq('id', 1)
    setSaving(false)
    setMessage(error ? error.message : 'Enregistré avec succès !')
  }

  return (
    <div className="p-6 sm:p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Recette gratuite (lead magnet)</h1>
      <p className="text-gray-500 text-sm mb-6">
        Cette page est accessible à l'adresse <strong>/recette-gratuite</strong> — c'est le lien à partager sur tes réseaux sociaux.
      </p>

      <div className="flex flex-col gap-4">
        <div>
          <label className="block mb-1 text-sm text-gray-600">Recette offerte</label>
          <select
            value={selectedRecipeId}
            onChange={(e) => setSelectedRecipeId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">Choisir une recette</option>
            {recipes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 text-sm text-gray-600">Titre de la page</label>
          <input
            value={pageTitle}
            onChange={(e) => setPageTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm text-gray-600">Sous-titre</label>
          <textarea
            value={pageSubtitle}
            onChange={(e) => setPageSubtitle(e.target.value)}
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm text-gray-600">Texte du bouton</label>
          <input
            value={buttonLabel}
            onChange={(e) => setButtonLabel(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        {message && <p className="text-sm text-gray-700">{message}</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          className="py-2.5 bg-gray-900 text-white rounded-lg font-medium disabled:opacity-50"
        >
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>

      <p className="text-xs text-gray-400 mt-4">
        Pense aussi à ajouter un fond décoratif pour le PDF envoyé dans{' '}
        <a href="/admin/brand-photos" className="underline">
          Photos de marque
        </a>
        , sous "Fond décoratif du PDF recette offerte".
      </p>
    </div>
  )
}