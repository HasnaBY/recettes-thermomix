'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Signup = { id: string; name: string; email: string; message: string | null; created_at: string }

export default function AdminClub() {
  const [intro, setIntro] = useState('')
  const [benefits, setBenefits] = useState<string[]>([])
  const [spotsRemaining, setSpotsRemaining] = useState(30)
  const [showSpotsRemaining, setShowSpotsRemaining] = useState(true)
  const [signups, setSignups] = useState<Signup[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('club_content')
      .select('*')
      .eq('id', 1)
      .single()
      .then(({ data }) => {
        if (data) {
          setIntro(data.intro ?? '')
          setBenefits(data.benefits ?? [])
          setSpotsRemaining(data.spots_remaining ?? 30)
          setShowSpotsRemaining(data.show_spots_remaining ?? true)
        }
        setLoading(false)
      })

    supabase
      .from('club_signups')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => setSignups(data ?? []))
  }, [])

  const updateBenefit = (index: number, value: string) => {
    setBenefits((prev) => prev.map((b, i) => (i === index ? value : b)))
  }
  const removeBenefit = (index: number) => {
    setBenefits((prev) => prev.filter((_, i) => i !== index))
  }
  const addBenefit = () => {
    setBenefits((prev) => [...prev, ''])
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    const { error } = await supabase
      .from('club_content')
      .update({
        intro,
        benefits,
        spots_remaining: spotsRemaining,
        show_spots_remaining: showSpotsRemaining,
      })
      .eq('id', 1)

    setSaving(false)
    setMessage(error ? error.message : 'Enregistré avec succès !')
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement...</div>

  return (
    <div className="p-6 sm:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Gérer  Le Cercle With Love </h1>

      <form onSubmit={handleSave} className="flex flex-col gap-6 mb-10">
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">Introduction</label>
          <textarea
            value={intro}
            onChange={(e) => setIntro(e.target.value)}
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">Places restantes</label>
          <input
            type="number"
            value={spotsRemaining}
            onChange={(e) => setSpotsRemaining(parseInt(e.target.value) || 0)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div className="flex justify-between items-center border border-gray-200 rounded-xl p-4">
          <span className="text-gray-900 font-medium">Afficher le nombre de places restantes</span>
          <button
            type="button"
            onClick={() => setShowSpotsRemaining(!showSpotsRemaining)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium ${
              showSpotsRemaining ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'
            }`}
          >
            {showSpotsRemaining ? 'Visible' : 'Masqué'}
          </button>
        </div>

        <div>
          <label className="block mb-3 text-sm font-medium text-gray-700">Avantages</label>
          <div className="flex flex-col gap-2">
            {benefits.map((b, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={b}
                  onChange={(e) => updateBenefit(i, e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeBenefit(i)}
                  className="px-3 text-red-600 border border-red-300 rounded-lg text-sm"
                >
                  Retirer
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addBenefit} className="mt-2 text-sm text-gray-700 underline">
            + Ajouter un avantage
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
        Demandes d'inscription ({signups.length})
      </h2>
      {signups.length === 0 ? (
        <p className="text-gray-500">Aucune demande pour l'instant.</p>
      ) : (
        <div className="grid gap-3">
          {signups.map((s) => (
            <div key={s.id} className="border border-gray-200 rounded-xl p-4">
              <p className="font-semibold text-gray-900">
                {s.name} — <span className="font-normal text-gray-500">{s.email}</span>
              </p>
              {s.message && <p className="text-gray-700 mt-1">{s.message}</p>}
              <p className="text-xs text-gray-400 mt-2">
                {new Date(s.created_at).toLocaleString('fr-FR')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
