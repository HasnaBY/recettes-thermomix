'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AdminSiteSettings() {
  const [showParrainage, setShowParrainage] = useState(true)
  const [showClub, setShowClub] = useState(true)
  const [showConcours, setShowConcours] = useState(true)
  const [showPublicTestimonials, setShowPublicTestimonials] = useState(true)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const supabase = createClient()

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
        }
        setLoading(false)
      })
  }, [])

  const toggle = async (field: string, value: boolean, setter: (v: boolean) => void) => {
    setter(value)
    setMessage('')
    const { error } = await supabase.from('site_settings').update({ [field]: value }).eq('id', 1)
    setMessage(error ? error.message : 'Enregistré')
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Visibilité des pages</h1>
      <p className="text-gray-500 text-sm mb-6">
        Masquer une page la rend inaccessible aux visiteurs et la retire de la navigation, sans supprimer son contenu — tu peux la réactiver à tout moment.
      </p>

      <div className="flex flex-col gap-3">
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
      </div>

      {message && <p className="text-sm text-gray-700 mt-4">{message}</p>}
    </div>
  )
}
