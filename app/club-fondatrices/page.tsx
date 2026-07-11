'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AdminEditButton from '@/components/AdminEditButton'

type ClubContent = {
  intro: string
  benefits: string[]
  spots_remaining: number
}

export default function ClubFondatrices() {
  const [visible, setVisible] = useState(true)
  const [checkingVisibility, setCheckingVisibility] = useState(true)
  const [content, setContent] = useState<ClubContent | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('show_club')
      .eq('id', 1)
      .single()
      .then(({ data }) => {
        setVisible(data?.show_club ?? true)
        setCheckingVisibility(false)
      })

    supabase
      .from('club_content')
      .select('*')
      .eq('id', 1)
      .single()
      .then(({ data }) => data && setContent(data as any))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const { error } = await supabase.from('club_signups').insert({ name, email, message })

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
      <h1 className="text-3xl font-bold text-gray-900 mb-4 text-center">🎁 Club Fondatrices</h1>
      <p className="text-gray-600 text-center mb-2">{content.intro}</p>
      {content.spots_remaining > 0 && (
        <p className="text-center text-amber-600 font-medium mb-8">
          Plus que {content.spots_remaining} places disponibles !
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
        {content.benefits?.map((b, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-3 flex gap-2 items-center">
            <span>✨</span>
            <span className="text-gray-700 text-sm">{b}</span>
          </div>
        ))}
      </div>

      <div className="border border-gray-200 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Je souhaite rejoindre le Club</h2>
        {sent ? (
          <p className="text-gray-600">Merci ! Je reviens vers toi très vite pour la suite.</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              placeholder="Ton nom"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="px-4 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="email"
              placeholder="Ton email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="px-4 py-2 border border-gray-300 rounded-lg"
            />
            <textarea
              placeholder="Un message (optionnel)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              className="py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-black transition-colors"
            >
              Je souhaite rejoindre le Club
            </button>
          </form>
        )}
      </div>

      <AdminEditButton href="/admin/club" />
    </div>
  )
}
