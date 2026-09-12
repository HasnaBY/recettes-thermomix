'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type ClientProfile = { id: string; email: string; full_name: string | null }
type Activity = { id: string; event_type: string; detail: string | null; created_at: string }

const EVENT_LABELS: Record<string, string> = {
  recipe_view: '👀 A consulté la recette',
  menu_generated: '🗓️ A généré un menu',
  favorite_added: '⭐ A ajouté un favori',
  tip_view: '💡 A consulté une astuce',
}

export default function AdminClientActivity() {
  const [clients, setClients] = useState<ClientProfile[]>([])
  const [selectedClient, setSelectedClient] = useState('')
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('is_admin', false)
      .order('email')
      .then(({ data }) => setClients(data ?? []))
  }, [])

  useEffect(() => {
    if (!selectedClient) {
      setActivities([])
      return
    }
    setLoading(true)
    supabase
      .from('client_activity')
      .select('*')
      .eq('user_id', selectedClient)
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setActivities(data ?? [])
        setLoading(false)
      })
  }, [selectedClient])

  return (
    <div className="p-6 sm:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Activité des clientes</h1>

      <select
        value={selectedClient}
        onChange={(e) => setSelectedClient(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-6"
      >
        <option value="">Choisir une cliente</option>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.full_name ?? c.email} ({c.email})
          </option>
        ))}
      </select>

      {loading && <p className="text-gray-500">Chargement...</p>}

      {!loading && selectedClient && activities.length === 0 && (
        <p className="text-gray-500">Aucune activité enregistrée pour cette cliente.</p>
      )}

      <div className="flex flex-col gap-2">
        {activities.map((a) => (
          <div key={a.id} className="border border-gray-200 rounded-lg p-3 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-900">{EVENT_LABELS[a.event_type] ?? a.event_type}</p>
              {a.detail && <p className="text-xs text-gray-500">{a.detail}</p>}
            </div>
            <p className="text-xs text-gray-400 whitespace-nowrap ml-3">
              {new Date(a.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}