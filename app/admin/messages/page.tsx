'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Message = {
  id: string
  name: string
  email: string
  message: string
  request_type: string
  created_at: string
}

const LABELS: Record<string, string> = {
  atelier: 'Atelier',
  demo: 'Démonstration',
  rappel: 'Rappel',
  question: 'Question',
  offres: 'Offres',
}

export default function AdminMessages() {
  const [messages, setMessages] = useState<Message[]>([])
  const [filter, setFilter] = useState('tous')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setMessages(data ?? [])
        setLoading(false)
      })
  }, [])

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement...</div>

  const filtered = filter === 'tous' ? messages : messages.filter((m) => m.request_type === filter)

  return (
    <div className="p-6 sm:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Messages de contact</h1>

      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="mb-6 px-4 py-2 border border-gray-300 rounded-lg"
      >
        <option value="tous">Tous les types</option>
        {Object.entries(LABELS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>

      {filtered.length === 0 ? (
        <p className="text-gray-500">Aucun message pour l'instant.</p>
      ) : (
        <div className="grid gap-4">
          {filtered.map((m) => (
            <div key={m.id} className="border border-gray-200 rounded-xl p-4">
              <p className="text-xs inline-block px-2 py-0.5 bg-gray-100 rounded-full text-gray-600 mb-2">
                {LABELS[m.request_type] ?? m.request_type}
              </p>
              <p className="font-semibold text-gray-900">
                {m.name} — <span className="font-normal text-gray-500">{m.email}</span>
              </p>
              <p className="text-gray-700 mt-2">{m.message}</p>
              <p className="text-xs text-gray-400 mt-2">
                {new Date(m.created_at).toLocaleString('fr-FR')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
