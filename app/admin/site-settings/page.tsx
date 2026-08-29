'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AdminSiteSettings() {
  const [showParrainage, setShowParrainage] = useState(true)
  const [showClub, setShowClub] = useState(true)
  const [showConcours, setShowConcours] = useState(true)
  const [showPublicTestimonials, setShowPublicTestimonials] = useState(true)
  const [hideCookidooSteps, setHideCookidooSteps] = useState(false)
  const [instagramUrl, setInstagramUrl] = useState('')
  const [tiktokUrl, setTiktokUrl] = useState('')
  const [snapchatUrl, setSnapchatUrl] = useState('')
  const [menuGenerationLimit, setMenuGenerationLimit] = useState('3')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()
  const [menuPdfTagline, setMenuPdfTagline] = useState('')

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('*')
      .eq('id', 1)
      .single()
      .then(({ data }) => {
        if (data) {
          setShowParrainage(data.show_parrainage)
          setShowClub(data.show_club)
          setShowConcours(data.show_concours)
          setShowPublicTestimonials(data.show_public_testimonials ?? true)
          setHideCookidooSteps(data.hide_cookidoo_steps ?? false)
          setInstagramUrl(data.instagram_url ?? '')
          setTiktokUrl(data.tiktok_url ?? '')
          setSnapchatUrl(data.snapchat_url ?? '')
          setMenuGenerationLimit((data.menu_generation_limit ?? 3).toString())
          setMenuPdfTagline(data.menu_pdf_tagline ?? 'Idées gourmandes pour simplifier le quotidien')
        }
        setLoading(false)
      })
  }, [])

  const handleSaveTagline = async () => {
  setSaving(true)
  setMessage('')
  const { error } = await supabase.from('site_settings').update({ menu_pdf_tagline: menuPdfTagline }).eq('id', 1)
  setSaving(false)
  setMessage(error ? error.message : 'Phrase enregistrée')
}

  const toggle = async (field: string, value: boolean, setter: (v: boolean) => void) => {
    setter(value)
    setMessage('')
    const { error } = await supabase.from('site_settings').update({ [field]: value }).eq('id', 1)
    setMessage(error ? error.message : 'Enregistré')
  }

  const handleSaveSocials = async () => {
    setSaving(true)
    setMessage('')
    const { error } = await supabase
      .from('site_settings')
      .update({
        instagram_url: instagramUrl || null,
        tiktok_url: tiktokUrl || null,
        snapchat_url: snapchatUrl || null,
      })
      .eq('id', 1)
    setSaving(false)
    setMessage(error ? error.message : 'Réseaux sociaux enregistrés')
  }

  const handleSaveMenuLimit = async () => {
    setSaving(true)
    setMessage('')
    const { error } = await supabase
      .from('site_settings')
      .update({ menu_generation_limit: parseInt(menuGenerationLimit) || 0 })
      .eq('id', 1)
    setSaving(false)
    setMessage(error ? error.message : 'Limite enregistrée')
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement...</div>

  const Row = ({
    label,
    checked,
    onChange,
  }: {
    label: string
    checked: boolean
    onChange: (v: boolean) => void
  }) => (
    <div className="flex justify-between items-center border border-gray-200 rounded-xl p-4">
      <span className="text-gray-900 font-medium">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`px-4 py-1.5 rounded-full text-sm font-medium ${
          checked ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'
        }`}
      >
        {checked ? 'Visible' : 'Masquée'}
      </button>
    </div>
  )

  return (
    <div className="p-6 sm:p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Visibilité des pages & réglages</h1>

      <div className="flex flex-col gap-3 mb-10">
        <Row
          label="Programme de parrainage"
          checked={showParrainage}
          onChange={(v) => toggle('show_parrainage', v, setShowParrainage)}
        />
        <Row
          label="Club Fondatrices"
          checked={showClub}
          onChange={(v) => toggle('show_club', v, setShowClub)}
        />
        <Row
          label="Grand Concours"
          checked={showConcours}
          onChange={(v) => toggle('show_concours', v, setShowConcours)}
        />
        <Row
          label="Page publique 'Laisser un avis'"
          checked={showPublicTestimonials}
          onChange={(v) => toggle('show_public_testimonials', v, setShowPublicTestimonials)}
        />
        <Row
          label="Masquer étapes/ingrédients Cookidoo (admin voit toujours tout)"
          checked={hideCookidooSteps}
          onChange={(v) => toggle('hide_cookidoo_steps', v, setHideCookidooSteps)}
        />
      </div>

      <h2 className="text-lg font-semibold text-gray-900 mb-3">Générateur de menu IA</h2>
      <div className="flex gap-2 mb-10">
        <input
          type="number"
          min="0"
          value={menuGenerationLimit}
          onChange={(e) => setMenuGenerationLimit(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
        />
        <button
          onClick={handleSaveMenuLimit}
          disabled={saving}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium disabled:opacity-50"
        >
          Enregistrer
        </button>
      </div>
      <p className="text-xs text-gray-400 -mt-8 mb-10">
        Nombre maximum de générations de menu par cliente (les comptes admin ne sont pas limités).
      </p>

      <h2 className="text-lg font-semibold text-gray-900 mb-3">Réseaux sociaux</h2>
      <div className="flex flex-col gap-3">
        <input
          placeholder="Lien Instagram"
          value={instagramUrl}
          onChange={(e) => setInstagramUrl(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        />
        <input
          placeholder="Lien TikTok"
          value={tiktokUrl}
          onChange={(e) => setTiktokUrl(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        />
        <input
          placeholder="Lien Snapchat"
          value={snapchatUrl}
          onChange={(e) => setSnapchatUrl(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        />
        <button
          onClick={handleSaveSocials}
          disabled={saving}
          className="py-2.5 bg-gray-900 text-white rounded-lg font-medium disabled:opacity-50"
        >
          {saving ? 'Enregistrement...' : 'Enregistrer les réseaux sociaux'}
        </button>
      </div>

      <h2 className="text-lg font-semibold text-gray-900 mb-3 mt-10">Phrase d'accroche du PDF menu</h2>
      <div className="flex gap-2">
        <input
          value={menuPdfTagline}
          onChange={(e) => setMenuPdfTagline(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
        />
        <button
          onClick={handleSaveTagline}
          disabled={saving}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium disabled:opacity-50"
        >
          Enregistrer
        </button>
      </div>

      {message && <p className="text-sm text-gray-700 mt-4">{message}</p>}
    </div>
  )
}