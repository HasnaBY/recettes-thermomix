'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Referral = {
  id: string
  referrer_name: string
  referrer_email: string
  referred_name: string
  referred_email: string | null
  referred_phone: string | null
  status: string
  created_at: string
}

export default function AdminReferrals() {
  const [explanation, setExplanation] = useState('')
  const [rewards, setRewards] = useState<string[]>([])
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()

  const loadReferrals = async () => {
    const { data } = await supabase
      .from('referrals')
      .select('*')
      .order('created_at', { ascending: false })
    setReferrals(data ?? [])
  }

  useEffect(() => {
    supabase
      .from('referral_content')
      .select('*')
      .eq('id', 1)
      .single()
      .then(({ data }) => {
        if (data) {
          setExplanation(data.explanation ?? '')
          setRewards(data.rewards ?? [])
        }
        setLoading(false)
      })

    loadReferrals()
  }, [])

  const updateReward = (index: number, value: string) => {
    setRewards((prev) => prev.map((r, i) => (i === index ? value : r)))
  }
  const removeReward = (index: number) => {
    setRewards((prev) => prev.filter((_, i) => i !== index))
  }
  const addReward = () => {
    setRewards((prev) => [...prev, ''])
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    const { error } = await supabase
      .from('referral_content')
      .update({ explanation, rewards })
      .eq('id', 1)

    setSaving(false)
    setMessage(error ? error.message : 'Enregistré avec succès !')
  }

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('referrals').update({ status }).eq('id', id)
    loadReferrals()
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement...</div>

  return (
    <div className="p-6 sm:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Gérer le parrainage</h1>

      <form onSubmit={handleSave} className="flex flex-col gap-6 mb-10">
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">Explication</label>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block mb-3 text-sm font-medium text-gray-700">Récompenses</label>
          <div className="flex flex-col gap-2">
            {rewards.map((r, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={r}
                  onChange={(e) => updateReward(i, e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeReward(i)}
                  className="px-3 text-red-600 border border-red-300 rounded-lg text-sm"
                >
                  Retirer
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addReward} className="mt-2 text-sm text-gray-700 underline">
            + Ajouter une récompense
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
        Parrainages déclarés ({referrals.length})
      </h2>
      {referrals.length === 0 ? (
        <p className="text-gray-500">Aucun parrainage pour l'instant.</p>
      ) : (
        <div className="grid gap-3">
          {referrals.map((r) => (
            <div key={r.id} className="border border-gray-200 rounded-xl p-4">
              <p className="text-sm text-gray-500">
                Parrain(e) : <span className="text-gray-900">{r.referrer_name}</span> ({r.referrer_email})
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Filleul(e) : <span className="text-gray-900">{r.referred_name}</span>
                {r.referred_email && ` — ${r.referred_email}`}
                {r.referred_phone && ` — ${r.referred_phone}`}
              </p>
              <select
                value={r.status}
                onChange={(e) => updateStatus(r.id, e.target.value)}
                className="mt-2 px-3 py-1 border border-gray-300 rounded-lg text-sm"
              >
                <option value="en attente">En attente</option>
                <option value="contacté">Contacté</option>
                <option value="commande passée">Commande passée</option>
                <option value="récompense envoyée">Récompense envoyée</option>
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
