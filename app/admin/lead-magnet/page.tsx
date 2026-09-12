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
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [generatingPdf, setGeneratingPdf] = useState(false)
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
        setPdfUrl(settings.pdf_url ?? null)
      }
    }
    load()
  }, [])

  const handleSaveTexts = async () => {
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
    setMessage(error ? error.message : 'Textes enregistrés — pense à régénérer le PDF si tu as changé de recette.')
  }

  const handleGeneratePdf = async () => {
    if (!selectedRecipeId) {
      setMessage("Choisis d'abord une recette avant de générer le PDF.")
      return
    }

    setGeneratingPdf(true)
    setMessage('')

    try {
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .select('title, description, image_url, ingredients, steps, prep_time_minutes, total_time_minutes')
        .eq('id', selectedRecipeId)
        .single()

      if (recipeError || !recipe) throw new Error('Recette introuvable')

      const { data: bg } = await supabase
        .from('brand_photos')
        .select('image_url')
        .eq('key', 'lead_magnet_pdf_background')
        .single()

      const { pdf } = await import('@react-pdf/renderer')
      const { default: LeadMagnetPdfDocument } = await import('@/lib/pdf/LeadMagnetPdfDocument')

      const blob = await pdf(
        <LeadMagnetPdfDocument recipe={recipe} backgroundImage={bg?.image_url ?? null} />
      ).toBlob()

      const fileName = `lead-magnet-${Date.now()}.pdf`
      const { error: uploadError } = await supabase.storage.from('lead-magnet-pdfs').upload(fileName, blob, {
        contentType: 'application/pdf',
      })
      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage.from('lead-magnet-pdfs').getPublicUrl(fileName)

      const { error: updateError } = await supabase
        .from('lead_magnet_settings')
        .update({ pdf_url: publicUrlData.publicUrl })
        .eq('id', 1)
      if (updateError) throw updateError

      setPdfUrl(publicUrlData.publicUrl)
      setMessage('PDF généré et enregistré avec succès !')
    } catch (err: any) {
      setMessage('Erreur : ' + err.message)
    } finally {
      setGeneratingPdf(false)
    }
  }

  return (
    <div className="p-6 sm:p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Recette gratuite (lead magnet)</h1>
      <p className="text-gray-500 text-sm mb-6">
        Cette page est accessible à l'adresse <strong>/recette-gratuite</strong> — c'est le lien à partager sur tes réseaux sociaux.
      </p>

      <div className="flex flex-col gap-4 mb-8">
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

        <button
          onClick={handleSaveTexts}
          disabled={saving}
          className="py-2.5 bg-gray-900 text-white rounded-lg font-medium disabled:opacity-50"
        >
          {saving ? 'Enregistrement...' : 'Enregistrer les textes'}
        </button>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">PDF envoyé aux prospects</h2>
        <p className="text-gray-500 text-sm mb-4">
          Génère le PDF une fois — il sera ensuite envoyé tel quel à chaque nouvelle demande, sans regénération. Régénère-le uniquement si tu changes de recette ou de fond.
        </p>

        {pdfUrl ? (
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-block mb-4 text-sm text-gray-700 underline">
            📄 Voir le PDF actuellement configuré
          </a>
        ) : (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            Aucun PDF n'est encore généré — la page /recette-gratuite ne fonctionnera pas tant que tu n'as pas cliqué sur le bouton ci-dessous.
          </p>
        )}

        <button
          onClick={handleGeneratePdf}
          disabled={generatingPdf || !selectedRecipeId}
          className="py-2.5 px-6 bg-[#3A3532] text-white rounded-lg font-medium disabled:opacity-50"
        >
          {generatingPdf ? 'Génération...' : 'Générer / régénérer le PDF'}
        </button>
      </div>

      {message && <p className="text-sm text-gray-700 mt-4">{message}</p>}

      <p className="text-xs text-gray-400 mt-6">
        Pense aussi à ajouter un fond décoratif pour le PDF dans{' '}
        <a href="/admin/brand-photos" className="underline">
          Photos de marque
        </a>
        , sous "Fond décoratif du PDF recette offerte", avant de générer.
      </p>
    </div>
  )
}