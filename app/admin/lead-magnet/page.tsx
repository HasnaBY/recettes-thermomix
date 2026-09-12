'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Recipe = {
  id: string
  title: string
  image_url: string | null
  description: string | null
  ingredients: string[] | null
  prep_time_minutes: number | null
  total_time_minutes: number | null
}

export default function AdminLeadMagnet() {
  const [recipes, setRecipes] = useState<{ id: string; title: string }[]>([])
  const [selectedRecipeId, setSelectedRecipeId] = useState('')
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)

  const [pageTitle, setPageTitle] = useState('')
  const [pageSubtitle, setPageSubtitle] = useState('')
  const [buttonLabel, setButtonLabel] = useState('')

  const [pdfSubtitle, setPdfSubtitle] = useState('')
  const [pdfIntro, setPdfIntro] = useState('')
  const [servingSuggestions, setServingSuggestions] = useState('')
  const [ctaTitle, setCtaTitle] = useState('')
  const [ctaSubtitle, setCtaSubtitle] = useState('')

  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [generatingTexts, setGeneratingTexts] = useState(false)
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [aiWriterEnabled, setAiWriterEnabled] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: recipesData } = await supabase
        .from('recipes')
        .select('id, title')
        .eq('status', 'published')
        .order('title')
      setRecipes(recipesData ?? [])

      const { data: settings } = await supabase.from('lead_magnet_settings').select('*').eq('id', 1).single()
      if (settings) {
        setSelectedRecipeId(settings.recipe_id ?? '')
        setPageTitle(settings.page_title ?? '')
        setPageSubtitle(settings.page_subtitle ?? '')
        setButtonLabel(settings.button_label ?? '')
        setPdfSubtitle(settings.pdf_subtitle ?? '')
        setPdfIntro(settings.pdf_intro ?? '')
        setServingSuggestions(settings.pdf_serving_suggestions ?? '')
        setCtaTitle(settings.pdf_cta_title ?? '')
        setCtaSubtitle(settings.pdf_cta_subtitle ?? '')
        setPdfUrl(settings.pdf_url ?? null)
      }

      const { data: aiFeatures } = await supabase.from('ai_features').select('recipe_writer_enabled').eq('id', 1).single()
      setAiWriterEnabled(!!aiFeatures?.recipe_writer_enabled)
    }
    load()
  }, [])

  useEffect(() => {
    if (!selectedRecipeId) {
      setSelectedRecipe(null)
      return
    }
    supabase
      .from('recipes')
      .select('id, title, image_url, description, ingredients, prep_time_minutes, total_time_minutes')
      .eq('id', selectedRecipeId)
      .single()
      .then(({ data }) => setSelectedRecipe(data as any))
  }, [selectedRecipeId])

  const handleGenerateTexts = async () => {
    if (!selectedRecipe) {
      setMessage("Choisis d'abord une recette.")
      return
    }
    setGeneratingTexts(true)
    setMessage('')

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const response = await fetch('/api/generate-lead-magnet-texts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({
          recipeTitle: selectedRecipe.title,
          recipeDescription: selectedRecipe.description,
          ingredients: selectedRecipe.ingredients,
          prepTime: selectedRecipe.prep_time_minutes,
          totalTime: selectedRecipe.total_time_minutes,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage(data.error ?? 'Erreur lors de la génération')
      } else {
        setPageTitle(data.page_title ?? pageTitle)
        setPageSubtitle(data.page_subtitle ?? pageSubtitle)
        setButtonLabel(data.button_label ?? buttonLabel)
        setPdfSubtitle(data.pdf_subtitle ?? pdfSubtitle)
        setPdfIntro(data.pdf_intro ?? pdfIntro)
        setServingSuggestions(data.pdf_serving_suggestions ?? servingSuggestions)
        setCtaTitle(data.pdf_cta_title ?? ctaTitle)
        setCtaSubtitle(data.pdf_cta_subtitle ?? ctaSubtitle)
        setMessage('Textes générés — vérifie et ajuste-les avant d\'enregistrer.')
      }
    } catch (err: any) {
      setMessage('Erreur : ' + err.message)
    } finally {
      setGeneratingTexts(false)
    }
  }

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
        pdf_subtitle: pdfSubtitle,
        pdf_intro: pdfIntro,
        pdf_serving_suggestions: servingSuggestions,
        pdf_cta_title: ctaTitle,
        pdf_cta_subtitle: ctaSubtitle,
      })
      .eq('id', 1)
    setSaving(false)
    setMessage(error ? error.message : 'Textes enregistrés — pense à régénérer le PDF pour appliquer les changements.')
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
        <LeadMagnetPdfDocument
          recipe={recipe}
          backgroundImage={bg?.image_url ?? null}
          pdfSubtitle={pdfSubtitle}
          pdfIntro={pdfIntro}
          servingSuggestions={servingSuggestions}
          ctaTitle={ctaTitle}
          ctaSubtitle={ctaSubtitle}
        />
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

  const handleUploadOwnPdf = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setMessage('Le fichier doit être un PDF.')
      return
    }

    setUploadingPdf(true)
    setMessage('')

    try {
      const fileName = `lead-magnet-manual-${Date.now()}.pdf`
      const { error: uploadError } = await supabase.storage.from('lead-magnet-pdfs').upload(fileName, file, {
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
      setMessage('Ton PDF personnalisé a été enregistré avec succès !')
    } catch (err: any) {
      setMessage('Erreur : ' + err.message)
    } finally {
      setUploadingPdf(false)
    }
  }

  return (
    <div className="p-6 sm:p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Recette gratuite (lead magnet)</h1>
      <p className="text-gray-500 text-sm mb-6">
        Cette page est accessible à l'adresse <strong>/recette-gratuite</strong> — c'est le lien à partager sur tes réseaux sociaux.
      </p>

      <div className="mb-6">
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

      {aiWriterEnabled && (
        <button
          onClick={handleGenerateTexts}
          disabled={generatingTexts || !selectedRecipeId}
          className="w-full mb-8 py-2.5 border border-[#C9A44C] text-[#3A3532] rounded-lg font-medium disabled:opacity-50 bg-[#F6DEE1]/20"
        >
          {generatingTexts ? 'Génération en cours...' : "✨ Générer tous les textes avec l'IA"}
        </button>
      )}

      <h2 className="text-lg font-semibold text-gray-900 mb-3">Page web</h2>
      <div className="flex flex-col gap-4 mb-8">
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
      </div>

      <h2 className="text-lg font-semibold text-gray-900 mb-3">Contenu du PDF généré automatiquement</h2>
      <div className="flex flex-col gap-4 mb-4">
        <div>
          <label className="block mb-1 text-sm text-gray-600">Phrase accrocheuse</label>
          <input
            value={pdfSubtitle}
            onChange={(e) => setPdfSubtitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm text-gray-600">Phrase d'intro</label>
          <input
            value={pdfIntro}
            onChange={(e) => setPdfIntro(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm text-gray-600">Idées de dégustation (séparées par des •)</label>
          <input
            placeholder="Brioche • Crêpes • Fraises"
            value={servingSuggestions}
            onChange={(e) => setServingSuggestions(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm text-gray-600">Titre du bandeau final</label>
          <input
            value={ctaTitle}
            onChange={(e) => setCtaTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm text-gray-600">Sous-texte du bandeau final</label>
          <input
            value={ctaSubtitle}
            onChange={(e) => setCtaSubtitle(e.target.value)}
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

      <div className="border-t border-gray-200 pt-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Générer le PDF automatiquement</h2>
        <p className="text-gray-500 text-sm mb-4">
          Génère le PDF à partir des textes ci-dessus et de la recette choisie.
        </p>

        <button
          onClick={handleGeneratePdf}
          disabled={generatingPdf || !selectedRecipeId}
          className="py-2.5 px-6 bg-[#3A3532] text-white rounded-lg font-medium disabled:opacity-50"
        >
          {generatingPdf ? 'Génération...' : 'Générer / régénérer le PDF'}
        </button>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Ou uploader ton propre PDF</h2>
        <p className="text-gray-500 text-sm mb-4">
          Si tu préfères créer le visuel toi-même (Canva par exemple), uploade directement ton fichier ici — il remplacera le PDF généré automatiquement.
        </p>

        <input
          type="file"
          accept="application/pdf"
          disabled={uploadingPdf}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleUploadOwnPdf(file)
          }}
        />
        {uploadingPdf && <p className="text-xs text-gray-500 mt-2">Envoi en cours...</p>}
      </div>

      {pdfUrl && (
        
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-6 text-sm text-gray-700 underline"
        >
          📄 Voir le PDF actuellement configuré (envoyé aux prospects)
        </a>
      )}

      {message && <p className="text-sm text-gray-700 mt-4">{message}</p>}

      {!aiWriterEnabled && (
        <p className="text-xs text-gray-400 mt-4">
          💡 Active "Assistant rédaction" dans{' '}
          <a href="/admin/ai-settings" className="underline">
            les réglages IA
          </a>{' '}
          pour pouvoir générer ces textes automatiquement.
        </p>
      )}
    </div>
  )
}