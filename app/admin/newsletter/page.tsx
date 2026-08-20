'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AdminNewsletter() {
  const [topic, setTopic] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const generate = async () => {
    setLoading(true)
    setError('')
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const response = await fetch('/api/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ type: 'newsletter', input: { topic } }),
      })
      const data = await response.json()
      if (response.ok) setResult(data.text)
      else setError(data.error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 sm:p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Générateur de newsletter</h1>

      <textarea
        placeholder="Sujet de la newsletter (ex: nouvelle recette d'été, rappel challenge du mois...)"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        rows={3}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3"
      />
      <button
        onClick={generate}
        disabled={loading || !topic}
        className="py-2.5 px-6 bg-gray-900 text-white rounded-lg font-medium disabled:opacity-50"
      >
        {loading ? 'Génération...' : 'Générer'}
      </button>

      {error && <p className="text-red-600 text-sm mt-4">{error}</p>}

      {result && (
        <div className="mt-6 border border-gray-200 rounded-xl p-4">
          <p className="text-gray-700 whitespace-pre-wrap">{result}</p>
        </div>
      )}
    </div>
  )
}