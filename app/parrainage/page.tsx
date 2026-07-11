'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AdminEditButton from '@/components/AdminEditButton'

type ReferralContent = { explanation: string; rewards: string[] }

export default function Parrainage() {
  const [visible, setVisible] = useState(true)
  const [checkingVisibility, setCheckingVisibility] = useState(true)
  const [content, setContent] = useState<ReferralContent | null>(null)
  const [referrerName, setReferrerName] = useState('')
  const [referrerEmail, setReferrerEmail] = useState('')
  const [referredName, setReferredName] = useState('')
  const [referredEmail, setReferredEmail] = useState('')
  const [referredPhone, setReferredPhone] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('show_parrainage')
      .eq('id', 1)
      .single()
      .then(({ data }) => {
        setVisible(data?.show_parrainage ?? true)
        setCheckingVisibility(false)
      })

    supabase
      .from('referral_content')
      .select('*')
      .eq('id', 1)
      .single()
      .then(({ data }) => data && setContent(data as any))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const { error } = await supabase.from('referrals').insert({
      referrer_name: referrerName,
      referrer_email: referrerEmail,
      referred_name: referredName,
      referred_email: referredEmail || null,
      referred_phone: referredPhone || null,
    })

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
  }

  if (checkingVisibility) return <div className="p-8 text-center text-gray-500">Chargement...</div>

  if (!visible) {
    return (
      <div className="p-8 text-center text-gray-500 max-w-md mx-auto">
        Cette page n'est pas disponible pour le moment.
        <AdminEditButton href="/admin/site-settings" />
      </div>
    )
  }

  if (!content) return <div className="p-8 text-center text-gray-500">Chargement...</div>

  return (
    <div className="px-6 sm:px-8 py-12 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-4 text-center">Programme de parrainage</h1>
      <p className="text-gray-600 text-center mb-8">{content.explanation}</p>

      <div className="grid gap-3 mb-10">
        {content.rewards?.map((r, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-3 flex gap-2 items-center">
            <span>🎁</span>
            <span className="text-gray-700 text-sm">{r}</span>
          </div>
        ))}
      </div>

      <div className="border border-gray-200 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Déclarer un(e) filleul(e)</h2>
        {sent ? (
          <p className="text-gray-600">Merci ! Je prends contact avec ton/ta filleul(e) rapidement.</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <p className="text-sm text-gray-500 -mb-1">Tes coordonnées</p>
            <input
              placeholder="Ton nom"
              value={referrerName}
              onChange={(e) => setReferrerName(e.target.value)}
              required
              className="px-4 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="email"
              placeholder="Ton email"
              value={referrerEmail}
              onChange={(e) => setReferrerEmail(e.target.value)}
              required
              className="px-4 py-2 border border-gray-300 rounded-lg"
            />

            <p className="text-sm text-gray-500 -mb-1 mt-2">Coordonnées de ton/ta filleul(e)</p>
            <input
              placeholder="Son nom"
              value={referredName}
              onChange={(e) => setReferredName(e.target.value)}
              required
              className="px-4 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="email"
              placeholder="Son email (optionnel)"
              value={referredEmail}
              onChange={(e) => setReferredEmail(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            />
            <input
              placeholder="Son téléphone (optionnel)"
              value={referredPhone}
              onChange={(e) => setReferredPhone(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            />

            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              className="py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-black transition-colors"
            >
              Déclarer mon/ma filleul(e)
            </button>
          </form>
        )}
      </div>

      <AdminEditButton href="/admin/referrals" />
    </div>
  )
}
