'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type ClientProfile = { id: string; email: string; full_name: string | null }

export default function AssignMenu() {
  const [clients, setClients] = useState<ClientProfile[]>([])
  const [selectedClient, setSelectedClient] = useState('')
  const [nbPlats, setNbPlats] = useState('5')
  const [nbDesserts, setNbDesserts] = useState('2')
  const [nbBoissons, setNbBoissons] = useState('0')
  const [nbPains, setNbPains] = useState('0')
  const [source, setSource] = useState('all')
  const [generating, setGenerating] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('is_admin', false)
      .eq('approved', true)
      .order('email')
      .then(({ data }) => setClients(data ?? []))
  }, [])

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setGenerating(true)
    setError('')
    setMessage('')

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const response = await fetch('/api/generate-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({
          nbPlats: parseInt(nbPlats),
          nbDesserts: parseInt(nbDesserts),
          nbBoissons: parseInt(nbBoissons) || 0,
          nbPains: parseInt(nbPains) || 0,
          source,
          targetUserId: selectedClient,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error ?? 'Une erreur est survenue')
      } else {
        setMessage('Menu envoyé à la cliente avec succès !')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="p-6 sm:p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Générer un menu pour une cliente</h1>
      <p className="text-gray-500 text-sm mb-6">
        Ce menu s'ajoute à côté de ceux que la cliente génère elle-même — il ne les remplace jamais.
      </p>

      <form onSubmit={handleGenerate} className="flex flex-col gap-4">
        <div>
          <label className="block mb-1 text-sm text-gray-600">Cliente</label>
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">Choisir une cliente</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name ?? c.email} ({c.email})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 text-sm text-gray-600">Recettes à utiliser</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">Toutes les recettes du site</option>
            <option value="favorites">Favoris de la cliente</option>
          </select>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block mb-1 text-sm text-gray-600">Plats</label>
            <input
              type="number"
              min="0"
              value={nbPlats}
              onChange={(e) => setNbPlats(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex-1">
            <label className="block mb-1 text-sm text-gray-600">Desserts/goûters</label>
            <input
              type="number"
              min="0"
              value={nbDesserts}
              onChange={(e) => setNbDesserts(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block mb-1 text-sm text-gray-600">Boissons</label>
            <input
              type="number"
              min="0"
              value={nbBoissons}
              onChange={(e) => setNbBoissons(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex-1">
            <label className="block mb-1 text-sm text-gray-600">Pains</label>
            <input
              type="number"
              min="0"
              value={nbPains}
              onChange={(e) => setNbPains(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {message && <p className="text-green-700 text-sm">{message}</p>}

        <button
          type="submit"
          disabled={generating || !selectedClient}
          className="py-2.5 bg-gray-900 text-white rounded-lg font-medium disabled:opacity-50"
        >
          {generating ? 'Génération...' : 'Générer et envoyer le menu'}
        </button>
      </form>
    </div>
  )
}