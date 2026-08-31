'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import MenuPdfDownloadButton from '@/components/MenuPdfDownloadButton'
import RecipePickerModal from '@/components/RecipePickerModal'
import { getNextMonday, toDateInputValue } from '@/lib/dateHelpers'

type ClientProfile = { id: string; email: string; full_name: string | null }
type MenuItem = { recipe_id: string; recipe_title: string }
type Menu = { plats: MenuItem[]; desserts: MenuItem[]; boissons: MenuItem[]; pains: MenuItem[] }
type ItemType = 'plats' | 'desserts' | 'boissons' | 'pains'

export default function AssignMenu() {
  const [clients, setClients] = useState<ClientProfile[]>([])
  const [selectedClient, setSelectedClient] = useState('')
  const [sendToAll, setSendToAll] = useState(false)
  const [nbPlats, setNbPlats] = useState('5')
  const [nbDesserts, setNbDesserts] = useState('5')
  const [nbBoissons, setNbBoissons] = useState('0')
  const [nbPains, setNbPains] = useState('0')
  const [source, setSource] = useState('all')
  const [periodStart, setPeriodStart] = useState(toDateInputValue(getNextMonday()))

  const [previewMenu, setPreviewMenu] = useState<Menu | null>(null)
  const [swappingId, setSwappingId] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [pickerFor, setPickerFor] = useState<{ itemType: ItemType; oldRecipeId: string } | null>(null)

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

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault()
    setGenerating(true)
    setError('')
    setMessage('')
    setPreviewMenu(null)
    setSent(false)

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
          source: sendToAll ? 'all' : source,
          targetUserId: sendToAll ? clients[0]?.id : selectedClient,
          preview: true,
          periodStart,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error ?? 'Une erreur est survenue')
      } else {
        setPreviewMenu(data.menu)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleRandomSwap = async (itemType: ItemType, oldRecipeId: string) => {
    if (!previewMenu) return
    setSwappingId(oldRecipeId)
    setError('')

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const response = await fetch('/api/swap-preview-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({
          menu: previewMenu,
          itemType,
          oldRecipeId,
          source: sendToAll ? 'all' : source,
          targetUserId: sendToAll ? clients[0]?.id : selectedClient,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error ?? 'Une erreur est survenue')
      } else {
        setPreviewMenu(data.menu)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSwappingId(null)
    }
  }

  const handleManualSwap = async (recipeId: string) => {
    if (!pickerFor || !previewMenu) return
    const { itemType, oldRecipeId } = pickerFor

    setPickerFor(null)
    setSwappingId(oldRecipeId)
    setError('')

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const response = await fetch('/api/swap-preview-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({
          menu: previewMenu,
          itemType,
          oldRecipeId,
          newRecipeId: recipeId,
          source: sendToAll ? 'all' : source,
          targetUserId: sendToAll ? clients[0]?.id : selectedClient,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error ?? 'Une erreur est survenue')
      } else {
        setPreviewMenu(data.menu)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSwappingId(null)
    }
  }

  const handleSend = async () => {
    if (!previewMenu) return
    setSending(true)
    setError('')

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const response = await fetch('/api/save-generated-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({
          targetUserId: sendToAll ? undefined : selectedClient,
          targetUserIds: sendToAll ? clients.map((c) => c.id) : undefined,
          menu: previewMenu,
          params: {
            nbPlats: parseInt(nbPlats),
            nbDesserts: parseInt(nbDesserts),
            nbBoissons: parseInt(nbBoissons),
            nbPains: parseInt(nbPains),
            source: sendToAll ? 'all' : source,
            periodStart,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error ?? 'Une erreur est survenue')
      } else {
        setMessage(sendToAll ? `Menu envoyé à ${data.count} cliente(s) avec succès !` : 'Menu envoyé à la cliente avec succès !')
        setSent(true)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  const excludeIds = previewMenu
    ? [
        ...(previewMenu.plats ?? []).map((i) => i.recipe_id),
        ...(previewMenu.desserts ?? []).map((i) => i.recipe_id),
        ...(previewMenu.boissons ?? []).map((i) => i.recipe_id),
        ...(previewMenu.pains ?? []).map((i) => i.recipe_id),
      ]
    : []

  const renderSection = (title: string, items: MenuItem[] | undefined, bg: string, itemType: ItemType) => {
    if (!items || items.length === 0) return null
    return (
      <div className="mb-4">
        <p className="text-sm font-semibold text-gray-900 mb-2">{title}</p>
        <div className="flex flex-col gap-1.5">
          {items.map((item) => (
            <div key={item.recipe_id} className={`flex justify-between items-center px-3 py-2 ${bg} rounded-lg`}>
              <Link href={`/recipes/${item.recipe_id}`} target="_blank" className="text-sm text-gray-800 no-underline flex-1">
                {item.recipe_title}
              </Link>
              {!sent && (
                <div className="flex gap-2 shrink-0 ml-2">
                  <button
                    onClick={() => handleRandomSwap(itemType, item.recipe_id)}
                    disabled={swappingId === item.recipe_id}
                    className="text-xs text-gray-600 underline disabled:opacity-50"
                  >
                    {swappingId === item.recipe_id ? '...' : '🎲'}
                  </button>
                  <button
                    onClick={() => setPickerFor({ itemType, oldRecipeId: item.recipe_id })}
                    className="text-xs text-gray-600 underline"
                  >
                    🔍 Choisir
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 sm:p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Générer un menu pour une cliente</h1>
      <p className="text-gray-500 text-sm mb-6">Prévisualise, ajuste et télécharge le menu avant de l'envoyer.</p>

      <form onSubmit={handlePreview} className="flex flex-col gap-4 mb-6">
        <label className="flex items-center gap-2 text-sm text-gray-700 border border-gray-200 rounded-lg p-3">
          <input
            type="checkbox"
            checked={sendToAll}
            onChange={(e) => {
              setSendToAll(e.target.checked)
              setPreviewMenu(null)
              setMessage('')
              setSent(false)
            }}
          />
          Envoyer le même menu à toutes mes clientes ({clients.length})
        </label>

        {!sendToAll && (
          <div>
            <label className="block mb-1 text-sm text-gray-600">Cliente</label>
            <select
              value={selectedClient}
              onChange={(e) => {
                setSelectedClient(e.target.value)
                setPreviewMenu(null)
                setMessage('')
                setSent(false)
              }}
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
        )}

        <div>
          <label className="block mb-1 text-sm text-gray-600">Semaine du (lundi)</label>
          <input
            type="date"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        {!sendToAll && (
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
        )}

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
          disabled={generating || (!sendToAll && !selectedClient) || (sendToAll && clients.length === 0)}
          className="py-2.5 bg-gray-900 text-white rounded-lg font-medium disabled:opacity-50"
        >
          {generating ? 'Génération...' : 'Prévisualiser le menu'}
        </button>
      </form>

      {previewMenu && (
        <div className="border border-gray-200 rounded-xl p-4">
          <p className="text-sm font-bold text-gray-900 mb-3">
            {sent ? 'Menu envoyé' : `Aperçu — ${sendToAll ? `sera envoyé à ${clients.length} cliente(s)` : 'non encore envoyé'}`}
          </p>

          {renderSection('Plats', previewMenu.plats, 'bg-blue-50', 'plats')}
          {renderSection('Desserts / goûters', previewMenu.desserts, 'bg-pink-50', 'desserts')}
          {renderSection('Boissons', previewMenu.boissons, 'bg-green-50', 'boissons')}
          {renderSection('Pains', previewMenu.pains, 'bg-gray-100', 'pains')}

          <div className="mt-4">
            <MenuPdfDownloadButton menu={previewMenu} origin="admin" periodStart={periodStart} />
          </div>

          {!sent && (
            <button
              onClick={handleSend}
              disabled={sending}
              className="py-2 px-5 bg-gray-900 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {sending ? 'Envoi...' : sendToAll ? `Envoyer à ${clients.length} cliente(s)` : 'Envoyer à la cliente'}
            </button>
          )}
        </div>
      )}

      {pickerFor && (
        <RecipePickerModal
          excludeIds={excludeIds}
          onSelect={(recipe) => handleManualSwap(recipe.id)}
          onClose={() => setPickerFor(null)}
        />
      )}
    </div>
  )
}